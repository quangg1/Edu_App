const SUBJECTS = [
  { code: 'MATH', name: 'Toán học' },
  { code: 'LITERATURE', name: 'Ngữ văn' },
  { code: 'ENGLISH', name: 'Tiếng Anh' },
  { code: 'PHYSICS', name: 'Vật lý' },
  { code: 'CHEMISTRY', name: 'Hóa học' },
  { code: 'BIOLOGY', name: 'Sinh học' },
  { code: 'HISTORY', name: 'Lịch sử' },
  { code: 'GEOGRAPHY', name: 'Địa lý' },
  { code: 'CIVIC', name: 'Giáo dục công dân' },
  { code: 'IT', name: 'Tin học' },
  { code: 'MUSIC', name: 'Âm nhạc' },
  { code: 'ART', name: 'Mỹ thuật' },
  { code: 'PE', name: 'Thể dục' }
];

// Helper functions
const getSubjectByCode = (code) => {
  return SUBJECTS.find(s => s.code === code);
};

const getSubjectByName = (name) => {
  return SUBJECTS.find(s => s.name === name);
};

const isValidSubject = (name) => {
  return SUBJECTS.some(s => s.name === name);
};

const isValidSubjectCode = (code) => {
  return SUBJECTS.some(s => s.code === code);
};

const getAllSubjects = () => {
  return SUBJECTS;
};

module.exports = {
  SUBJECTS,
  getSubjectByCode,
  getSubjectByName,
  isValidSubject,
  isValidSubjectCode,
  getAllSubjects
};
