// routes/lessonPlanRoutes.js (Ví dụ)
const fs=require("fs");
const express = require('express');
const router = express.Router();
const lessonPlanController = require('../controllers/lessonPlanController');
const multer = require('multer'); 
const path =require('path');
const { authenticate } = require('../middlewares/firebaseAuth');
// Lưu ý: authMiddleware KHÔNG được import vì bạn đang test
const uploadDir = path.join(__dirname, '../uploads/temp');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
// Cấu hình Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const sanitized = file.originalname
      .replace(/\s+/g, '_')          // bỏ khoảng trắng
      .replace(/[^a-zA-Z0-9._-]/g, ''); // bỏ ký tự đặc biệt
    cb(null, `${Date.now()}-${sanitized}`);
  },
});

const upload = multer({ storage });


router.post(
  '/stream',
  upload.single('file'),
  lessonPlanController.generateLessonPlanStream
);

// 2️⃣ TẢI FILE THEO TOKEN
router.get(
  '/download/:token',
  lessonPlanController.downloadLessonPlanByToken
);

// 3️⃣ LƯU GIÁO ÁN SAU KHI STREAM (requires auth - Firebase or JWT)
router.post(
  '/save-from-token',
  authenticate,
  lessonPlanController.saveLessonPlanFromToken
);

// 4️⃣ LẤY DANH SÁCH GIÁO ÁN (requires auth - Firebase or JWT)
router.get('/', authenticate, lessonPlanController.getLessonPlans);

module.exports = router;