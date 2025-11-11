const mongoose = require('mongoose');

const lessonPlanSchema = new mongoose.Schema({

  teacher: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: String,  
    email: String   
  },

  // Subject & Grade 
  subject: {
    name: String,  
    code: String    
  },
  grade: {
    level: Number,  
    name: String   
  },


  title: { type: String },
  lessonNumber: { type: Number },
  chapter: { type: String },
  num_periods: { type: Number, default: 1 },


  objectives: {
    knowledge: [String],      
    skills: [String],         
    attitude: [String],       
    competence: [String],     
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

// Indexes
lessonPlanSchema.index({ 'teacher.id': 1, status: 1 });
lessonPlanSchema.index({ 'subject.name': 1, 'grade.level': 1 });
lessonPlanSchema.index({ status: 1, isPublic: 1 });
lessonPlanSchema.index({ tags: 1 });
lessonPlanSchema.index({ createdAt: -1 });

module.exports = mongoose.model('LessonPlan', lessonPlanSchema);
