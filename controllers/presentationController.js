const Presentation = require('../models/Presentation');
const TeacherProfile = require('../models/TeacherProfile');
const AIUsage = require('../models/AIUsage');

exports.createPresentation = async (req, res) => {
  try {
    const teacherProfile = await TeacherProfile.findOne({ user: req.user._id });

    const presentation = await Presentation.create({
      ...req.body,
      teacher: teacherProfile._id
    });

    await presentation.populate(['subject', 'grade', 'lessonPlan']);

    res.status(201).json({
      success: true,
      message: 'Tạo slide thành công',
      data: presentation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi tạo slide',
      error: error.message
    });
  }
};

exports.getPresentations = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, subject, grade } = req.query;

    const query = {};

    if (req.user.role === 'teacher') {
      const teacherProfile = await TeacherProfile.findOne({ user: req.user._id });
      query.teacher = teacherProfile._id;
    }

    if (status) query.status = status;
    if (subject) query.subject = subject;
    if (grade) query.grade = grade;

    const presentations = await Presentation.find(query)
      .populate(['teacher', 'subject', 'grade', 'lessonPlan'])
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Presentation.countDocuments(query);

    res.json({
      success: true,
      data: presentations,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách slide',
      error: error.message
    });
  }
};

exports.getPresentation = async (req, res) => {
  try {
    const presentation = await Presentation.findById(req.params.id)
      .populate(['teacher', 'subject', 'grade', 'lessonPlan']);

    if (!presentation) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy slide'
      });
    }

    presentation.viewCount += 1;
    await presentation.save({ validateBeforeSave: false });

    res.json({
      success: true,
      data: presentation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy slide',
      error: error.message
    });
  }
};

exports.updatePresentation = async (req, res) => {
  try {
    const presentation = await Presentation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate(['subject', 'grade', 'lessonPlan']);

    res.json({
      success: true,
      message: 'Cập nhật slide thành công',
      data: presentation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật slide',
      error: error.message
    });
  }
};

exports.deletePresentation = async (req, res) => {
  try {
    await Presentation.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Xóa slide thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa slide',
      error: error.message
    });
  }
};

exports.generatePresentationWithAI = async (req, res) => {
  try {
    const { subject, grade, title, slides, theme } = req.body;
    const teacherProfile = await TeacherProfile.findOne({ user: req.user._id });

    const aiResponse = await callAIService({
      endpoint: '/generate-presentation',
      data: { subject, grade, title, slides, theme }
    });

    await AIUsage.create({
      user: req.user._id,
      feature: 'presentation',
      aiProvider: aiResponse.provider,
      model: aiResponse.model,
      tokensUsed: aiResponse.tokensUsed,
      success: true
    });

    const presentation = await Presentation.create({
      teacher: teacherProfile._id,
      subject,
      grade,
      title,
      slides: aiResponse.slides,
      theme: aiResponse.theme,
      isAIGenerated: true,
      aiPrompt: JSON.stringify(req.body),
      aiModel: aiResponse.model,
      generationTime: new Date()
    });

    await presentation.populate(['subject', 'grade']);

    res.status(201).json({
      success: true,
      message: 'Tạo slide bằng AI thành công',
      data: presentation
    });
  } catch (error) {
    await AIUsage.create({
      user: req.user._id,
      feature: 'presentation',
      success: false,
      errorMessage: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Lỗi tạo slide bằng AI',
      error: error.message
    });
  }
};

exports.exportToPDF = async (req, res) => {
  try {
    const presentation = await Presentation.findById(req.params.id);

    if (!presentation) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy slide'
      });
    }

    // TODO: Implement PDF generation logic
    // Using puppeteer or similar library

    res.json({
      success: true,
      message: 'Export PDF thành công',
      data: {
        pdfUrl: presentation.pdfUrl
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi export PDF',
      error: error.message
    });
  }
};