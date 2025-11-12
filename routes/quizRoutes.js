const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const multer = require('multer');
const { protect, checkOwnership } = require('../middlewares/auth');
const { authenticate } = require('../middlewares/firebaseAuth');
const { quizValidation, validate } = require('../middlewares/validation');
const { aiGenerationLimiter } = require('../middlewares/validation');
const Quiz = require('../models/Quiz');
const path = require('path');
const upload = multer({ dest: 'tmp/' }); 

// Public routes (no auth required for generation)
router.post('/stream', upload.single('file'), quizController.streamQuizGeneration);
router.post('/export-docx', quizController.exportDocx); 
router.post('/download/:filename', quizController.downloadDocx);

// Save quiz (requires auth - Firebase or JWT)
router.post('/save', authenticate, quizController.saveQuiz);

// Protected routes (require auth - Firebase or JWT)
router.use(authenticate);

// Get quizzes list
router.get('/', quizController.getQuizzes);

// Get single quiz
router.get('/:id', quizController.getQuiz);

module.exports = router;