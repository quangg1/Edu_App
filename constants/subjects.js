
const SUBJECTS = [
  { code: 'MATH', name: 'Toán học', level: 'THCS' },
  { code: 'LITERATURE', name: 'Ngữ văn', level: 'THCS' },
  { code: 'ENGLISH', name: 'Tiếng Anh', level: 'THCS' },
  { code: 'PHYSICS', name: 'Vật lý', level: 'THPT' },
  { code: 'CHEMISTRY', name: 'Hóa học', level: 'THPT' },
  { code: 'BIOLOGY', name: 'Sinh học', level: 'THPT' },
  { code: 'HISTORY', name: 'Lịch sử', level: 'THCS' },
  { code: 'GEOGRAPHY', name: 'Địa lý', level: 'THCS' },
  { code: 'CIVIC', name: 'Giáo dục công dân', level: 'THCS' },
  { code: 'IT', name: 'Tin học', level: 'THCS' }
];

const SUBJECT_LEVELS = {
  THCS: 'Trung học cơ sở',
  THPT: 'Trung học phổ thông'
};

// Helper functions
const getSubjectByCode = (code) => {
  return SUBJECTS.find(s => s.code === code);
};

const getSubjectsByLevel = (level) => {
  return SUBJECTS.filter(s => s.level === level);
};

const isValidSubject = (name) => {
  return SUBJECTS.some(s => s.name === name);
};

module.exports = {
  SUBJECTS,
  SUBJECT_LEVELS,
  getSubjectByCode,
  getSubjectsByLevel,
  isValidSubject
};

