/**
 * Helper utilities để làm việc với denormalized MongoDB models
 */

const { getGradeName } = require('../constants/grades');

/**
 
 * @param {Object} user - User document từ MongoDB
 * @returns {Object} - Teacher object với id, name, email
 */
const createTeacherObject = (user) => {
  if (!user) return null;
  
  return {
    id: user._id,
    name: user.fullName,
    email: user.email
  };
};

/**

 * @param {String} subjectName 
 * @param {String} subjectCode 
 * @returns {Object} - Subject object
 */
const createSubjectObject = (subjectName, subjectCode = null) => {
  if (!subjectName) return null;
  
  return {
    name: subjectName,
    code: subjectCode
  };
};

/**
 
 * @param {Number} gradeLevel 
 * @returns {Object} 
 */
const createGradeObject = (gradeLevel) => {
  if (!gradeLevel) return null;
  
  const gradeName = getGradeName(gradeLevel);
  
  return {
    level: gradeLevel,
    name: gradeName || `Lớp ${gradeLevel}`
  };
};

/**
 
 * @param {Object} user 
 * @returns {Object} 
 */
const createUserObject = (user) => {
  if (!user) return null;
  
  return {
    id: user._id,
    email: user.email
  };
};

/**

 * @param {String} userId 
 * @param {String} newName 
 * @param {String} newEmail 
 */
const updateTeacherInfoAcrossCollections = async (userId, newName, newEmail) => {
  const LessonPlan = require('../models/LessonPlan');
  const Quiz = require('../models/Quiz');
  const Rubric = require('../models/Rubric');

  const updateData = {
    'teacher.name': newName,
    'teacher.email': newEmail
  };

  await Promise.all([
    LessonPlan.updateMany({ 'teacher.id': userId }, updateData),
    Quiz.updateMany({ 'teacher.id': userId }, updateData),
    Rubric.updateMany({ 'teacher.id': userId }, updateData)
  ]);
};

/**

 * @param {Array} documents - Array of documents
 * @param {String} teacherField - Field name (default: 'teacher')
 * @returns {Array} - Documents với teacher info được populate
 */
const populateTeacherInfo = async (documents, teacherField = 'teacher') => {
  const User = require('../models/User');
  
  const userIds = documents.map(doc => doc[teacherField]?.id).filter(Boolean);
  const users = await User.find({ _id: { $in: userIds } }).select('fullName email');
  
  const userMap = new Map(users.map(u => [u._id.toString(), u]));
  
  return documents.map(doc => {
    const docObj = doc.toObject ? doc.toObject() : doc;
    const userId = docObj[teacherField]?.id?.toString();
    const user = userMap.get(userId);
    
    if (user) {
      docObj[teacherField] = {
        id: user._id,
        name: user.fullName,
        email: user.email
      };
    }
    
    return docObj;
  });
};

module.exports = {
  createTeacherObject,
  createSubjectObject,
  createGradeObject,
  createUserObject,
  updateTeacherInfoAcrossCollections,
  populateTeacherInfo
};

