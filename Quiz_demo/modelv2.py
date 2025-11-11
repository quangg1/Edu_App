from docx import Document
import pdfplumber
from google import genai

import os
import time

import json, re


import logging

import pypandoc
from dotenv import load_dotenv

from pydantic import BaseModel, Field
from typing import Optional, Literal, Tuple, List, Dict, Any
import shutil
from pathlib import Path

from Quiz_demo.config import setup_logging, setup_pandoc


load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
client = genai.Client(api_key=GOOGLE_API_KEY)


logger = setup_logging()



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
#  Build Prompt
# ----------------------------

def build_prompt(text, name =None, subject=None, grade=None, num_questions=10, time_limit=45, difficulty="medium", topic=None, percentage=70):
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
    - Phân loại và sắp xếp đầy đủ câu hỏi theo:
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
                "type": ["multiple choice" hoặc "essay"]
                "question": "Nội dung câu hỏi....",
                "options": {{ trống nếu là câu hỏi tự luận
                    "A": "...",
                    "B": "...",
                    "C": "...",
                    "D": "..."
                }},
                "correct_answer": "",
                "explanation": "...",
            }}
        ],
    }}
    """

    full_prompt = prompt + f"\n\n<Nội dung tài liệu> \n{text[:10000]}\n</Nội dung tài liệu>"
    return full_prompt

#-----------------------------------
#  Convert to MD
#-----------------------------------
def export_json_to_md(data: Dict, export_dir: str = "exports"):
    try:
        # 1. Định nghĩa thư mục lưu trữ và đảm bảo nó tồn tại
        EXPORT_DIR = Path(export_dir)
        EXPORT_DIR.mkdir(parents=True, exist_ok=True)
        
        # 2. Tạo tên file độc nhất để tránh ghi đè và dễ quản lý
        timestamp = int(time.time() * 1000) 
        md_file_name = f"quiz_{timestamp}.md"

        # 3. Tạo đường dẫn lưu trữ đầy đủ
        md_path = EXPORT_DIR / md_file_name

        md = []
        flag = False
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
        
        md.append("---\n")
        md.append("## Phần Trắc Nghiệm\n")

        for q in data.get("questions", []):
            if q["type"] == "essay" and not flag:
                md.append("\n---\n")
                md.append("## Phần Tự Luận\n")
                flag = True
            md.append(f"### Câu {q['id']}: ")
            md.append(q["question"] + "\n")

            if q["type"] == "multiple choice":
                for k, v in q["options"].items():
                    md.append(f" **{k}.** {v}\n")
                md.append(f"\n **Đáp án đúng:** {q['correct_answer']}\n")
            else:
                md.append("\n" + "."*400 + "\n")
                md.append(f" **Trả lời:** {q['correct_answer']}\n")

            md.append(f" *Giải thích:* {q['explanation']}\n")

        md_text = "\n".join(md)
        with open(md_path, "w", encoding="utf-8") as f:
            f.write(md_text)
        
        return md_text

    except Exception as e:
        logger.error(f"Lỗi khi xuất đề kiểm tra sang md: {e}")
        return None

#---------------------------
# Export to Docx
#---------------------------
def convert_md_to_docx(
    md_text: str, 
    export_dir: str = "exports",
    reference_doc: str = "templates/template.docx"
    ):
    # 5. Chuyển đổi sang DOCX và lưu vào đường dẫn mới
    try:
        EXPORT_DIR = Path(export_dir)
        EXPORT_DIR.mkdir(parents=True, exist_ok=True)
        
        # 2. Tạo tên file độc nhất để tránh ghi đè và dễ quản lý
        timestamp = int(time.time() * 1000)
        file_name = f"quiz_{timestamp}.docx"
        docx_path = EXPORT_DIR / file_name

        ref = Path(reference_doc)
        extra_arg = []
        if ref.exists():
            extra_arg = [f"--reference-doc={str(ref)}"]
        else:
            logger.warning(f"Reference doc không tồn tại: {ref} → bỏ qua.")

        logger.info("Chuyển đổi Markdown sang DOCX...")
        pypandoc.convert_text(
            md_text,
            "docx",
            format="markdown+tex_math_dollars+yaml_metadata_block",
            outputfile=str(docx_path), # Cần chuyển Path object sang str
            extra_args=extra_arg
        )
        abs_path = str(docx_path.resolve())
        logger.info(f"Tạo file DOCX hoàn tất: {abs_path}")
        return abs_path

    except Exception as e:
        logger.error(f"Lỗi khi chuyển đổi sang DOCX: {e}")
        return None
        
def take_json(raw_text):
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
    except Exception as e:
        logger.eror(f"Không load được json: {e}")
        return None

#------------------------------------
#  Cut QUESTION
#------------------------------------
def cut_question_in_buffer(buffer: str) -> Tuple[List[Dict[str, Any]], str]:
    """
    Nhận vào buffer (string tích lũy từ model).
    Cố gắng parse ra các object câu hỏi dạng { "id": ... } hoàn chỉnh.
    Trả về (ds_cau_hoi_moi_parse_duoc, buffer_còn_dư_chưa_đủ).

    Ý tưởng:
    - Lặp tìm { "id":
    - Dùng json.JSONDecoder.raw_decode() để decode 1 object
    - Nếu decode thành công → append vào list kết quả, cắt phần đã parse khỏi buffer và lặp tiếp
    - Nếu decode fail → dừng, vì có thể object đang còn dở (chưa stream hết)
    """
    decoder = json.JSONDecoder()
    questions: List[Dict[str, Any]] = []
    QUESTION_START_PATTERN = re.compile(r'\{\s*"id":')

    scan_pos = 0
    while True:
        m = QUESTION_START_PATTERN.search(buffer, scan_pos)
        if not m:
            break

        start_pos = m.start()

        try:
            obj, end_pos = decoder.raw_decode(buffer, start_pos)
        except json.JSONDecodeError:
            # object chưa đầy đủ (model chưa stream hết)
            break

        # Lưu câu hỏi
        questions.append(obj)

        # Cắt phần đã parse ra khỏi buffer, vì ta đã tiêu thụ nó rồi
        buffer = buffer[end_pos:]
        scan_pos = 0  # reset vì buffer mới đã được cắt từ giữa

    return questions, buffer
    

