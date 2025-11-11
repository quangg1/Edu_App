from docx import Document
import pdfplumber
import google.generativeai as genai

import os
import time

import json, re
import logging

from datetime import datetime
from typing import Dict
import tempfile
import pypandoc
from dotenv import load_dotenv
from pypandoc.pandoc_download import download_pandoc

from pydantic import BaseModel, Field, validator
from typing import Optional, Literal
import shutil
from pathlib import Path




load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
#---------------------------
#  Set up 
#---------------------------

def setup_logging():
    fmt = "[%(asctime)s] %(levelname)s %(name)s: %(message)s"
    logging.basicConfig(level=logging.INFO, format=fmt)
    return logging.getLogger("quiz")

def setup_pandoc():
    try:
        if shutil.which("pandoc"):
            logger.info("Pandoc OK (PATH).")
            return
        pypandoc.get_pandoc_path()  # Kiểm tra trong cache của pypandoc
        logger.info("Pandoc OK (cache).")
        return
    except Exception:
        logger.warning("Pandoc chưa có, đang tải...")
        download_pandoc()
        logger.info("Pandoc đã sẵn sàng.")

genai.configure(api_key=GOOGLE_API_KEY)
logger = setup_logging()
setup_pandoc()

#-----------------------------
#  Quizz Validator
#-----------------------------
class QuizzContentValidate(BaseModel):
    text_content: Optional[str] = Field(None, description="Nội dung văn bản gốc để tao quiz")
    name: Optional[str] = Field("Bài Kiểm Tra", description="Tên của bài kiểm tra")
    subject: Optional[str] = Field(None, description="Tên môn học")
    grade: Optional[int] = Field(None, ge=1, le=12, description="Khối lớp(vd: 10,11,12,..)")
    num_questions: int = Field(10, ge=1, le=50, description="Số lượng câu hỏi cần tạo")
    time_limit: int = Field(45, ge=10, le=180, description="Thời gian làm bài")
    difficulty: Literal["Easy", "Medium", "Hard"] = Field("Medium", description="Mức độ của đề kiểm tra")
    topic: Optional[str] = Field(None, description="Chủ đề của Kiểm Tra")
    percentage: int = Field(70, ge=0, le=100, description="Tỷ lệ (%) câu hỏi trắc nghiệm")

# ----------------------------
#  Utility: Extract text
# ----------------------------

def extract_text_from_pdf(file_path):
    """
    Trích xuất văn bản từ file PDF bằng pdfplumber để có kết quả tốt hơn.
    """
    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        # Nếu không trích xuất được gì, có thể file là ảnh scan
        if not text.strip():
            return "Không thể trích xuất văn bản từ file PDF này. File có thể là một hình ảnh được scan."
        return text
    except Exception as e:
        logger.error(f"Lỗi khi xử lý file PDF: {e}")
        # Trả về một thông báo lỗi rõ ràng
        return "Tài liệu PDF bị lỗi hoặc không thể đọc được."

def extract_text_from_docx(file_path):
    try:
        doc = Document(file_path)
        return "\n".join([para.text for para in doc.paragraphs])
    except Exception as e:
        logger.error(f"Lỗi khi xử lý file DOCX: {e}")
        return "Tài liệu DOCX bị lỗi hoặc không thể đọc được."

# ----------------------------
# Main: Generate Test
# ----------------------------

def generate_test(text, name =None, subject=None, grade=None, num_questions=10, time_limit=45, difficulty="medium", topic=None, percentage=70):
    model = genai.GenerativeModel("gemini-2.5-flash")

    context_info = ""
    if subject:
        context_info += f"Môn học: {subject}\n"
    if grade:
        context_info += f"Cấp học/lớp: {grade}\n"
    if topic:
        context_info += f"Chủ đề: {topic}\n"

