const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const multer = require('multer');
const { protect, checkOwnership } = require('../middlewares/auth');
const { quizValidation, validate } = require('../middlewares/validation');
const { aiGenerationLimiter } = require('../middlewares/validation');
const Quiz = require('../models/Quiz');
const path = require('path');
const upload = multer({ dest: 'tmp/' }); 

router.post('/stream', upload.single('file'), quizController.streamQuizGeneration);
router.post('/export-docx', quizController.exportDocx); 

router.post('download/:filename', quizController.downloadDocx);

// Protect remaining quiz routes
router.use(protect);
module.exports = router;