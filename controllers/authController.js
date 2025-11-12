const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const generateTeacherCode = require('../utils/generateTeacherCode');
const { verifyIdToken } = require('../config/firebase');
const signToken = (id, usertype) => {
  return jwt.sign({ id, usertype }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m' // Access token nên có hạn ngắn
  });
};
const getCookieOptions = (expiresIn) => {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict', 
    expires: new Date(Date.now() + expiresIn),
    path: "/",
  };
};
const createRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Mật khẩu không đúng' });

    const token = signToken(user._id, user.role); 
    const refreshToken = createRefreshToken();

    const accessTokenExpiresIn = 15 * 60 * 1000;
    const refreshTokenExpiresIn = 7 * 24 * 60 * 60 * 1000;

    // Lọc token hết hạn
    user.refreshTokens = user.refreshTokens.filter(t => t.expiresAt > new Date());

    // Thêm token mới
    user.refreshTokens.push({
      token: refreshToken,
      expiresAt: new Date(Date.now() + refreshTokenExpiresIn)
    });

    // Giới hạn số lượng token
    const MAX_TOKENS = 5;
    if (user.refreshTokens.length > MAX_TOKENS) {
      user.refreshTokens = user.refreshTokens.slice(-MAX_TOKENS);
    }

    await user.save({ validateBeforeSave: false });

    res.cookie('accessToken', token, getCookieOptions(accessTokenExpiresIn));
    res.cookie('refreshToken', refreshToken, getCookieOptions(refreshTokenExpiresIn));

    const userForFrontend = {
      _id: user._id,
      email: user.email,
      userName: user.fullName, 
      phone: user.phone,
      usertype: user.role
    };

    res.status(200).json({ success: true, message: 'Đăng nhập thành công', user: userForFrontend });
  } catch (error) {
    console.error('Lỗi login:', error);
    res.status(500).json({ success: false, message: 'Lỗi đăng nhập', error: error.message });
  }
};
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) return res.status(400).json({ success: false, message: 'Thiếu refresh token' });

    const user = await User.findOne({ 'refreshTokens.token': refreshToken });
    if (!user) return res.status(401).json({ success: false, message: 'Refresh token không hợp lệ hoặc đã hết hạn' });

    const newAccessToken = signToken(user._id, user.role);
    const newRefreshToken = createRefreshToken();
    const refreshTokenExpiresIn = 7 * 24 * 60 * 60 * 1000;

    // Xóa token cũ đang dùng
    user.refreshTokens = user.refreshTokens.filter(t => t.token !== refreshToken);

    // Lọc token hết hạn
    user.refreshTokens = user.refreshTokens.filter(t => t.expiresAt > new Date());

    // Thêm token mới
    user.refreshTokens.push({
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + refreshTokenExpiresIn)
    });

    // Giới hạn số lượng token
    const MAX_TOKENS = 5;
    if (user.refreshTokens.length > MAX_TOKENS) {
      user.refreshTokens = user.refreshTokens.slice(-MAX_TOKENS);
    }

    await user.save({ validateBeforeSave: false });

    const accessTokenExpiresIn = 15 * 60 * 1000;
    res.cookie('accessToken', newAccessToken, getCookieOptions(accessTokenExpiresIn));
    res.cookie('refreshToken', newRefreshToken, getCookieOptions(refreshTokenExpiresIn));

    res.status(200).json({ success: true, message: 'Làm mới token thành công' });
  } catch (error) {
    console.error('Lỗi refresh token:', error);
    res.status(500).json({ success: false, message: 'Lỗi làm mới token', error: error.message });
  }
};
  exports.register = async (req, res) => {
    try {
      const { email, password, fullName, phone, role } = req.body;
  

      const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email hoặc số điện thoại đã được sử dụng'
        });
      }
  

      const user = await User.create({ email, password, fullName, phone, role });
  
  /*
      const emailToken = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      );
  
      const verifyLink = `${process.env.BACKEND_URL}/api/auth/verify-email?token=${emailToken}`;
  
      // ✅ Gửi email xác minh
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
  
      await transporter.sendMail({
        from: `"Hệ thống quản lý" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Xác minh email của bạn',
        html: `
          <h3>Xin chào ${fullName || 'bạn'},</h3>
          <p>Vui lòng nhấn vào link sau để xác minh email:</p>
          <a href="${verifyLink}" target="_blank">${verifyLink}</a>
          <p>Link này sẽ hết hạn sau 1 giờ.</p>
        `
      });

      */
      res.status(201).json({
        success: true,
        message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác minh tài khoản.'
      });
  
    } catch (error) {
      console.error('❌ Lỗi register:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi trong quá trình đăng ký',
        error: error.message
      });
    }
  };
