const mongoose = require('mongoose');

const lessonPlanSchema = new mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TeacherProfile',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  },
  grade: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grade'
  },


  title: { type: String },
  lessonNumber: { type: Number },
  chapter: { type: String },
  num_periods: { type: Number, default: 1 },


  objectives: {
    knowledge: [String],      // Kiến thức
    skills: [String],         // Kỹ năng
    attitude: [String],       // Thái độ
    competence: [String],     // Năng lực (nếu có)
  },

  learningOutcomes: {
    general: [String],
    specific: [String]
  },


  materials: [String],
  teachingMethods: [String],


  activities: [
    {
      name: String,        
      goal: String,        
      steps: {
        assign: String,    
        perform: String,   
        report: String,    
        conclude: String   
      }
    }
  ],


  assessmentCriteria: [{
    criterion: String,
    method: String,
    level: String,
    notes: String
  }],


  notes: String,
  attachments: [{
    filename: String,
    fileUrl: String,
    fileType: String,
    uploadedAt: { type: Date, default: Date.now }
  }],


  isAIGenerated: { type: Boolean, default: false },
  aiPrompt: String,
  aiModel: String,
  generationTime: Date,

  status: {
    type: String,
    enum: ['draft', 'completed', 'approved', 'archived'],
    default: 'draft'
  },
  version: { type: Number, default: 1 },
  isPublic: { type: Boolean, default: false },
  isTemplate: { type: Boolean, default: false },


  viewCount: { type: Number, default: 0 },
  likeCount: { type: Number, default: 0 },
  downloadCount: { type: Number, default: 0 },


  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,

  tags: [String]
}, { timestamps: true });

lessonPlanSchema.index({ teacher: 1, subject: 1, grade: 1 });
lessonPlanSchema.index({ status: 1, isPublic: 1 });

module.exports = mongoose.model('LessonPlan', lessonPlanSchema);
