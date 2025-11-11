import time, asyncio
import os
import logging
from pathlib import Path
from typing import Optional, AsyncGenerator, Any
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from modelv2 import extract_text_from_pdf, extract_text_from_docx, build_prompt, take_json, cut_question_in_buffer, export_json_to_md, convert_md_to_docx
from config import  QuizzContentValidate, setup_logging, QuizResponse, QuizPayLoad
from google import genai
from google.genai import types
from dotenv import load_dotenv
import json

load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
client = genai.Client(api_key=GOOGLE_API_KEY)

app = FastAPI(title="QuizAI", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

logger = setup_logging()

def sse(event: str, data: Any) -> str:
    """
    Format a Server-Sent Event (SSE) message.
    Each SSE event must contain "event:" and "data:" lines, then an empty line as a separator.
    The payload must be a string; we JSON-encode dict/list to ensure consistent client parsing.
    Args:
        event (str): The event type/name.
        data (Any): The event payload, can be str, dict, list, etc.
    Returns:
        str: Formatted SSE message.
    """
    payload = data if isinstance(data, str) else json.dumps(data, ensure_ascii=False)
    return f"event: {event}\n" f"data: {payload}\n\n"

@app.get("/healthz")
def healthz(): return "ok"

@app.post("/api/v2/quiz/generate-quiz-stream")
async def api_generate_quiz(
    file: Optional[UploadFile] = File(default=None),
    text_content: Optional[str] = Form(default=None),
    name: Optional[str] = Form(default=None),
    subject: Optional[str] = Form(default=None),
    grade: Optional[int] = Form(default=None),
    num_questions: int = Form(default=5),
    time_limit: int = Form(default=15),
    difficulty: str = Form(default="Easy"),
    topic: Optional[str] = Form(default=None),
    percentage: int = Form(default=70),
):
    start_time= time.time()

    quiz_data = QuizzContentValidate(
        text_content=text_content,
        name=name,
        subject=subject,
        grade=grade,
        num_questions=num_questions,
        time_limit=time_limit,
        difficulty=difficulty,
        topic=topic,
        percentage=percentage,
    )
    
    # Check exist file or text:
    if not file and not (text_content and text_content.strip()):
        raise HTTPException(status_code=400, detail="Cần upload file hoặc cung cấp text_content.")
    
    # Extract input content
    if file:
        suffix = Path(file.filename).suffix.lower()
        tmp = Path("uploads")/f"{int(time.time())}_{file.filename}"
        tmp.parent.mkdir(parents=True, exist_ok=True)
        with open(tmp, "wb") as f:
            f.write(await file.read())
        if suffix == ".pdf":
            text = extract_text_from_pdf(str(tmp))
        elif suffix == ".docx":
            text = extract_text_from_docx(str(tmp))
        else:
            try:
                tmp.unlink(missing_ok=True)
            finally:
                pass
            raise HTTPException(status_code=415, detail="Chỉ hỗ trợ .pdf hoặc .docx")
        try: 
            tmp.unlink(missing_ok=True)
        finally:
            pass
    else:
        text = QuizzContentValidate.text_content.strip()

    prompt = build_prompt(
        text, 
        quiz_data.name, 
        quiz_data.subject, 
        quiz_data.grade, 
        quiz_data.num_questions, 
        quiz_data.time_limit, 
        quiz_data.difficulty, 
        quiz_data.topic, 
        quiz_data.percentage
    )
    
    async def gen() -> AsyncGenerator[str, None]:
        yield sse("status", {"message":"calling gemini....."})
        resp = client.models.generate_content_stream(
            model = "gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=("""
                - Trả về đúng json schema đã được định nghĩa
                - Sắp xếp câu hỏi theo thứ tự: Trắc nghiệm -> tự luận, Dễ -> khó
                - Response chỉ có json hợp lệ, KHÔNG in text ra ngoài JSON. 
                """),
                response_mime_type='application/json',
                response_json_schema=QuizResponse.model_json_schema()
            )
        )
        full_json = []
        buffer = ""
        sent_question_ids = set()
        for chunk in resp:
            t = getattr(chunk, "text", None)
            if not t:
                continue
            full_json.append(t)
            buffer += t
            
            
            new_question, buffer = cut_question_in_buffer(buffer)
            for q in new_question:
                q_id = q.get("id")
                if q_id in sent_question_ids:
                    continue
                sent_question_ids.add(q_id)
                yield sse("generating",{"detail": q})

        yield sse("status", {"message":"generated"})

        raw_text = "".join(full_json).strip()
        
        cleaned_text = raw_text
        

        if cleaned_text.startswith("```json"):
            cleaned_text = cleaned_text[len("```json"):]
        

        if cleaned_text.endswith("```"):
            cleaned_text = cleaned_text[:-len("```")]


        cleaned_text = cleaned_text.strip()
        
        quiz = take_json(cleaned_text)


        if isinstance(quiz, dict) and "error" in quiz:
            quiz["raw_output"] = raw_text
            logger.error(f"JSON Parsing Error. Raw output: {raw_text[:500]}...")

        yield sse("Done", {"detail": quiz})

    duration = time.time() - start_time
    logger.info(f"Time:{duration}s")
    return StreamingResponse(
        gen(), 
        media_type="text/event-stream",
        headers={
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Transfer-Encoding": "chunked",
        "X-Accel-Buffering": "no",
        }
    )

#-----------------------------
# API Export DOCX FILE
#-----------------------------
@app.post('/api/v2/quiz/export-docx')
async def Export_file_Docx(payload: QuizPayLoad):
    data = payload.quiz

    if "questions" not in data or not isinstance(data["questions"], list):
        raise HTTPException(status_code=400, detail="Quiz không hợp lệ: thiếu danh sách câu hỏi.")

    raw_md = export_json_to_md(data, "exports")
    if not raw_md:
        raise HTTPException(status_code=500, detail="Không thể tạo file MarkDown")
    
    docx_path = convert_md_to_docx(raw_md, "exports", "templates/template.docx")
    if not docx_path:
        raise HTTPException(status_code=500, detail="Không thể chuyển sang DOCX.")

    filename = Path(docx_path).name
    download_url = f"/api/v2/download/{filename}"

    return {
        "status": "ok",
        "download_url": download_url,
        "filename": filename,
    }


@app.post('/api/v2/download/{filename}')
async def download_doc(file_name: str):
    file_path = Path("exports") / file_name
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File không tồn tại")

    return FileResponse(
        path=str(file_path),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=file_name
    )
def run_app():
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8006)

if __name__ == "__main__":
    run_app()    