exports.verifyEmail = async (req, res) => {
    try {
      const { token } = req.query;
      if (!token)
        return res.status(400).json({ success: false, message: 'Thiếu token xác minh' });
  
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
  
      if (!user)
        return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
  
      if (user.isVerified)
        return res.status(200).json({ success: true, message: 'Tài khoản đã xác minh trước đó' });
  
      user.isVerified = true;
      await user.save({ validateBeforeSave: false });
  
      res.status(200).json({
        success: true,
        message: 'Xác minh email thành công! Bạn có thể đăng nhập ngay bây giờ.'
      });
    } catch (error) {
      console.error('❌ Lỗi verifyEmail:', error);
      res.status(400).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
    }
  };

/**
 * Cập nhật giáo án.
 * 
 * @param {Object} req.body - Giáo án mới.
 * @param {string} req.params.id - ID của giáo án cần cập nhật.
 * @param {number} req.resource.version - Phiên bản hiện tại của giáo án.
 * @return {Object} - Kết quả trả về sau dạng JSON.
 * @property {boolean} success - Trạng thái của yêu cầu.
 * @property {string} message - Tin nhắn của yêu cầu.
 * @property {Object} data - Giáo án đã được cập nhật.
 */
/*******  d39a53e2-c565-4a73-9a6e-79e78d91824a  *******/
exports.updateLessonPlan = async (req, res) => {
  try {
    const lessonPlan = await LessonPlan.findByIdAndUpdate(
      req.params.id,
      { ...req.body, version: req.resource.version + 1 },
      { new: true, runValidators: true }
    ).populate(['subject', 'grade']);

    res.json({
      success: true,
      message: 'Cập nhật giáo án thành công',
      data: lessonPlan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật giáo án',
      error: error.message
    });
  }
};

exports.deleteLessonPlan = async (req, res) => {
  try {
    await LessonPlan.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Xóa giáo án thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa giáo án',
      error: error.message
    });
  }
};

exports.generateLessonPlanWithAI = async (req, res) => {
  try {
    const { subject, grade, title, objectives, duration } = req.body;
    const teacherProfile = await TeacherProfile.findOne({ user: req.user._id });

    // Call external AI API
    const aiResponse = await callAIService({
      endpoint: '/generate-lesson-plan',
      data: { subject, grade, title, objectives, duration }
    });

    // Track AI usage
    await AIUsage.create({
      user: req.user._id,
      feature: 'lessonPlan',
      aiProvider: aiResponse.provider,
      model: aiResponse.model,
      prompt: JSON.stringify(req.body),
      tokensUsed: aiResponse.tokensUsed,
      processingTime: aiResponse.processingTime,
      success: true
    });

    // Create lesson plan with AI content
    const lessonPlan = await LessonPlan.create({
      teacher: teacherProfile._id,
      subject,
      grade,
      title,
      ...aiResponse.content,
      isAIGenerated: true,
      aiPrompt: JSON.stringify(req.body),
      aiModel: aiResponse.model,
      generationTime: new Date()
    });

    await lessonPlan.populate(['subject', 'grade']);

    res.status(201).json({
      success: true,
      message: 'Tạo giáo án bằng AI thành công',
      data: lessonPlan
    });
  } catch (error) {
    await AIUsage.create({
      user: req.user._id,
      feature: 'lessonPlan',
      success: false,
      errorMessage: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Lỗi tạo giáo án bằng AI',
      error: error.message
    });
  }
};
exports.logout = async (req, res) => {
  try {
    // Đọc refreshToken từ cookie
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      const user = await User.findOne({ 'refreshTokens.token': refreshToken });
      if (user) {
        // Xóa refresh token ra khỏi danh sách
        user.refreshTokens = user.refreshTokens.filter(
          (t) => t.token !== refreshToken
        );
        await user.save({ validateBeforeSave: false });
      }
    }


    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
    };
    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);

    res.status(200).json({
      success: true,
      message: 'Đăng xuất thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi đăng xuất',
      error: error.message
    });
  }
};

