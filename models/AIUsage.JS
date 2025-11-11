const mongoose = require('mongoose');

const aiUsageSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  feature: String,
  aiProvider: String,
  model: String,
  prompt: String,
  response: String,
  tokensUsed: Number,
  processingTime: Number,
  success: { type: Boolean, default: true },
  errorMessage: String
}, { timestamps: true });

module.exports = mongoose.model('AIUsage', aiUsageSchema);
