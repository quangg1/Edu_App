exports.errorHandler = (err, req, res, next) => {
    console.error(err.stack);
  
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID không hợp lệ'
      });
    }
  
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${field} đã tồn tại trong hệ thống`
      });
    }
  
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors
      });
    }
  
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }
  
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token đã hết hạn'
      });
    }
  
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Lỗi server',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  };