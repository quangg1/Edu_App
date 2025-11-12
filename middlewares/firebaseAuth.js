const { verifyIdToken } = require('../config/firebase');
const User = require('../models/User');

/**
 * Middleware để xác thực Firebase token và sync với MongoDB
 * Hỗ trợ cả Firebase token và JWT token hiện tại
 */
exports.verifyFirebaseToken = async (req, res, next) => {
  try {
    let idToken;
    
    // Lấy token từ header hoặc cookie
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      idToken = req.headers.authorization.split('Bearer ')[1];
    } else if (req.headers['x-firebase-token']) {
      idToken = req.headers['x-firebase-token'];
    } else if (req.cookies && req.cookies.firebaseToken) {
      idToken = req.cookies.firebaseToken;
    }

    if (!idToken) {
      // Không có Firebase token, có thể dùng JWT token thông thường
      return next();
    }

    // Verify Firebase token
    const decodedToken = await verifyIdToken(idToken);
    
    // Tìm hoặc tạo user trong MongoDB
    let user = await User.findOne({ firebaseUID: decodedToken.uid });
    
    if (!user) {
      // Tìm theo email nếu chưa có firebaseUID
      user = await User.findOne({ email: decodedToken.email });
      
      if (user) {
        // Link Firebase UID với user hiện có
        user.firebaseUID = decodedToken.uid;
        user.authProvider = decodedToken.firebase.sign_in_provider || 'email';
        user.isVerified = true;
        user.emailVerifiedAt = decodedToken.email_verified ? new Date() : null;
        
        if (decodedToken.picture) {
          user.avatar = decodedToken.picture;
          user.providerData = {
            photoURL: decodedToken.picture,
            displayName: decodedToken.name
          };
        }
        
        await user.save({ validateBeforeSave: false });
      } else {
        // Tạo user mới từ Firebase
        const provider = decodedToken.firebase?.sign_in_provider || 'email';
        const providerMap = {
          'google.com': 'google',
          'facebook.com': 'facebook',
          'github.com': 'github',
          'microsoft.com': 'microsoft',
          'password': 'email'
        };
        
        user = await User.create({
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
        });
      }
    } else {
      // Cập nhật thông tin từ Firebase
      if (decodedToken.email_verified && !user.isVerified) {
        user.isVerified = true;
        user.emailVerifiedAt = new Date();
      }
      
      if (decodedToken.picture && decodedToken.picture !== user.avatar) {
        user.avatar = decodedToken.picture;
        if (user.providerData) {
          user.providerData.photoURL = decodedToken.picture;
        }
      }
      
      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });
    }

    // Gắn user vào request
    req.user = user;
    req.firebaseToken = decodedToken;
    next();
  } catch (error) {
    console.error('❌ Lỗi verify Firebase token:', error.message);
    // Nếu lỗi Firebase, có thể tiếp tục với JWT auth
    return next();
  }
};

/**
 * Middleware kết hợp: Thử JWT từ cookie trước (vì verifyFirebaseAuth đã set JWT cookie),
 * nếu không có thì thử Firebase token từ header
 */
exports.authenticate = async (req, res, next) => {
  try {
    // Ưu tiên JWT token từ cookie (vì verifyFirebaseAuth đã set JWT cookie)
    if (req.cookies && req.cookies.accessToken) {
      const jwtAuth = require('./auth');
      return jwtAuth.protect(req, res, next);
    }
    
    // Nếu không có JWT cookie, thử Firebase token
    let idToken;
    
    // Lấy Firebase token từ header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      idToken = req.headers.authorization.split('Bearer ')[1];
    } else if (req.headers['x-firebase-token']) {
      idToken = req.headers['x-firebase-token'];
    } else if (req.cookies && req.cookies.firebaseToken) {
      idToken = req.cookies.firebaseToken;
    }

    if (idToken) {
      // Có Firebase token, verify và sync với MongoDB
      try {
        const decodedToken = await verifyIdToken(idToken);
        
        // Tìm hoặc tạo user trong MongoDB
        let user = await User.findOne({ firebaseUID: decodedToken.uid });
        
        if (!user) {
          // Tìm theo email nếu chưa có firebaseUID
          user = await User.findOne({ email: decodedToken.email });
          
          if (user) {
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
          } else {
            // Tạo user mới từ Firebase
            const provider = decodedToken.firebase?.sign_in_provider || 'password';
            const providerMap = {
              'google.com': 'google',
              'facebook.com': 'facebook',
              'password': 'email'
            };
            
            const newUserData = {
              email: decodedToken.email,
              firebaseUID: decodedToken.uid,
              authProvider: providerMap[provider] || 'email',
              fullName: decodedToken.name || decodedToken.email.split('@')[0],
              avatar: decodedToken.picture || null,
              isVerified: decodedToken.email_verified || false,
              emailVerifiedAt: decodedToken.email_verified ? new Date() : null,
              role: 'teacher',
              providerData: {
                providerId: provider,
                photoURL: decodedToken.picture,
                displayName: decodedToken.name
              }
            };
            
            if (decodedToken.phone_number) {
              newUserData.phone = decodedToken.phone_number;
            }
            
            user = await User.create(newUserData);
          }
        } else {
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
        }

        // Gắn user vào request
        req.user = user;
        return next();
      } catch (firebaseError) {
        console.warn('⚠️ Firebase token invalid, trying JWT:', firebaseError.message);
        // Fall through to JWT auth
      }
    }
    
    // Nếu không có Firebase token hoặc Firebase token invalid, dùng JWT auth
    const jwtAuth = require('./auth');
    return jwtAuth.protect(req, res, next);
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Xác thực thất bại. Vui lòng đăng nhập lại.'
    });
  }
};

