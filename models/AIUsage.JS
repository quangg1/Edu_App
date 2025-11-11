const mongoose = require('mongoose');

const aiUsageSchema = new mongoose.Schema({
  // User (denormalized)
  user: {
    id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    email: String  // Cached
  },

  feature: {
    type: String,
    enum: ['lessonPlan', 'quiz', 'rubric'],
    required: true
  },

  // AI provider info
  aiProvider: String,        
  model: String,           

  // Usage metrics
  promptTokens: Number,
  completionTokens: Number,
  totalTokens: Number,
  processingTime: Number,    // milliseconds


  prompt: String,
  response: String,

  // Status
  success: { 
    type: Boolean, 
    default: true 
  },
  errorMessage: String
}, { 
  timestamps: true 
});

// Indexes
aiUsageSchema.index({ 'user.id': 1, feature: 1 });
aiUsageSchema.index({ feature: 1, success: 1 });
aiUsageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AIUsage', aiUsageSchema);

