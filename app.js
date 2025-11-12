const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const lessonPlanRoutes = require('./routes/lessonPlanRoutes');
const quizRoutes = require('./routes/quizRoutes');
const rubricRoutes = require('./routes/rubricRoutes');
// const adminRoutes = require('./routes/adminRoutes');
const { errorHandler } = require('./middlewares/errorHandler');
const { generalLimiter } = require('./middlewares/validation');
const http = require('http');

const app = express();
const server = http.createServer(app);
app.set('trust proxy', 1);
// Set higher timeout for long running requests
server.timeout = 10 * 60 * 1000; // 10 minutes
app.set('timeout', 10 * 60 * 1000); // 10 minutes

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://edu-app-h2f9.onrender.com',
    'http://localhost:8006',
    'http://localhost:8007',
    'http://localhost:8004',
  ],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));
app.use('/api', generalLimiter);

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/lesson-plans', lessonPlanRoutes);
app.use('/api/v1/quizzes', quizRoutes);
app.use('/api/v1/rubrics', rubricRoutes);
// app.use('/api/v1/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Không tìm thấy ${req.originalUrl}` });
});


app.use(errorHandler);



module.exports = { app, server };