# Tạo prompt
    prompt = f"""
    Bạn là một giáo viên chuyên nghiệp. Hãy tạo một đề kiểm tra tên {name}, có {num_questions} câu hỏi có {percentage}% trắc nghiệm, {100-percentage} tự luận (10đ) cho {context_info} với độ khó {difficulty} trong thời gian {time_limit} phút, dựa vào <Nội dung> và các yêu cầu sau:

    <Yêu cầu>
    - **Chỉ trả về một đối tượng JSON hợp lệ.** Không bao gồm bất kỳ văn bản nào khác, lời giải thích hay ký tự ```json.
    - Đối với những backslash trong văn bản mà , hãy sử dụng double backslash `\\` để tránh lỗi phân tích cú pháp JSON.
    - Các mục tiêu, học liệu, và phương pháp đánh giá phải được trình bày dưới dạng một **mảng các chuỗi** (array of strings), trong đó mỗi chuỗi tương ứng với một gạch đầu dòng.
    - Câu hỏi tự luận yêu cầu học sinh trình bày ngắn gọn, súc tích.
    - Đánh số thứ tự câu hỏi rõ ràng.
    - Cung cấp đáp án cho từng câu hỏi.
    - Đối với thời gian và dộ khó, hãy đảm bảo chúng phù hợp với số lượng và loại câu hỏi.
    - Phải có ít nhất 3 câu hỏi bài tập vận dụng.
    </Yêu cầu>

    <Các bước thực hiện>
    1. Phân tích kỹ <Nội dung> để xác định các điểm quan trọng.
    2. Lên kế hoạch phân bổ câu hỏi trắc nghiệm và tự luận.
    3. Soạn câu hỏi phù hợp với độ khó và thời gian quy định.
    4. Kiểm tra lại đề kiểm tra để đảm bảo tính chính xác và phù hợp.
    </Các bước thực hiện>

    <Kết quả đầu ra>
    - Kết quả cần định dạng json đúng theo <Định dạng đầu ra>.
    - Phân loại câu hỏi theo:
        - Remember (Nhớ): 30%
        - Understand (Hiểu): 30%
        - Apply (Áp dụng): 20%
        - Analyze (Phân tích): 10%
        - Evaluate (Đánh giá): 10%
    - Câu hỏi trắc nghiệm và tự luận rõ ràng, dễ hiểu.
    - Đối với các ký hiệu đặc biệt và ký hiệu khoa học, hãy sử dụng định dạng Latex và bỏ trong  dấu $..$ để có thể chuyển đổi dễ dàng.
    - Đảm bảo tính logic và mạch lạc trong từng câu hỏi đề kiểm tra.
    - thứ tự sắp xếp ưu tiên các câu hỏi: multiple choice trước, essay sau.
    - các trường phải đầy đủ, không bỏ trống và chỉ chứa đúng nội dung của trường đó thôi.
    </Kết quả đầu ra>

    <Định dạng đầu ra>
    {{
        "name": {name if name else "Đề kiểm tra"},
        "subject": {subject if subject else "..."},
        "grade": {grade if grade else "..."},
        "time_limit": {time_limit},
        "question_count": {num_questions},
        "questions": [
            {{
                "id": 1,
                "type": "multiple choice", // hoặc "essay"
                "question": "Nội dung câu hỏi....",
                "options": {{ // trống nếu là câu hỏi tự luận
                    "A": "...",
                    "B": "...",
                    "C": "...",
                    "D": "..."
                }},
                "correct_answer": "",
                "explanation": "...",
                "difficulty": 3,
                "taxonomy": "remember",
                "keywords": ["..."],
                "topic": "..."
            }}
        ],
        "study_suggestions": ["..."],
        "references": ["..."],
        "search_terms": ["..."]
    }}
    """

    full_prompt = prompt + f"\n\n<Nội dung tài liệu> \n{text[:10000]}\n</Nội dung tài liệu>"

# Generate content by gemini-2.5-flash
    try:
        logger.info("Gửi yêu cầu đến mô hình Gemini-2.5-flash...")
        response = model.generate_content(full_prompt)
        raw_text = response.text.strip()
        if not raw_text:
            logger.error(f"Lỗi khi gọi mô hình sinh văn bản: {e}")
            return {"error": "Lỗi khi gọi mô hình sinh văn bản."}
        
        #Collect JSON part from raw_text
        start_index = raw_text.find('{')
        end_index = raw_text.rfind('}') + 1

        if start_index == -1 or end_index == 0:
            logger.error("Mô hình không trả về đối tượng JSON hợp lệ.")
            return {
                    "error": "Model did not return a valid JSON object.", 
                    "raw_output": raw_text
            }

        json_text = raw_text[start_index:end_index]
        print("JSON Text:", json_text)
        
        #Load JSON
        try:
            mcqs = json.loads(json_text)
            logger.info("Đề kiểm tra đã được tạo thành công.")
            return mcqs
        
        except json.JSONDecodeError as e:
            logger.error(f"Lỗi phân tích cú pháp JSON: {e}")
            return {"error": "Lỗi phân tích cú pháp JSON từ đầu ra của mô hình.", "raw_output": raw_text}
    
    except Exception as e:
        logger.error(f"Lỗi khi gọi mô hình sinh văn bản: {e}")
        return {"error": "Lỗi khi gọi mô hình sinh văn bản."}    
    