exports.approveLessonPlan = async (req, res) => {
  try {
    const lessonPlan = await LessonPlan.findByIdAndUpdate(
      req.params.id,
      {
        status: 'approved',
        approvedBy: req.user._id,
        approvedAt: Date.now()
      },
      { new: true }
    ).populate(['subject', 'grade', 'approvedBy']);

    // TODO: Send notification to teacher

    res.json({
      success: true,
      message: 'Phê duyệt giáo án thành công',
      data: lessonPlan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi phê duyệt giáo án',
      error: error.message
    });
  }
};
exports.forgotPassword = async (req, res, next) => {
    const { email } = req.body;
    try {
      // 1. Kiểm tra user tồn tại
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'Không tìm thấy người dùng với email này.' });
      }
  
      // 2. Tạo token reset
      const resetToken = user.createPasswordResetToken();
      await user.save({ validateBeforeSave: false });
  
      // 3. Gửi email (chưa thực hiện ở đây, chỉ mô phỏng)
      const resetURL = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`;
  
      // Thực tế bạn nên gửi email, ở đây chỉ trả về link demo
      res.status(200).json({
        status: 'success',
        message: 'Token đặt lại mật khẩu đã được gửi tới email.',
        resetURL,
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ message: 'Lỗi khi gửi email. Thử lại sau!' });
    }
  };
exports.resetPassword = async (req, res, next) => {
    const crypto = require('crypto');
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  
    // 1. Tìm user với token còn hạn
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });
  
    if (!user) {
      return res.status(400).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
    }
  
    // 2. Cập nhật mật khẩu
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
  
    // 3. Đăng nhập lại user
    createSendToken(user, 200, res);
  };
  exports.updatePassword = async (req, res, next) => {
    // 1. Lấy user từ DB
    const user = await User.findById(req.user.id).select('+password');
  
    // 2. Kiểm tra mật khẩu hiện tại
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
      return res.status(401).json({ message: 'Mật khẩu hiện tại không đúng!' });
    }
  
    // 3. Cập nhật mật khẩu mới
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
  
    // 4. Gửi token đăng nhập mới
    createSendToken(user, 200, res);
  };
exports.getMe = async (req, res, next) => {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      status: 'success',
      data: { user },
    });
  };

// Xác thực Firebase token và sync với MongoDB
exports.verifyFirebaseAuth = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu Firebase ID token'
      });
    }

    // Verify Firebase token
    const decodedToken = await verifyIdToken(idToken);
    console.log('🔍 Firebase token verified:', {
      uid: decodedToken.uid,
      email: decodedToken.email,
      provider: decodedToken.firebase?.sign_in_provider
    });
    
    // Tìm hoặc tạo user trong MongoDB
    let user = await User.findOne({ firebaseUID: decodedToken.uid });
    
    if (!user) {
      // Tìm theo email nếu chưa có firebaseUID
      user = await User.findOne({ email: decodedToken.email });
      
      if (user) {
        console.log('📎 Linking existing user with Firebase UID:', user._id);
        // Link Firebase UID với user hiện có
        user.firebaseUID = decodedToken.uid;
        const provider = decodedToken.firebase?.sign_in_provider || 'password';
        const providerMap = {
          'google.com': 'google',
          'facebook.com': 'facebook',
          'password': 'email'
        };
        user.authProvider = providerMap[provider] || 'email';
        user.isVerified = decodedToken.email_verified || user.isVerified;
        user.emailVerifiedAt = decodedToken.email_verified ? new Date() : user.emailVerifiedAt;
        
        if (decodedToken.picture) {
          user.avatar = decodedToken.picture;
          user.providerData = {
            providerId: provider,
            photoURL: decodedToken.picture,
            displayName: decodedToken.name || user.fullName
          };
        }
        
        await user.save({ validateBeforeSave: false });
        console.log('✅ User linked with Firebase UID');
      } else {
        console.log('🆕 Creating new user from Firebase');
        // Tạo user mới từ Firebase
        const provider = decodedToken.firebase?.sign_in_provider || 'password';
        const providerMap = {
          'google.com': 'google',
          'facebook.com': 'facebook',
          'password': 'email'
        };
        
        // Tạo user mới từ Firebase - không set phone để tránh duplicate key error
        const newUserData = {
          email: decodedToken.email,
          firebaseUID: decodedToken.uid,
          authProvider: providerMap[provider] || 'email',
          fullName: decodedToken.name || decodedToken.email.split('@')[0],
          avatar: decodedToken.picture || null,
          isVerified: decodedToken.email_verified || false,
          emailVerifiedAt: decodedToken.email_verified ? new Date() : null,
          role: 'teacher', // Default role
          providerData: {
            providerId: provider,
            photoURL: decodedToken.picture,
            displayName: decodedToken.name
          }
        };
        
        // Chỉ set phone nếu có trong decodedToken (không set nếu null/undefined)
        if (decodedToken.phone_number) {
          newUserData.phone = decodedToken.phone_number;
        }
        // Không set phone field nếu không có - để tránh duplicate key error với null
        
        try {
          user = await User.create(newUserData);
          console.log('✅ New user created in MongoDB:', user._id);
          console.log('   Email:', user.email);
          console.log('   FirebaseUID:', user.firebaseUID);
          const mongoose = require('mongoose');
          console.log('   Database:', mongoose.connection.db?.databaseName || 'unknown');
          
          // Verify user was actually saved
          const verifyUser = await User.findById(user._id);
          if (verifyUser) {
            console.log('   ✅ Verified: User exists in database');
          } else {
            console.error('   ❌ ERROR: User was not saved to database!');
          }
        } catch (createError) {
          console.error('❌ Error creating user:', createError);
          if (createError.code === 11000) {
            // Duplicate key error - user might have been created by another request
            console.log('⚠️ Duplicate key error, trying to find existing user...');
            user = await User.findOne({ 
              $or: [
                { firebaseUID: decodedToken.uid },
                { email: decodedToken.email }
              ]
            });
            if (user) {
              console.log('✅ Found existing user:', user._id);
            } else {
              throw createError;
            }
          } else {
            throw createError;
          }
        }
      }
    } else {
      console.log('👤 User already exists in MongoDB:', user._id);
      console.log('   Email:', user.email);
      console.log('   FirebaseUID:', user.firebaseUID);
      console.log('   Database:', require('mongoose').connection.db?.databaseName || 'unknown');
      // Cập nhật thông tin từ Firebase
      if (decodedToken.email_verified && !user.isVerified) {
        user.isVerified = true;
        user.emailVerifiedAt = new Date();
      }
      
      if (decodedToken.picture && decodedToken.picture !== user.avatar) {
        user.avatar = decodedToken.picture;
        if (user.providerData) {
          user.providerData.photoURL = decodedToken.picture;
          user.providerData.displayName = decodedToken.name || user.fullName;
        }
      }
      
      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });
      console.log('✅ User info updated from Firebase');
      
      // Verify user was actually saved
      const verifyUser = await User.findById(user._id);
      if (verifyUser) {
        console.log('   ✅ Verified: User exists in database after update');
      } else {
        console.error('   ❌ ERROR: User was not saved to database after update!');
      }
    }

    // Tạo JWT token để tương thích với hệ thống hiện tại
    const token = signToken(user._id, user.role);
    const refreshToken = createRefreshToken();
    const refreshTokenExpiresIn = 7 * 24 * 60 * 60 * 1000;

    // Lọc token hết hạn
    user.refreshTokens = user.refreshTokens.filter(t => t.expiresAt > new Date());
    user.refreshTokens.push({
      token: refreshToken,
      expiresAt: new Date(Date.now() + refreshTokenExpiresIn)
    });

    const MAX_TOKENS = 5;
    if (user.refreshTokens.length > MAX_TOKENS) {
      user.refreshTokens = user.refreshTokens.slice(-MAX_TOKENS);
    }

    await user.save({ validateBeforeSave: false });

    const accessTokenExpiresIn = 15 * 60 * 1000;
    res.cookie('accessToken', token, getCookieOptions(accessTokenExpiresIn));
    res.cookie('refreshToken', refreshToken, getCookieOptions(refreshTokenExpiresIn));
    
    console.log('✅ JWT cookies set for user:', user._id);

    const userForFrontend = {
      _id: user._id,
      email: user.email,
      userName: user.fullName,
      phone: user.phone,
      usertype: user.role,
      avatar: user.avatar,
      authProvider: user.authProvider
    };

    res.status(200).json({
      success: true,
      message: 'Xác thực Firebase thành công',
      user: userForFrontend
    });
  } catch (error) {
    console.error('❌ Lỗi verify Firebase auth:', error);
    res.status(401).json({
      success: false,
      message: 'Token Firebase không hợp lệ',
      error: error.message
    });
  }
};
  exports.updateMe = async (req, res, next) => {
    // 1. Không cho update password ở route này
    if (req.body.password || req.body.passwordConfirm) {
      return res.status(400).json({
        message: 'Không thể cập nhật mật khẩu tại đây. Hãy dùng /update-password.',
      });
    }
  
    // 2. Lọc chỉ các field cho phép update
    const filteredBody = (({ name, email }) => ({ name, email }))(req.body);
  
    // 3. Cập nhật
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
      new: true,
      runValidators: true,
    });
  
    res.status(200).json({
      status: 'success',
      data: { user: updatedUser },
    });
  };
