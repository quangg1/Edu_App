const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const { registerValidation, loginValidation, validate ,authLimiter } = require('../middlewares/validation');

router.post('/register', authLimiter, registerValidation, validate, authController.register);
router.get('/verify-email',authLimiter, authController.verifyEmail);
router.post('/login', authLimiter, loginValidation, validate, authController.login);
router.post('/verify-firebase', authController.verifyFirebaseAuth);
router.post('/logout', protect, authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);
router.patch('/update-password', protect, authController.updatePassword);
router.get('/me', protect, authController.getMe);
router.patch('/update-me', protect, authController.updateMe);

module.exports = router;