const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middlewares/auth');

// All routes require admin role
router.use(protect);
router.use(restrictTo('admin'));

// Dashboard & Analytics
router.get('/dashboard', adminController.getDashboard);
router.get('/analytics', adminController.getAnalytics);

// User Management
router.get('/users', adminController.getAllUsers);
router.patch('/users/:id/activate', adminController.activateUser);
router.patch('/users/:id/deactivate', adminController.deactivateUser);
router.delete('/users/:id', adminController.deleteUser);

// School Management
router.get('/school-info', adminController.getSchoolInfo);
router.patch('/school-info', adminController.updateSchoolInfo);

// Academic Year Management
router.get('/academic-years', adminController.getAcademicYears);
router.post('/academic-years', adminController.createAcademicYear);
router.patch('/academic-years/:id', adminController.updateAcademicYear);
router.patch('/academic-years/:id/set-current', adminController.setCurrentAcademicYear);

// Class Management
router.get('/classes', adminController.getClasses);
router.post('/classes', adminController.createClass);
router.patch('/classes/:id', adminController.updateClass);
router.delete('/classes/:id', adminController.deleteClass);

// Subject Management
router.get('/subjects', adminController.getSubjects);
router.post('/subjects', adminController.createSubject);
router.patch('/subjects/:id', adminController.updateSubject);
router.delete('/subjects/:id', adminController.deleteSubject);

// Teaching Assignments
router.get('/teaching-assignments', adminController.getTeachingAssignments);
router.post('/teaching-assignments', adminController.createTeachingAssignment);
router.delete('/teaching-assignments/:id', adminController.deleteTeachingAssignment);

// Activity Logs
router.get('/activity-logs', adminController.getActivityLogs);

// AI Usage Statistics
router.get('/ai-usage', adminController.getAIUsage);

module.exports = router;