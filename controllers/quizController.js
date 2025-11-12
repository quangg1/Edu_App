const axios = require("axios");
const https = require("https");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const Quiz = require('../models/Quiz');

// Configure https agent and axios defaults (Giữ nguyên)

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8004';
const TEST_USER_ID = '60c72b2f9c3c6f0015f8a123'; 

// Hàm tiện ích lấy User ID hoặc Mock ID
const getUserId = (req) => {
    return req.user && req.user._id ? req.user._id : TEST_USER_ID;
};

// Set axios defaults (Giữ nguyên)
axios.defaults.baseURL = 'http://localhost:8004';
axios.defaults.headers.common['Access-Control-Allow-Origin'] = '*';
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

exports.streamQuizGeneration = async (req, res) => {
    const uploadedFile = req.file;
    const startTime = Date.now();

    // 1. Validate input
    if (!uploadedFile && !req.body.text_content) {
        return res.status(400).json({
            success: false,
            message: "Vui lòng cung cấp file hoặc nội dung văn bản"
        });
    }

    // 2. Setup SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Transfer-Encoding': 'chunked',
        'X-Accel-Buffering': 'no',
    });

    try {
        const formData = new FormData();

        if (uploadedFile) {
            const filePath = path.resolve(uploadedFile.path);
            formData.append("file", fs.createReadStream(filePath), uploadedFile.originalname);
        }

        const fields = ['name', 'subject', 'grade', 'topic', 'num_questions', 'time_limit', 'difficulty', 'percentage', 'text_content'];
        fields.forEach(field => {
            if (req.body[field] !== undefined) {
                formData.append(field, req.body[field]);
            }
        });

        // 3. Gửi request tới FastAPI
        const aiResponse = await axios.post(
            'http://localhost:8004/generate-quiz-stream',
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    'Origin': 'http://localhost:8005',
                },
                httpsAgent,
                responseType: 'stream',
                timeout: 600000
            }
        );

        // 4. Pipe stream tới client
        aiResponse.data.pipe(res);

        aiResponse.data.on('end', () => {
            console.log(`✅ Stream completed in ${((Date.now() - startTime) / 1000).toFixed(2)}s.`);
        });

        aiResponse.data.on('error', (err) => {
            console.error("❌ Stream từ FastAPI lỗi:", err.message);
            res.write('event: error\n');
            res.write(`data: ${JSON.stringify({ error: err.message || 'Lỗi stream không xác định từ backend' })}\n\n`);
            res.end();
        });

    } catch (error) {
        console.error("❌ Lỗi khởi tạo Stream:", error.message);

        let errorMessage = error.message;
        if (error.response?.data) {
            errorMessage = error.response.data.detail || error.response.data.message || errorMessage;
        }

        if (res.headersSent) {
            res.write('event: error\n');
            res.write(`data: ${JSON.stringify({ error: errorMessage || 'Lỗi khởi tạo stream' })}\n\n`);
            res.end();
        } else {
            return res.status(error.response?.status || 500).json({
                success: false,
                message: "Không thể khởi tạo stream quiz",
                error: errorMessage
            });
        }
    } finally {
        // 5. Cleanup file tạm
        if (uploadedFile) {
            fs.unlink(uploadedFile.path, () => {});
        }
    }
};
exports.exportDocx = async (req, res) => {
  try {
      const quizPayload = req.body; 

      const response = await axios.post(
          '/export-docx', 
          quizPayload,
          {
              headers: {
                  'Content-Type': 'application/json',
              },
              httpsAgent: httpsAgent,
              timeout: 30000, // Timeout 30s
          }
      );

      res.json(response.data);

  } catch (error) {
      console.error("❌ Lỗi Export DOCX:", error.message);
      
      // Xử lý lỗi từ FastAPI (ví dụ: 400, 500)
      const status = error.response?.status || 500;
      const detail = error.response?.data?.detail || "Lỗi không xác định khi tạo DOCX.";

      return res.status(status).json({
          success: false,
          message: detail,
          error: error.message
      });
  }
};
exports.downloadDocx = async (req, res) => {
  const fileName = req.params.filename;
  
  try {
      // 1. Gọi API FastAPI /api/v2/download/{filename}
      const response = await axios.post(
          `/api/v2/download/${fileName}`, // Lưu ý: FastAPI của bạn dùng POST cho download
          {}, // Body rỗng nếu API không yêu cầu payload, hoặc thêm payload nếu cần
          {
              responseType: 'stream', // RẤT QUAN TRỌNG: để nhận về stream/binary data
              httpsAgent: httpsAgent,
              timeout: 60000, // Timeout 60s
          }
      );

      // 2. Thiết lập headers tải file cho client
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      const contentDisposition = response.headers['content-disposition'] || `attachment; filename="${fileName}"`;

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', contentDisposition);
      
      // 3. Pipe (truyền) stream file về client
      response.data.pipe(res);

      response.data.on('error', (err) => {
          console.error("❌ Lỗi Stream File:", err.message);
          res.end();
      });

  } catch (error) {
      console.error("❌ Lỗi tải file:", error.message);
      const status = error.response?.status || 500;
      const detail = error.response?.data?.detail || "File không thể tải xuống hoặc không tồn tại.";

      // Nếu header chưa gửi, trả về lỗi HTTP
      if (!res.headersSent) {
          return res.status(status).json({
              success: false,
              message: detail
          });
      }
      res.end();
  }
};

