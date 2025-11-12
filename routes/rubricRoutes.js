const express = require("express");
const router = express.Router();
const multer = require("multer");
const rubricController = require("../controllers/rubricController");
const { authenticate } = require('../middlewares/firebaseAuth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/temp"),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// Public routes (no auth required for generation)
router.post(
  "/stream",
  upload.single("files"),
  rubricController.generateRubricStream
);
router.get(
  '/download/:token',
  rubricController.downloadRubric
);

// Save rubric (requires auth - Firebase or JWT)
router.post('/save', authenticate, rubricController.saveRubric);

// Protected routes (require auth - Firebase or JWT)
router.use(authenticate);

// Get rubrics list
router.get('/', rubricController.getRubrics);

// Get single rubric
router.get('/:id', rubricController.getRubric);

module.exports = router;
