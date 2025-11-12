const axios = require("axios");
const https = require("https");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const Rubric = require('../models/Rubric');

// URL đến service FastAPI
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8004";
const TEST_USER_ID = '60c72b2f9c3c6f0015f8a123'; 

// Hàm tiện ích lấy User ID hoặc Mock ID
const getUserId = (req) => {
    return req.user && req.user._id ? req.user._id : TEST_USER_ID;
};

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

// Lưu Rubric vào database sau khi generation hoàn thành
exports.saveRubric = async (req, res) => {
    try {
        const { 
            title, 
            subject, 
            grade, 
            assessmentType,
            criteria,
            description,
            downloadToken
        } = req.body;

        if (!title || !criteria || !Array.isArray(criteria)) {
            return res.status(400).json({ 
                success: false, 
                message: "Thiếu thông tin bắt buộc: title, criteria" 
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

        // Chuyển đổi criteria từ format AI sang format database
        const formattedCriteria = criteria.map((c) => {
            // Handle different criteria formats from AI
            if (c.name && c.levels) {
                // Already in correct format
                return {
                    name: c.name,
                    description: c.description || '',
                    weightPercent: c.weight_percent || c.weightPercent || 0,
                    levels: (Array.isArray(c.levels) ? c.levels : []).map((level) => ({
                        label: level.label || level.name || '',
                        scoreRange: level.score_range || level.scoreRange || '',
                        description: level.description || ''
                    }))
                };
            } else if (c.criterion_name) {
                // Alternative format
                return {
                    name: c.criterion_name,
                    description: c.criterion_description || '',
                    weightPercent: c.weight_percent || 0,
                    levels: Array.isArray(c.levels) ? c.levels : []
                };
            } else {
                // Fallback
                return {
                    name: c.name || JSON.stringify(c),
                    description: c.description || '',
                    weightPercent: c.weight_percent || 0,
                    levels: []
                };
            }
        });

        console.log('📝 Saving rubric with:', {
            userId,
            title,
            criteriaCount: formattedCriteria.length,
            firstCriterion: formattedCriteria[0] ? {
                name: formattedCriteria[0].name,
                levelsCount: formattedCriteria[0].levels?.length || 0
            } : null
        });

        const newRubric = await Rubric.create({
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
            description: description || '',
            assessmentType: assessmentType || 'presentation',
            criteria: formattedCriteria,
            isAIGenerated: true,
            aiModel: 'Gemini-VeronLabs',
            generationTime: new Date(),
            status: 'draft',
            downloadToken: downloadToken
        });

        console.log('✅ Rubric saved successfully:', newRubric._id);

        res.status(201).json({
            success: true,
            message: "Lưu thang đánh giá thành công!",
            data: {
                rubricId: newRubric._id,
                title: newRubric.title,
                criteriaCount: newRubric.criteria.length
            }
        });

    } catch (error) {
        console.error('❌ Lỗi khi lưu Rubric:', error);
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
            message: "Lỗi hệ thống khi lưu thang đánh giá.",
            error: error.message,
            ...(process.env.NODE_ENV === 'development' && { 
                details: error.errors || error.stack 
            })
        });
    }
};

// Lấy danh sách rubrics
exports.getRubrics = async (req, res) => {
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

        const rubrics = await Rubric.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .select('-criteria.levels'); // Hide detailed levels in list

        const count = await Rubric.countDocuments(query);

        res.json({
            success: true,
            data: rubrics,
            pagination: {
                total: count,
                page: parseInt(page),
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('❌ Lỗi lấy danh sách rubrics:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy danh sách thang đánh giá',
            error: error.message
        });
    }
};

// Lấy chi tiết một rubric
exports.getRubric = async (req, res) => {
    try {
        const rubric = await Rubric.findById(req.params.id);

        if (!rubric) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thang đánh giá'
            });
        }

        res.json({
            success: true,
            data: rubric
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy thang đánh giá',
            error: error.message
        });
    }
};
