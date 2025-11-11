const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Grade = require('../models/Grade');
const Subject = require('../models/Subject');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');

    await Subject.deleteMany();

    const subjects = await Subject.insertMany([
      // THCS
      { name: 'Toán học', code: 'toan', level: 'THCS' },
      { name: 'Ngữ văn', code: 'ngu_van', level: 'THCS' },
      { name: 'Tiếng Anh', code: 'tieng_anh', level: 'THCS' },
      { name: 'Vật lý', code: 'vat_ly', level: 'THCS' },
      { name: 'Hóa học', code: 'hoa_hoc', level: 'THCS' },
      { name: 'Sinh học', code: 'sinh_hoc', level: 'THCS' },
      { name: 'Lịch sử', code: 'lich_su', level: 'THCS' },
      { name: 'Địa lý', code: 'dia_ly', level: 'THCS' },
      { name: 'Giáo dục công dân', code: 'gdcd', level: 'THCS' },

      // THPT
      { name: 'Toán học', code: 'toan_thpt', level: 'THPT' },
      { name: 'Ngữ văn', code: 'ngu_van_thpt', level: 'THPT' },
      { name: 'Tiếng Anh', code: 'tieng_anh_thpt', level: 'THPT' },
      { name: 'Vật lý', code: 'vat_ly_thpt', level: 'THPT' },
      { name: 'Hóa học', code: 'hoa_hoc_thpt', level: 'THPT' },
      { name: 'Sinh học', code: 'sinh_hoc_thpt', level: 'THPT' },
      { name: 'Lịch sử', code: 'lich_su_thpt', level: 'THPT' },
      { name: 'Địa lý', code: 'dia_ly_thpt', level: 'THPT' },
      { name: 'Giáo dục công dân', code: 'gdcd_thpt', level: 'THPT' },
    ]);
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('❌ Lỗi seed dữ liệu:', err);
    mongoose.connection.close();
  });