# ----------------------------
# Export: JSON to DOCX
# ----------------------------

def export_quiz_to_docx(data):
    """
    Chuyển dữ liệu đề kiểm tra (JSON) sang file Markdown và DOCX.
    File được lưu trong thư mục 'exports'.

    Args:
        data (dict): Dữ liệu JSON gồm name, subject, grade, time_limit, questions[]

    Returns:
        str: Tên file DOCX đã tạo (ví dụ: 'quiz_1730000000.docx') hoặc None nếu lỗi.
    """
    try:
        # 1. Định nghĩa thư mục lưu trữ và đảm bảo nó tồn tại
        EXPORT_DIR = Path("exports")
        EXPORT_DIR.mkdir(parents=True, exist_ok=True)
        
        # 2. Tạo tên file độc nhất để tránh ghi đè và dễ quản lý
        timestamp = int(time.time() * 1000)
        file_name = f"quiz_{timestamp}.docx" 
        md_file_name = f"quiz_{timestamp}.md"

        # 3. Tạo đường dẫn lưu trữ đầy đủ
        md_path = EXPORT_DIR / md_file_name
        docx_path = EXPORT_DIR / file_name

        md = []
        flag = False
        # ... (Phần code tạo chuỗi Markdown giữ nguyên) ...
        md.append(f"""---
title: "{data['name']}"
subtitle: |
    Môn: {data['subject']}
    Lớp: {data['grade']}
    Số câu hỏi: {data['question_count']}
date: "{data['time_limit']} phút"
lang: "vi"

---

""")
        
        for q in data.get("questions", []):
            q_type = q.get("type", "multiple choice")
            q_id = q.get("id", "?")
            q_text = q.get("question", "")
            correct = q.get("correct_answer", "")
            explanation = q.get("explanation", "")
            options = q.get("options", {})

            if q_type == "essay" and not flag:
                md.append("\n---\n")
                md.append("## Phần Tự Luận\n")
                flag = True

            md.append(f"### Câu {q_id}: {q_text}\n")

            if q_type == "multiple choice":
                for k, v in options.items():
                    md.append(f" **{k}.** {v}\n")
                md.append(f"\n **Đáp án đúng:** {correct}\n")
            else:
                md.append(("\n" + "."*160 + "\n")*3)
                md.append(f" **Trả lời:** {correct}\n")

            md.append(f" *Giải thích:* {explanation}\n")

        md_text = "\n".join(md)
        # 4. Ghi file Markdown vào đường dẫn mới
        with open(md_path, "w", encoding="utf-8") as f:
            f.write(md_text)

        # 5. Chuyển đổi sang DOCX và lưu vào đường dẫn mới
        try:
            logger.info("Chuyển đổi Markdown sang DOCX...")
            pypandoc.convert_text(
                md_text,
                "docx",
                format="markdown+tex_math_dollars+yaml_metadata_block",
                outputfile=str(docx_path), # Cần chuyển Path object sang str
                extra_args=["--reference-doc=../templates/template.docx"] 
            )

        except Exception as e:
            logger.error(f"Lỗi khi chuyển đổi sang DOCX: {e}")
            return None

        logger.info(f"Tạo file DOCX hoàn tất: {file_name}")
        # 6. Trả về tên file (để dùng trong URL tải về)
        return file_name 

    except Exception as e:
        logger.error(f"Lỗi khi xuất đề kiểm tra sang DOCX: {e}")
        return None


#Main workflow
"""
if __name__ == "__main__":
    # Example usage
    file_path = "tron-bo-bien-soan-ly-thuyet-vat-li-12.thuvienvatly.com.5b796.50647.pdf"  # Context filepath
    text = extract_text_from_pdf(file_path)
    start_time = time.time()
    test = generate_test(text, name="Bài kiểm tra Vật Lý giữa kỳ", subject="Vật lý", grade="Lớp 12", num_questions=20, time_limit=45, difficulty="Trung bình", topic="Động lực học chất điểm", percentage=70)
    if "error" in test:
        print("Lỗi khi tạo đề kiểm tra:", test["error"])
        print("Đầu ra thô từ mô hình:", test["raw_output"])
    else:
        docx_file = export_quiz_to_docx(test, md_path="de_kiem_tra.md", docx_path="de_kiem_tra.docx")
    end_time = time.time()
    print(f"Thời gian tạo đề kiểm tra: {end_time - start_time} giây")
"""

    