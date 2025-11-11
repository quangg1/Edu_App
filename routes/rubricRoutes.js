const express = require("express");
const router = express.Router();
const multer = require("multer");
const rubricController = require("../controllers/rubricController");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/temp"),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// 🚀 Streaming endpoint
router.post(
  "/stream",
  upload.single("files"),
  rubricController.generateRubricStream
);
router.get(
  '/download/:token',
  rubricController.downloadRubric
);
module.exports = router;
