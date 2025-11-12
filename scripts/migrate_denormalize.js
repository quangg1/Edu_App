/**
 * Migration Script: Denormalize MongoDB Schema
 * 
 * Migrate from old schema (with TeacherProfile, Subject, Grade references)
 * to new schema (denormalized data)
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const LessonPlan = require('../models/LessonPlan');
const Quiz = require('../models/Quiz');
const AIUsage = require('../models/AIUsage');

dotenv.config();

async function migrateLessonPlans() {
  console.log('\n🔄 Migrating LessonPlans...');
  
  const lessonPlans = await LessonPlan.find({}).lean();
  let migrated = 0;
  let skipped = 0;
  
  for (const lp of lessonPlans) {
    const update = {};
    let needsUpdate = false;
    
    // Check if already migrated
    if (lp.teacher && typeof lp.teacher === 'object' && lp.teacher.id) {
      skipped++;
      continue;
    }
    
    // Migrate teacher
    if (lp.teacher && mongoose.Types.ObjectId.isValid(lp.teacher)) {
      const user = await User.findById(lp.teacher).select('fullName email');
      if (user) {
        update.teacher = {
          id: user._id,
          name: user.fullName,
          email: user.email
        };
        needsUpdate = true;
      }
    }
    

    if (lp.subject && mongoose.Types.ObjectId.isValid(lp.subject)) {

      const Subject = mongoose.model('Subject', new mongoose.Schema({ name: String, code: String }));
      const subject = await Subject.findById(lp.subject).select('name code');
      if (subject) {
        update.subject = {
          name: subject.name,
          code: subject.code
        };
        needsUpdate = true;
      }
    }
    
    if (lp.grade && mongoose.Types.ObjectId.isValid(lp.grade)) {
      const Grade = mongoose.model('Grade', new mongoose.Schema({ name: String, level: Number }));
      const grade = await Grade.findById(lp.grade).select('name level');
      if (grade) {
        update.grade = {
          level: grade.level,
          name: grade.name
        };
        needsUpdate = true;
      }
    }
    
    if (needsUpdate) {
      await LessonPlan.updateOne({ _id: lp._id }, update);
      migrated++;
    }
  }
  
  console.log(`✅ LessonPlans migrated: ${migrated}, skipped: ${skipped}`);
}

async function migrateQuizzes() {
  console.log('\n🔄 Migrating Quizzes...');
  
  const quizzes = await Quiz.find({}).lean();
  let migrated = 0;
  let skipped = 0;
  
  for (const quiz of quizzes) {
    const update = {};
    let needsUpdate = false;
    
    // Check if already migrated
    if (quiz.teacher && typeof quiz.teacher === 'object' && quiz.teacher.id) {
      skipped++;
      continue;
    }
    
    // Migrate teacher
    if (quiz.teacher && mongoose.Types.ObjectId.isValid(quiz.teacher)) {
      const user = await User.findById(quiz.teacher).select('fullName email');
      if (user) {
        update.teacher = {
          id: user._id,
          name: user.fullName,
          email: user.email
        };
        needsUpdate = true;
      }
    }
    
    // Migrate subject
    if (quiz.subject && mongoose.Types.ObjectId.isValid(quiz.subject)) {
      const Subject = mongoose.model('Subject', new mongoose.Schema({ name: String, code: String }));
      const subject = await Subject.findById(quiz.subject).select('name code');
      if (subject) {
        update.subject = {
          name: subject.name,
          code: subject.code
        };
        needsUpdate = true;
      }
    }
    
    // Migrate grade
    if (quiz.grade && mongoose.Types.ObjectId.isValid(quiz.grade)) {
      const Grade = mongoose.model('Grade', new mongoose.Schema({ name: String, level: Number }));
      const grade = await Grade.findById(quiz.grade).select('name level');
      if (grade) {
        update.grade = {
          level: grade.level,
          name: grade.name
        };
        needsUpdate = true;
      }
    }
    
    if (needsUpdate) {
      await Quiz.updateOne({ _id: quiz._id }, update);
      migrated++;
    }
  }
  
  console.log(`✅ Quizzes migrated: ${migrated}, skipped: ${skipped}`);
}

async function migrateAIUsage() {
  console.log('\n🔄 Migrating AIUsage...');
  
  const aiUsages = await AIUsage.find({}).lean();
  let migrated = 0;
  let skipped = 0;
  
  for (const usage of aiUsages) {
    // Check if already migrated
    if (usage.user && typeof usage.user === 'object' && usage.user.id) {
      skipped++;
      continue;
    }
    
    // Migrate user
    if (usage.user && mongoose.Types.ObjectId.isValid(usage.user)) {
      const user = await User.findById(usage.user).select('email');
      if (user) {
        await AIUsage.updateOne(
          { _id: usage._id },
          {
            user: {
              id: user._id,
              email: user.email
            }
          }
        );
        migrated++;
      }
    }
  }
  
  console.log(`✅ AIUsage migrated: ${migrated}, skipped: ${skipped}`);
}

async function main() {
  try {
    console.log('🚀 Starting MongoDB Schema Migration...');
    console.log(`📊 Database: ${process.env.MONGODB_URI}`);
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    await migrateLessonPlans();
    await migrateQuizzes();
    await migrateAIUsage();
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\n⚠️  Next steps:');
    console.log('   1. Verify migration: node scripts/verify_migration.js');
    console.log('   2. Test application thoroughly');
    console.log('   3. Drop old collections if everything works');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run migration
main();

