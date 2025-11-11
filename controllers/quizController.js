const axios = require("axios");
const https = require("https");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

// Configure https agent and axios defaults (Giữ nguyên)


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