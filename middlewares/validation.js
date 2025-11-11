const { body, validationResult } = require('express-validator');

exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: errors.array()
    });
  }
  next();
};

exports.registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email không hợp lệ'),
  body('password').isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
  body('fullName').trim().notEmpty().withMessage('Họ tên là bắt buộc'),
  body('role').isIn(['admin', 'teacher']).withMessage('Role không hợp lệ')
];

exports.loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email không hợp lệ'),
  body('password').notEmpty().withMessage('Mật khẩu là bắt buộc')
];

exports.lessonPlanValidation = [
  body('title').trim().notEmpty().withMessage('Tiêu đề là bắt buộc'),
  body('subject').isMongoId().withMessage('Subject ID không hợp lệ'),
  body('grade').isMongoId().withMessage('Grade ID không hợp lệ'),
  body('durationMinutes').optional().isInt({ min: 1 }).withMessage('Thời lượng phải là số nguyên dương')
];

exports.quizValidation = [
  body('title').trim().notEmpty().withMessage('Tiêu đề là bắt buộc'),
  body('subject').isMongoId().withMessage('Subject ID không hợp lệ'),
  body('grade').isMongoId().withMessage('Grade ID không hợp lệ'),
  body('questions').isArray({ min: 1 }).withMessage('Quiz phải có ít nhất 1 câu hỏi')
];

// =====================================================
// 7. MIDDLEWARE - middleware/rateLimiter.js
// =====================================================

const rateLimit = require('express-rate-limit');

exports.generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100,
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu từ IP này. Vui lòng thử lại sau 15 phút.'
  }
});

exports.authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 5,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 1 giờ.'
  }
});

exports.aiGenerationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 20,
  message: {
    success: false,
    message: 'Bạn đã vượt quá giới hạn sử dụng AI. Vui lòng thử lại sau 1 giờ.'
  }
});