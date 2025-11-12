const LessonPlan = require('../models/LessonPlan');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');
const https = require("https"); 
const fetch = require('node-fetch');
const AI_SERVICE_URL = 'http://localhost:8004'; // URL của AI Service/FastAPI

const TEST_USER_ID = '60c72b2f9c3c6f0015f8a123'; 

// Hàm tiện ích lấy User ID hoặc Mock ID
const getUserId = (req) => {
    // Giả định middleware auth đã gắn req.user
    return req.user && req.user._id ? req.user._id : TEST_USER_ID;
};


exports.generateLessonPlanStream = async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  try {
    console.log("=== [generateLessonPlanStream] ===");
    console.log("req.body:", req.body);
    console.log("req.file:", req.file ? req.file.originalname : "no file");

    const {
      title,
      grade,
      subject,
      method,
      duration,
      objectives,
      model,
      type,
      prompt: userPrompt,
    } = req.body || {};

    const selectedType = type || "k12";
    const aiEndpoint =
      selectedType === "custom"
        ? "/generate-custom-stream"
        : selectedType === "kindergarten"
        ? "/generate-kindergarten-stream"
        : "/generate-k12-stream";

    // 🧠 Tạo prompt khác nhau tùy theo loại
    let lessonPrompt = "";

    if (selectedType === "custom") {
      // Dành cho custom: chỉ dùng prompt người dùng nhập
      lessonPrompt = userPrompt?.trim() || "Tạo tài liệu tùy chỉnh.";
    } else {
      // Dành cho kindergarten & k12: tổng hợp field thành prompt
      const fields = [
        `- Chủ đề/Tiêu đề: ${title || "(chưa có)"}`,
        `- Lớp học: ${grade || "(chưa có)"}`,
        `- Môn học: ${subject || "(chưa có)"}`,
        `- Phương pháp: ${method || "CTGDPT 2018"}`,
        `- Thời lượng: ${duration || "45 phút"}`,
        `- Mục tiêu: ${objectives || "Chưa xác định"}`,
      ];

      lessonPrompt = `Tôi cần bạn tạo một giáo án chi tiết phù hợp với giáo dục Việt Nam.\n${fields.join("\n")}`;

      if (userPrompt?.trim()) {
        lessonPrompt += `\n- Yêu cầu thêm: ${userPrompt.trim()}`;
      }
    }

    console.log("=> Generated lessonPrompt:\n", lessonPrompt.slice(0, 400));

    const agent = AI_SERVICE_URL.startsWith("https")
      ? new https.Agent({ rejectUnauthorized: false })
      : undefined;

    // ⚙️ Chuẩn bị FormData
    const form = new FormData();
    form.append("prompt", lessonPrompt);
    form.append("model", model || "gemini-2.5-flash");

    // Nếu có file đính kèm
    if (req.file) {
      form.append("files", fs.createReadStream(req.file.path), {
        filename: req.file.originalname || "upload.bin",
        contentType: req.file.mimetype || "application/octet-stream",
      });
    }

    console.log(`➡️ Forwarding to: ${AI_SERVICE_URL}${aiEndpoint}`);

    const aiResponse = await fetch(`${AI_SERVICE_URL}${aiEndpoint}`, {
      method: "POST",
      body: form,
      headers: form.getHeaders(),
      agent,
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI service error:", aiResponse.status, errText);
      res.write(
        `event: error\ndata: {"message": "AI service error ${aiResponse.status}", "body": ${JSON.stringify(
          errText
        )}}\n\n`
      );
      return res.end();
    }

    // ✅ Stream nội dung từ FastAPI → client
    for await (const chunk of aiResponse.body) {
      res.write(chunk);
      if (res.flush) res.flush();
    }

    res.end();
  } catch (error) {
    console.error("❌ Stream error:", error);
    res.write(
      `event: error\ndata: {"message": ${JSON.stringify(error.message)}}\n\n`
    );
    res.end();
  }
};

