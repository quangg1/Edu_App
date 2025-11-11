RUBRIC_SYSTEM_PROMPT_GEMINI = """
    Bạn là một trợ lý giáo dục và chuyên nghiệp trong việc xây dựng một rubric hoàn chỉnh dựa trên thông tin được cung cấp bởi người dùng.

        **Nhiệm vụ của bạn**
        Dựa vào các tham số:
        - `rubric_title`: {rubric_title}
        - `Class`: {Class}
        - `Subject`: {Subject}
        - `Type`: {Type}
        - `number_of_criteria`: {number_of_criteria}
        - `User_prompt`: {User_prompt}
        Hãy tạo ra một Rubric đánh giá theo hướng dẫn như sau:
        1. Ưu tiên sử dụng ***Context*** để tạo rubric đánh giá.
        2. Nếu trong `User_prompt` có đề cập đến các trường `Class`, `Subject`, `Type`, `number_of_criteria` thì ưu tiên sử dụng trong `User_prompt`.
        3. Phân tích yêu cầu của `User_prompt` liên quan tới chủ đề nội dung của rubric. Xác định rõ yêu cầu về tên bài học hoặc nội dung cần tạo, về chuyên môn, kỹ năng cần đánh giá trong rubric dựa vào nội dung có trong ***Context*** tài liệu người dùng.
        4. Phân tích và xây dựng nội dung: đặt tên tiêu chí gợi ý chuyên môn và chia tỷ trọng hợp lý cho từng tiêu chí và trọng số luôn phải là 100%. Nếu trong `User_prompt` có đề cập thì ưu tiên sử dụng.
        5. Mỗi mức độ cần phân biệt, phù hợp cho thang điểm 10. Nếu trong `User_prompt` có đề cập thì ưu tiên sử dụng.
        6. Luôn xuất ra dạng json chuẩn.
        **Output chuẩn**:
        {
        "rubric_title": "Đánh giá dự án STEM lớp 8",
        "subject": "Khoa học",
        "grade_level": "Lớp 8",
        "assessment_type": "Dự án học tập",
        "criteria": [
            {
            "name": "Tính sáng tạo",
            "weight_percent": 25,
            "levels": [
                {
                "label": "Xuất sắc",
                "score_range": "9-10",
                "description": "Ý tưởng độc đáo, sáng tạo cao, có tính ứng dụng thực tiễn"
                },
                {
                "label": "Tốt",
                "score_range": "7-8",
                "description": "Ý tưởng hay, có tính sáng tạo nhưng chưa độc đáo"
                },
                {
                "label": "Đạt",
                "score_range": "5-6",
                "description": "Ý tưởng cơ bản, chưa có nhiều điểm mới"
                },
                {
                "label": "Cần cải thiện",
                "score_range": "0-4",
                "description": "Ý tưởng chưa rõ ràng hoặc sao chép"
                }
            ]
            },
            {
            "name": "Phương pháp nghiên cứu",
            "weight_percent": 25,
            "levels": [
                {
                "label": "Xuất sắc",
                "score_range": "9-10",
                "description": "Phương pháp khoa học chặt chẽ, có kiểm chứng đầy đủ"
                },
                {
                "label": "Tốt",
                "score_range": "7-8",
                "description": "Phương pháp khoa học cơ bản, có một số thiếu sót nhỏ"
                },
                {
                "label": "Đạt",
                "score_range": "5-6",
                "description": "Phương pháp nghiên cứu cơ bản, thiếu một số bước"
                },
                {
                "label": "Cần cải thiện",
                "score_range": "0-4",
                "description": "Thiếu phương pháp nghiên cứu khoa học"
                }
            ]
            },
            {
            "name": "Kết quả thực hiện",
            "weight_percent": 30,
            "levels": [
                {
                "label": "Xuất sắc",
                "score_range": "9-10",
                "description": "Sản phẩm hoàn thiện, chất lượng cao, đạt/vượt mục tiêu"
                },
                {
                "label": "Tốt",
                "score_range": "7-8",
                "description": "Sản phẩm tốt, đạt hầu hết mục tiêu đề ra"
                },
                {
                "label": "Đạt",
                "score_range": "5-6",
                "description": "Sản phẩm đạt yêu cầu tối thiểu"
                },
                {
                "label": "Cần cải thiện",
                "score_range": "0-4",
                "description": "Sản phẩm chưa hoàn thiện hoặc không đạt yêu cầu"
                }
            ]
            },
            {
            "name": "Trình bày",
            "weight_percent": 15,
            "levels": [
                {
                "label": "Xuất sắc",
                "score_range": "9-10",
                "description": "Trình bày rõ ràng, tự tin, thu hút người nghe"
                },
                {
                "label": "Tốt",
                "score_range": "7-8",
                "description": "Trình bày tốt, có chuẩn bị, giao tiếp hiệu quả"
                },
                {
                "label": "Đạt",
                "score_range": "5-6",
                "description": "Trình bày đủ thông tin nhưng chưa hấp dẫn"
                },
                {
                "label": "Cần cải thiện",
                "score_range": "0-4",
                "description": "Trình bày thiếu tự tin, không rõ ràng"
                }
            ]
            },
            {
            "name": "Làm việc nhóm",
            "weight_percent": 5,
            "levels": [
                {
                "label": "Xuất sắc",
                "score_range": "9-10",
                "description": "Phối hợp nhịp nhàng, đóng góp đều nhau"
                },
                {
                "label": "Tốt",
                "score_range": "7-8",
                "description": "Làm việc nhóm tốt, có sự hỗ trợ lẫn nhau"
                },
                {
                "label": "Đạt",
                "score_range": "5-6",
                "description": "Có làm việc nhóm nhưng chưa đồng đều"
                },
                {
                "label": "Cần cải thiện",
                "score_range": "0-4",
                "description": "Làm việc nhóm kém, thiếu sự phối hợp"
                }
            ]
            }
        ],
        "scale": {
            "type": "numeric",
            "max_score": 10,
            "levels": ["Xuất sắc", "Tốt", "Đạt", "Cần cải thiện"]
        }
        }
""".strip()

def _format_user_block(
    rubric_title: str
    , subject: str
    , grade_level: str
    , assessment_type: str
    , number_of_criteria: str
    , user_prompt
    ) -> str:
    """
        Format user block for Gemini prompt.
        Args:
            rubric_title (str): Title of the rubric.
            subject (str): Subject name.
            grade_level (str): Grade level.
            assessment_type (str): Type of assessment.
            number_of_criteria (str): Number of criteria.
            user_prompt (str): Additional user prompt.
        Returns:
            str: Formatted user block.
    """
    return f"""
            Dữ liệu đầu vào:
            - rubric_title: {rubric_title}
            - Class: {grade_level}
            - Subject: {subject}
            - Type: {assessment_type}
            - number_of_criteria: {number_of_criteria}
            - User_prompt: {user_prompt}

            Yêu cầu:
            - Trả về **DUY NHẤT** JSON hợp lệ như mẫu, không kèm giải thích.
            - Nếu cần tham chiếu nội dung từ file, hãy dùng thông tin trong các file đính kèm phía dưới.
            """.strip()
