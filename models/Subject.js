const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, unique: true },
  level: { type: String, enum: ["THCS", "THPT"], required: true },
});

module.exports = mongoose.model("Subject", subjectSchema);
