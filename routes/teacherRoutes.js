const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { protect, restrictTo } = require('../middlewares/auth');

router.use(protect);

// Teacher profile routes
router.get('/profile', teacherController.getMyProfile);
router.patch('/profile', teacherController.updateMyProfile);

// Admin only routes
router.use(restrictTo('admin'));

router
  .route('/')
  .get(teacherController.getAllTeachers)
  .post(teacherController.createTeacher);

router
  .route('/:id')
  .get(teacherController.getTeacher)
  .patch(teacherController.updateTeacher)
  .delete(teacherController.deleteTeacher);

router.patch('/:id/subjects', teacherController.updateTeacherSubjects);
router.patch('/:id/status', teacherController.updateTeacherStatus);

module.exports = router;