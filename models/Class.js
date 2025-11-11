const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: { type: String, required: true },
  grade: { type: Number, required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],
});

module.exports = mongoose.model("Class", classSchema);