// Lưu Quiz vào database sau khi generation hoàn thành
exports.saveQuiz = async (req, res) => {
    try {
        const { 
            title, 
            subject, 
            grade, 
            questions, 
            timeLimit, 
            difficulty,
            file_name,
            download_url 
        } = req.body;

        if (!title || !questions || !Array.isArray(questions)) {
            return res.status(400).json({ 
                success: false, 
                message: "Thiếu thông tin bắt buộc: title, questions" 
            });
        }

        const userId = getUserId(req);
        
        // Validate userId is a valid ObjectId
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            console.error('❌ Invalid userId:', userId);
            return res.status(400).json({
                success: false,
                message: "User ID không hợp lệ"
            });
        }

        // Helper function to format options
        const formatOptions = (options) => {
            if (!Array.isArray(options)) {
                return [];
            }
            return options.map((opt, idx) => {
                // If already in correct format
                if (typeof opt === 'object' && opt.optionKey && opt.optionText) {
                    return opt;
                }
                // If it's a string, convert to format
                if (typeof opt === 'string') {
                    return {
                        optionKey: String.fromCharCode(65 + idx), // A, B, C, D
                        optionText: opt
                    };
                }
                // If it's an object but not in correct format
                if (typeof opt === 'object') {
                    return {
                        optionKey: opt.key || opt.optionKey || String.fromCharCode(65 + idx),
                        optionText: opt.text || opt.optionText || opt.value || String(opt)
                    };
                }
                return {
                    optionKey: String.fromCharCode(65 + idx),
                    optionText: String(opt)
                };
            });
        };

        // Chuyển đổi questions từ format AI sang format database
        const formattedQuestions = questions.map((q, index) => {
            let questionText = '';
            let options = [];
            let correctAnswer = null;
            
            // Handle different question formats from AI
            if (q.questionText) {
                // Already in correct format
                questionText = q.questionText;
                options = formatOptions(q.options || []);
                correctAnswer = q.correctAnswer;
            } else if (q.question) {
                // Alternative format
                questionText = q.question;
                options = formatOptions(q.choices || q.options || []);
                correctAnswer = q.answer || q.correctAnswer;
            } else {
                // Fallback: use the whole object
                questionText = JSON.stringify(q);
                options = [];
                correctAnswer = null;
            }

            // Normalize questionType: 'multiple choice' -> 'multiple-choice', etc.
            let normalizedQuestionType = (q.questionType || q.type || 'multiple-choice').toLowerCase();
            if (normalizedQuestionType === 'multiple choice') {
                normalizedQuestionType = 'multiple-choice';
            } else if (normalizedQuestionType === 'true false') {
                normalizedQuestionType = 'true-false';
            } else if (normalizedQuestionType === 'short answer') {
                normalizedQuestionType = 'short-answer';
            }
            
            // Normalize difficulty: 'Medium' -> 'medium', etc.
            let normalizedDifficulty = (q.difficulty || difficulty || 'medium').toLowerCase();
            if (!['easy', 'medium', 'hard'].includes(normalizedDifficulty)) {
                normalizedDifficulty = 'medium'; // Default to medium if invalid
            }

            return {
                questionNumber: index + 1,
                questionType: normalizedQuestionType,
                questionText: questionText,
                options: options,
                correctAnswer: correctAnswer,
                explanation: q.explanation || '',
                difficulty: normalizedDifficulty,
                topic: q.topic || ''
            };
        });

        console.log('📝 Saving quiz with:', {
            userId,
            title,
            questionCount: formattedQuestions.length,
            firstQuestion: formattedQuestions[0] ? {
                text: formattedQuestions[0].questionText?.substring(0, 50),
                optionsCount: formattedQuestions[0].options?.length
            } : null
        });

        const newQuiz = await Quiz.create({
            teacher: {
                id: userId
            },
            subject: {
                name: subject || "Không xác định",
                code: subject || ""
            },
            grade: {
                level: grade ? Number(grade) : null,
                name: grade ? `Lớp ${grade}` : null
            },
            title: title,
            questions: formattedQuestions,
            settings: {
                timeLimit: timeLimit || 45,
                passingScore: 70,
                shuffleQuestions: false,
                shuffleOptions: true,
                showResults: true,
                showCorrectAnswers: false
            },
            isAIGenerated: true,
            aiModel: 'Gemini-VeronLabs',
            status: 'draft',
            quizType: 'test'
        });

        console.log('✅ Quiz saved successfully:', newQuiz._id);

        res.status(201).json({
            success: true,
            message: "Lưu đề thi thành công!",
            data: {
                quizId: newQuiz._id,
                title: newQuiz.title,
                questionCount: newQuiz.questions.length
            }
        });

    } catch (error) {
        console.error('❌ Lỗi khi lưu Quiz:', error);
        console.error('   Error name:', error.name);
        console.error('   Error message:', error.message);
        if (error.errors) {
            console.error('   Validation errors:', JSON.stringify(error.errors, null, 2));
        }
        if (error.stack) {
            console.error('   Stack:', error.stack);
        }
        
        res.status(500).json({
            success: false,
            message: "Lỗi hệ thống khi lưu đề thi.",
            error: error.message,
            ...(process.env.NODE_ENV === 'development' && { 
                details: error.errors || error.stack 
            })
        });
    }
};

// Lấy danh sách quizzes
exports.getQuizzes = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, subject, grade, search } = req.query;
        const query = {};

        const userId = getUserId(req);
        query['teacher.id'] = userId;

        if (status) query.status = status;
        if (subject) query['subject.name'] = { $regex: subject, $options: 'i' };
        if (grade) query['grade.level'] = Number(grade);
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const quizzes = await Quiz.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .select('-questions.options -questions.correctAnswer'); // Hide answers in list

        const count = await Quiz.countDocuments(query);

        res.json({
            success: true,
            data: quizzes,
            pagination: {
                total: count,
                page: parseInt(page),
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('❌ Lỗi lấy danh sách quizzes:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy danh sách đề thi',
            error: error.message
        });
    }
};

// Lấy chi tiết một quiz
exports.getQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);

        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đề thi'
            });
        }

        res.json({
            success: true,
            data: quiz
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy đề thi',
            error: error.message
        });
    }
};