const mongoose = require('mongoose');

const rubricSchema = new mongoose.Schema({

  teacher: {
    id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: true 
    },
    name: String,
    email: String
  },

  subject: {
    name: String,
    code: String
  },
  grade: {
    level: Number,
    name: String
  },

  // Basic info
  title: { 
    type: String, 
    required: true 
  },
  description: String,
  assessmentType: {
    type: String,
    enum: ['presentation', 'report', 'project', 'test', 'essay']
  },

  // Criteria (embedded array)
  criteria: [{
    name: { type: String, required: true },
    description: String,
    weightPercent: { type: Number, min: 0, max: 100 },
    levels: [{
      label: String,              
      scoreRange: String,         
      description: String
    }]
  }],

  // AI metadata
  isAIGenerated: { 
    type: Boolean, 
    default: false 
  },
  aiPrompt: String,
  aiModel: String,
  generationTime: Date,

  // Status
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  isPublic: { 
    type: Boolean, 
    default: false 
  },
  tags: [String]
}, { 
  timestamps: true 
});

// Indexes
rubricSchema.index({ 'teacher.id': 1, status: 1 });
rubricSchema.index({ 'subject.name': 1, 'grade.level': 1 });
rubricSchema.index({ status: 1, isPublic: 1 });
rubricSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Rubric', rubricSchema);

