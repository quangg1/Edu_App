const axios = require("axios");
const https = require("https");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

// URL đến service FastAPI
const AI_SERVICE_URL = "http://localhost:8004"; // Đổi lại nếu chạy ở server khác

/**
 * 🎯 Stream trực tiếp Rubric từ Gemini (SSE)
 */
exports.generateRubricStream = async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  try {
    const {
      rubric_title,
      subject,
      grade_level,
      assessment_type,
      number_of_criteria,
      user_prompt,
    } = req.body;

    // Chuẩn bị form gửi FastAPI
    const form = new FormData();
    form.append("rubric_title", rubric_title);
    form.append("subject", subject);
    form.append("grade_level", grade_level);
    form.append("assessment_type", assessment_type);
    form.append("number_of_criteria", number_of_criteria);
    if (user_prompt) form.append("user_prompt", user_prompt);

    if (req.files) {
      const filePath = path.resolve(req.files.path);
      form.append("files", fs.createReadStream(filePath), {
        filename: req.file.originalname,
      });
    }

    // Kết nối tới FastAPI streaming endpoint
    const endpoint = `${AI_SERVICE_URL}/rubric/generate_gemini_stream`;
    const agent = AI_SERVICE_URL.startsWith("https")
      ? new https.Agent({ rejectUnauthorized: false })
      : undefined;

    const response = await fetch(endpoint, {
      method: "POST",
      body: form,
      headers: form.getHeaders(),
      agent,
    });

    if (!response.ok) {
      const text = await response.text();
      res.write(
        `event: error\ndata: {"message": "AI service error: ${response.statusText}", "body": ${JSON.stringify(
          text
        )}}\n\n`
      );
      return res.end();
    }

    // 🚀 Stream dữ liệu từ FastAPI → client
    for await (const chunk of response.body) {
      res.write(chunk);
      res.flush?.();
    }

    res.end();
  } catch (error) {
    console.error("❌ Rubric stream error:", error);
    res.write(`event: error\ndata: {"message": "${error.message}"}\n\n`);
    res.end();
  } finally {
    if (req.file) fs.unlink(req.file.path, () => {});
  }
};
exports.downloadRubric = async (req, res) => {
  const { token } = req.params;

  if (!token) {
      return res.status(400).json({ error: "Thiếu token tải xuống." });
  }

  try {
      const endpoint = `${AI_SERVICE_URL}/download-rubric/${token}`;
      
      // Sử dụng agent để xử lý các vấn đề về chứng chỉ SSL nếu AI_SERVICE_URL là HTTPS
      const agent = AI_SERVICE_URL.startsWith("https")
          ? new https.Agent({ rejectUnauthorized: false })
          : undefined;

      // 1. Gọi service FastAPI để lấy file stream
      const response = await fetch(endpoint, {
          method: "GET",
          agent,
      });

      if (!response.ok) {
          // Xử lý lỗi từ FastAPI (ví dụ: token hết hạn)
          const errorBody = await response.text();
          let errorMessage = `Lỗi dịch vụ AI (${response.status}): Không thể tải xuống file.`;
          try {
              const jsonError = JSON.parse(errorBody);
              errorMessage = jsonError.detail || errorMessage;
          } catch (e) {
              // Bỏ qua lỗi parse, sử dụng thông báo mặc định
          }
          return res.status(response.status).json({ error: errorMessage });
      }

      // 2. Lấy và thiết lập các header cần thiết (Content-Type, Content-Disposition)
      // Các header này được FastAPI trả về qua FileResponse
      const contentType = response.headers.get("Content-Type") || "application/octet-stream";
      const contentDisposition = response.headers.get("Content-Disposition") || `attachment; filename="rubric_download.docx"`;

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", contentDisposition);
      
      // 3. Proxy luồng dữ liệu file trực tiếp về client
      if (response.body) {
           // Node.js stream pipe
          for await (const chunk of response.body) {
              res.write(chunk);
          }
      }
      
      res.end();

  } catch (error) {
      console.error("❌ Rubric download error:", error);
      res.status(500).json({ error: "Lỗi nội bộ máy chủ khi tải xuống file." });
  }
};
