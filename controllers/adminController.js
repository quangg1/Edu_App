//const SchoolInfo = require('../models/SchoolInfo');
//const AcademicYear = require('../models/AcademicYear');
//const Grade = require('../models/Grade');
const Class = require('../models/Class');
// const Subject = require('../models/Subject');
//const TeachingAssignment = require('../models/TeachingAssignment');
//const ActivityLog = require('../models/ActivityLog');

exports.getDashboard = async (req, res) => {
  try {
    const totalTeachers = await TeacherProfile.countDocuments({ status: 'active' });
    const totalClasses = await Class.countDocuments();
    const totalSubjects = await Subject.countDocuments({ isActive: true });
    const totalLessonPlans = await LessonPlan.countDocuments();
    const totalQuizzes = await Quiz.countDocuments();
    const totalPresentations = await Presentation.countDocuments();


    const lessonPlansByStatus = await LessonPlan.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Recent activities
    const recentActivities = await ActivityLog.find()
      .populate('user', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(10);

    // AI usage stats
    const aiUsageStats = await AIUsage.aggregate([
      {
        $group: {
          _id: '$feature',
          totalCalls: { $sum: 1 },
          successfulCalls: {
            $sum: { $cond: ['$success', 1, 0] }
          },
          totalTokens: { $sum: '$tokensUsed' },
          totalCost: { $sum: '$cost' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalTeachers,
          totalClasses,
          totalSubjects,
          totalLessonPlans,
          totalQuizzes,
          totalPresentations
        },
        lessonPlansByStatus,
        recentActivities,
        aiUsageStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy dashboard',
      error: error.message
    });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    let analytics = {};

    if (type === 'lessonPlans' || !type) {
      analytics.lessonPlans = await LessonPlan.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 },
            aiGenerated: {
              $sum: { $cond: ['$isAIGenerated', 1, 0] }
            }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } }
      ]);
    }

    if (type === 'aiUsage' || !type) {
      analytics.aiUsage = await AIUsage.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: {
              feature: '$feature',
              date: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
              }
            },
            totalCalls: { $sum: 1 },
            totalTokens: { $sum: '$tokensUsed' },
            totalCost: { $sum: '$cost' }
          }
        },
        { $sort: { '_id.date': -1 } }
      ]);
    }

    if (type === 'teachers' || !type) {
      analytics.teacherActivity = await ActivityLog.aggregate([
        { $match: { ...dateFilter, resourceType: { $exists: true } } },
        {
          $group: {
            _id: '$user',
            totalActions: { $sum: 1 },
            actionTypes: { $push: '$action' }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        { $limit: 10 }
      ]);
    }

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy analytics',
      error: error.message
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, isActive, search } = req.query;

    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách người dùng',
      error: error.message
    });
  }
};

exports.activateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Kích hoạt tài khoản thành công',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi kích hoạt tài khoản',
      error: error.message
    });
  }
};

exports.deactivateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Vô hiệu hóa tài khoản thành công',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi vô hiệu hóa tài khoản',
      error: error.message
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Xóa người dùng thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa người dùng',
      error: error.message
    });
  }
};

exports.getSchoolInfo = async (req, res) => {
  try {
    let schoolInfo = await SchoolInfo.findOne();

    if (!schoolInfo) {
      schoolInfo = await SchoolInfo.create({
        name: 'Trường học của bạn'
      });
    }

    res.json({
      success: true,
      data: schoolInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thông tin trường',
      error: error.message
    });
  }
};

exports.updateSchoolInfo = async (req, res) => {
  try {
    const schoolInfo = await SchoolInfo.findOneAndUpdate(
      {},
      req.body,
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Cập nhật thông tin trường thành công',
      data: schoolInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật thông tin trường',
      error: error.message
    });
  }
};

exports.getAcademicYears = async (req, res) => {
  try {
    const academicYears = await AcademicYear.find().sort({ startDate: -1 });

    res.json({
      success: true,
      data: academicYears
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy năm học',
      error: error.message
    });
  }
};

exports.createAcademicYear = async (req, res) => {
  try {
    const academicYear = await AcademicYear.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Tạo năm học thành công',
      data: academicYear
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi tạo năm học',
      error: error.message
    });
  }
};

exports.updateAcademicYear = async (req, res) => {
  try {
    const academicYear = await AcademicYear.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Cập nhật năm học thành công',
      data: academicYear
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật năm học',
      error: error.message
    });
  }
};

exports.setCurrentAcademicYear = async (req, res) => {
  try {
    // Set all to false
    await AcademicYear.updateMany({}, { isCurrent: false });

    // Set selected to true
    const academicYear = await AcademicYear.findByIdAndUpdate(
      req.params.id,
      { isCurrent: true },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Đặt năm học hiện tại thành công',
      data: academicYear
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi đặt năm học hiện tại',
      error: error.message
    });
  }
};

