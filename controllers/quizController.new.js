const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

// Hàng đợi job trong bộ nhớ
const quizJobs = new Map();

/**
 * Tạo job mới và xử lý bất đồng bộ
 */
exports.createQuizJob = async (req, res) => {
  try {
    // Validate input
    if (!req.file && !req.body.text_content) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp file hoặc nội dung văn bản"
      });
    }

    // Generate jobId and get uploaded file
    const jobId = `quiz-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const uploadedFile = req.file;
    const startTime = Date.now();

    // Lưu job vào bộ nhớ với trạng thái ban đầu
    quizJobs.set(jobId, { 
      status: "processing", 
      data: null, 
      error: null,
      startTime 
    });

    // Trả về ngay cho frontend
    res.json({ jobId, status: "processing" });

    // Xử lý bất đồng bộ trong background
    setImmediate(async () => {
      try {
        // Chuẩn bị form data
        const formData = new FormData();

        // Thêm file nếu có
        if (uploadedFile) {
          const filePath = path.resolve(uploadedFile.path);
          formData.append("file", fs.createReadStream(filePath), uploadedFile.originalname);
        }

        // Thêm text content nếu có
        if (req.body.text_content) {
          formData.append("text_content", req.body.text_content);
        }

        // Thêm các trường khác
        const fields = ['name', 'subject', 'grade', 'topic', 'num_questions', 'time_limit', 'difficulty', 'percentage'];
        fields.forEach(field => {
          if (req.body[field] !== undefined) {
            formData.append(field, req.body[field]);
          }
        });

        // Gọi API
        const target = process.env.GEMINI_PROXY_URL || "https://gemini.veronlabs.com/bot4";
        const aiResponse = await axios.post(
          `${target.replace(/\/$/, "")}/generate-quiz`,
          formData,
          {
            headers: { ...formData.getHeaders() },
            timeout: 10 * 60 * 1000, // 10 phút
          }
        );

        const data = aiResponse.data;

        // Check for API errors
        if ("error" in data) {
          throw new Error(data.error);
        }

        // Get file name from response
        const result_filename = data.file_name;
        if (!result_filename) {
          throw new Error("Lỗi tạo DOCX: Không nhận được tên file");
        }

        // Prepare normalized response matching the FastAPI format
        const normalized = {
          status: "success",
          name: req.body.name || "Quiz AI Generated",
          subject: req.body.subject || "Không xác định",
          grade: req.body.grade || null,
          difficulty: req.body.difficulty || "Medium",
          num_questions: req.body.num_questions || 10,
          time_limit: req.body.time_limit || 45,
          duration: `${((Date.now() - startTime) / 1000).toFixed(2)}s`,
          file_name: result_filename,
          questions: data.questions || [],
          download_url: `/download/${result_filename}`
        };

        // Cập nhật job hoàn tất
        quizJobs.set(jobId, { 
          status: "completed", 
          data: normalized,
          error: null
        });

      } catch (error) {
        console.error("❌ Job lỗi:", error.message);
        quizJobs.set(jobId, { 
          status: "failed", 
          error: error.message,
          data: null
        });
      } finally {
        // Cleanup file
        if (uploadedFile) {
          fs.unlink(uploadedFile.path, () => {});
        }
      }
    });

  } catch (err) {
    console.error("❌ Lỗi tạo job:", err.message);
    return res.status(500).json({
      success: false,
      message: "Không thể khởi tạo job",
      error: err.message
    });
  }
};

/**
 * Endpoint để frontend hỏi trạng thái job
 */
exports.getQuizJobStatus = (req, res) => {
  const job = quizJobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ 
      success: false,
      error: "Không tìm thấy job" 
    });
  }

  // Trả về theo format tương tự FastAPI
  if (job.status === "completed") {
    return res.json({
      success: true,
      status: job.status,
      result: job.data
    });
  }

  if (job.status === "failed") {
    return res.status(502).json({
      success: false,
      status: job.status,
      error: job.error
    });
  }

  return res.json({
    success: true,
    status: job.status
  });
};