exports.downloadLessonPlanByToken = async (req, res) => {
  const { token } = req.params;
  const type = req.headers['x-type'] || 'k12'; // Lấy type từ header

  if (!token) {
    return res.status(400).json({
      success: false,
      message: "Thiếu token tải xuống.",
    });
  }

  try {
    // Sửa lại URL endpoint cho khớp với FastAPI
    const fileUrl = `${AI_SERVICE_URL}/download-lesson-plan/${token}`;
    const response = await axios({
      url: fileUrl,
      method: "GET",
      responseType: "stream",
      headers: {
        'x-type': type // Forward type đến FastAPI
      }
    });

    if (response.status !== 200) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy file tương ứng với token: ${token}`,
      });
    }

    // Forward content-type từ FastAPI response
    const contentType = response.headers['content-type'];
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    // Đặt tên file phù hợp với loại
    const filename = type === 'custom' 
      ? `tai_lieu_${token}.docx`
      : `giao_an_${token}.docx`;
      
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );

    // Truyền trực tiếp stream từ FastAPI → client
    response.data.pipe(res);

  } catch (error) {
    console.error("❌ Lỗi tải file:", error.message);
    res.status(500).json({
      success: false,
      message: "Lỗi khi tải file từ AI Service.",
      error: error.message,
    });
  }
};

exports.saveLessonPlanFromToken = async (req, res) => {
    const { token } = req.body; 

    if (!token) {
        return res.status(400).json({ success: false, message: "Thiếu token." });
    }

    try {
        const dataFetchUrl = `${AI_SERVICE_URL}/lesson-plan-data/${token}`;
        
        const response = await axios.get(dataFetchUrl);
        const lessonPlanData = response.data; 

        if (!lessonPlanData || !lessonPlanData.content) {
            return res.status(404).json({ success: false, message: "Không tìm thấy dữ liệu giáo án từ token. Dữ liệu có thể đã hết hạn." });
        }
        
        // 2. Lưu vào CSDL
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

        console.log('📝 Saving lesson plan with:', {
            userId,
            title: lessonPlanData.title,
            token
        });

        const newLessonPlan = await LessonPlan.create({
            teacher: {
                id: userId
            },
            title: lessonPlanData.title || "Giáo án AI mới",
            subject: {
                name: lessonPlanData.metadata?.subject || "Không xác định",
                code: lessonPlanData.metadata?.subject || ""
            },
            grade: {
                level: lessonPlanData.metadata?.grade ? Number(lessonPlanData.metadata.grade) : null,
                name: lessonPlanData.metadata?.grade ? `Lớp ${lessonPlanData.metadata.grade}` : null
            },
            notes: lessonPlanData.content || "",
            isAIGenerated: true,
            aiModel: 'Gemini-VeronLabs',
            generationTime: new Date(),
            status: 'completed',
            downloadToken: token
        });

        console.log('✅ Lesson plan saved successfully:', newLessonPlan._id);

        // 3. Phản hồi thành công
        res.status(201).json({ 
            success: true, 
            message: "Lưu giáo án thành công!", 
            lessonPlanId: newLessonPlan._id 
        });

    } catch (error) {
        console.error('❌ Lỗi khi lưu Lesson Plan từ token:', error);
        console.error('   Error name:', error.name);
        console.error('   Error message:', error.message);
        if (error.errors) {
            console.error('   Validation errors:', JSON.stringify(error.errors, null, 2));
        }
        if (error.stack) {
            console.error('   Stack:', error.stack);
        }
        
        let errorMessage = error.message;
        if (axios.isAxiosError(error) && error.response) {
             errorMessage = `Lỗi từ AI API (${error.response.status}): Không thể lấy dữ liệu giáo án.`;
        } else if (error.name === 'MongoError' || error.name === 'MongooseError') {
             errorMessage = `Lỗi CSDL: Không thể lưu giáo án.`;
        }

        res.status(500).json({ 
            success: false, 
            message: "Lỗi hệ thống khi lưu giáo án.", 
            error: errorMessage,
            ...(process.env.NODE_ENV === 'development' && { 
                details: error.errors || error.stack 
            })
        });
    }
};

// Lấy danh sách lesson plans
exports.getLessonPlans = async (req, res) => {
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
                { chapter: { $regex: search, $options: 'i' } }
            ];
        }

        const lessonPlans = await LessonPlan.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await LessonPlan.countDocuments(query);

        res.json({
            success: true,
            data: lessonPlans,
            pagination: {
                total: count,
                page: parseInt(page),
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('❌ Lỗi lấy danh sách lesson plans:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy danh sách giáo án',
            error: error.message
        });
    }
};