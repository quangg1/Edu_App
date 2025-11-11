const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  level: { type: Number, required: true }
});

module.exports = mongoose.model('Grade', gradeSchema);