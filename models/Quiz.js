const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  // Owner (denormalized)
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


  title: { type: String, required: true },
  description: String,
  quizType: {
    type: String,
    enum: ['practice', 'test', 'exam', 'homework'],
    default: 'practice'
  },


  questions: [
    {
      questionNumber: Number,
      questionType: {
        type: String,
        enum: ['multiple-choice', 'true-false', 'short-answer', 'essay', 'matching'],
        default: 'multiple-choice'
      },
      questionText: String,
      questionImage: String,
      options: [
        {
          optionKey: String,
          optionText: String,
          optionImage: String
        }
      ],
      correctAnswer: mongoose.Schema.Types.Mixed,
      explanation: String,
      difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
      },
      tags: [String],
      topic: String
    }
  ],


  settings: {
    timeLimit: Number,
    passingScore: Number,
    shuffleQuestions: { type: Boolean, default: false },
    shuffleOptions: { type: Boolean, default: true },
    showResults: { type: Boolean, default: true },
    showCorrectAnswers: { type: Boolean, default: false },
    allowRetake: { type: Boolean, default: false },
    maxAttempts: { type: Number, default: 1 }
  },

  isAIGenerated: { type: Boolean, default: false },
  aiPrompt: String,
  aiModel: String,


  totalAttempts: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },


  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  isPublic: { type: Boolean, default: false },
  tags: [String]
}, { timestamps: true });

// Indexes
quizSchema.index({ 'teacher.id': 1, status: 1 });
quizSchema.index({ 'subject.name': 1, 'grade.level': 1 });
quizSchema.index({ status: 1, isPublic: 1 });
quizSchema.index({ tags: 1 });
quizSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Quiz', quizSchema);