exports.getClasses = async (req, res) => {
  try {
    const { academicYear, grade } = req.query;

    const query = {};
    if (academicYear) query.academicYear = academicYear;
    if (grade) query.grade = grade;

    const classes = await Class.find(query)
      .populate(['academicYear', 'grade', 'homeroomTeacher'])
      .sort({ name: 1 });

    res.json({
      success: true,
      data: classes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách lớp',
      error: error.message
    });
  }
};

exports.createClass = async (req, res) => {
  try {
    const classData = await Class.create(req.body);

    await classData.populate(['academicYear', 'grade', 'homeroomTeacher']);

    res.status(201).json({
      success: true,
      message: 'Tạo lớp thành công',
      data: classData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi tạo lớp',
      error: error.message
    });
  }
};

exports.updateClass = async (req, res) => {
  try {
    const classData = await Class.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate(['academicYear', 'grade', 'homeroomTeacher']);

    res.json({
      success: true,
      message: 'Cập nhật lớp thành công',
      data: classData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật lớp',
      error: error.message
    });
  }
};

exports.deleteClass = async (req, res) => {
  try {
    await Class.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Xóa lớp thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa lớp',
      error: error.message
    });
  }
};

exports.getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ isActive: true }).sort({ name: 1 });

    res.json({
      success: true,
      data: subjects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách môn học',
      error: error.message
    });
  }
};

// exports.createSubject = async (req, res) => {
//   try {
//     const subject = await Subject.create(req.body);

//     res.status(201).json({
//       success: true,
//       message: 'Tạo môn học thành công',
//       data: subject
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Lỗi tạo môn học',
//       error: error.message
//     });
//   }
// };

// exports.updateSubject = async (req, res) => {
//   try {
//     const subject = await Subject.findByIdAndUpdate(
//       req.params.id,
//       req.body,
//       { new: true, runValidators: true }
//     );

//     res.json({
//       success: true,
//       message: 'Cập nhật môn học thành công',
//       data: subject
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Lỗi cập nhật môn học',
//       error: error.message
//     });
//   }
// };

// exports.deleteSubject = async (req, res) => {
//   try {
//     await Subject.findByIdAndDelete(req.params.id);

//     res.json({
//       success: true,
//       message: 'Xóa môn học thành công'
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Lỗi xóa môn học',
//       error: error.message
//     });
//   }
// };

exports.getTeachingAssignments = async (req, res) => {
  try {
    const { academicYear, teacher, class: classId } = req.query;

    const query = {};
    if (academicYear) query.academicYear = academicYear;
    if (teacher) query.teacher = teacher;
    if (classId) query.class = classId;

    const assignments = await TeachingAssignment.find(query)
      .populate(['academicYear', 'teacher', 'class', 'subject'])
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách phân công',
      error: error.message
    });
  }
};

exports.createTeachingAssignment = async (req, res) => {
  try {
    const assignment = await TeachingAssignment.create(req.body);

    await assignment.populate(['academicYear', 'teacher', 'class', 'subject']);

    res.status(201).json({
      success: true,
      message: 'Phân công giảng dạy thành công',
      data: assignment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi phân công giảng dạy',
      error: error.message
    });
  }
};

exports.deleteTeachingAssignment = async (req, res) => {
  try {
    await TeachingAssignment.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Xóa phân công thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa phân công',
      error: error.message
    });
  }
};

exports.getActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, user, action, resourceType } = req.query;

    const query = {};
    if (user) query.user = user;
    if (action) query.action = action;
    if (resourceType) query.resourceType = resourceType;

    const logs = await ActivityLog.find(query)
      .populate('user', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await ActivityLog.countDocuments(query);

    res.json({
      success: true,
      data: logs,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy activity logs',
      error: error.message
    });
  }
};

exports.getAIUsage = async (req, res) => {
  try {
    const { page = 1, limit = 20, user, feature, startDate, endDate } = req.query;

    const query = {};
    if (user) query.user = user;
    if (feature) query.feature = feature;
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const usage = await AIUsage.find(query)
      .populate('user', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await AIUsage.countDocuments(query);

    // Calculate statistics
    const stats = await AIUsage.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$feature',
          totalCalls: { $sum: 1 },
          successfulCalls: {
            $sum: { $cond: ['$success', 1, 0] }
          },
          totalTokens: { $sum: '$tokensUsed' },
          totalCost: { $sum: '$cost' },
          avgProcessingTime: { $avg: '$processingTime' }
        }
      }
    ]);

    res.json({
      success: true,
      data: usage,
      stats,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy AI usage',
      error: error.message
    });
  }
};