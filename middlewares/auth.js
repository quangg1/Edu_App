const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { promisify } = require('util');

// Verify JWT Token
exports.protect = async (req, res, next) => {
  try {
    let token;
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.'
      });
    }

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    const currentUser = await User.findById(decoded.id).select('+password');
    
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Người dùng không tồn tại.'
      });
    }

    if (!currentUser.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản đã bị vô hiệu hóa.'
      });
    }

    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu đã thay đổi. Vui lòng đăng nhập lại.'
      });
    }

    req.user = currentUser;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ hoặc đã hết hạn.'
    });
  }
};

// Restrict to specific roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện hành động này.'
      });
    }
    next();
  };
};

// Check if user is verified
exports.isVerified = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Vui lòng xác thực email trước khi sử dụng tính năng này.'
    });
  }
  next();
};

// Check resource ownership
exports.checkOwnership = (Model, resourceField = 'teacher') => {
  return async (req, res, next) => {
    try {
      const resource = await Model.findById(req.params.id);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tài nguyên.'
        });
      }

      // Admin có thể truy cập mọi tài nguyên
      if (req.user.role === 'admin') {
        req.resource = resource;
        return next();
      }

      // Teacher chỉ có thể truy cập tài nguyên của mình
      const teacherProfile = await require('../models/TeacherProfile').findOne({ user: req.user._id });
      
      if (!teacherProfile || resource[resourceField].toString() !== teacherProfile._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền truy cập tài nguyên này.'
        });
      }

      req.resource = resource;
      req.teacherProfile = teacherProfile;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
        error: error.message
      });
    }
  };
};