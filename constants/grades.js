
const GRADES = [
  { level: 1, name: 'Lớp 1', schoolLevel: 'Tiểu học' },
  { level: 2, name: 'Lớp 2', schoolLevel: 'Tiểu học' },
  { level: 3, name: 'Lớp 3', schoolLevel: 'Tiểu học' },
  { level: 4, name: 'Lớp 4', schoolLevel: 'Tiểu học' },
  { level: 5, name: 'Lớp 5', schoolLevel: 'Tiểu học' },
  { level: 6, name: 'Lớp 6', schoolLevel: 'THCS' },
  { level: 7, name: 'Lớp 7', schoolLevel: 'THCS' },
  { level: 8, name: 'Lớp 8', schoolLevel: 'THCS' },
  { level: 9, name: 'Lớp 9', schoolLevel: 'THCS' },
  { level: 10, name: 'Lớp 10', schoolLevel: 'THPT' },
  { level: 11, name: 'Lớp 11', schoolLevel: 'THPT' },
  { level: 12, name: 'Lớp 12', schoolLevel: 'THPT' }
];

const SCHOOL_LEVELS = {
  PRIMARY: 'Tiểu học',
  SECONDARY: 'THCS',
  HIGH_SCHOOL: 'THPT'
};

// Helper functions
const getGradeByLevel = (level) => {
  return GRADES.find(g => g.level === level);
};

const getGradesBySchoolLevel = (schoolLevel) => {
  return GRADES.filter(g => g.schoolLevel === schoolLevel);
};

const isValidGrade = (level) => {
  return level >= 1 && level <= 12;
};

const getGradeName = (level) => {
  const grade = getGradeByLevel(level);
  return grade ? grade.name : null;
};

module.exports = {
  GRADES,
  SCHOOL_LEVELS,
  getGradeByLevel,
  getGradesBySchoolLevel,
  isValidGrade,
  getGradeName
};

