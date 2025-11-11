// server.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cron = require('node-cron');
const { app, server } = require('./app');
const User = require('./models/User'); // nếu dùng cron xóa user

dotenv.config({ path: './.env' });

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Cron job xóa user chưa verify >1h
cron.schedule('0 0 * * *', async () => {
  try {
    const result = await User.deleteMany({
      isVerified: false,
      createdAt: { $lt: new Date(Date.now() - 60 * 60 * 1000) }
    });
    console.log(`🧹 Dọn ${result.deletedCount} user chưa xác minh.`);
  } catch (err) {
    console.error('❌ Lỗi dọn user chưa xác minh:', err);
  }
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});
server.timeout = 600000;

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});
