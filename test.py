from typing import List, Optional
from fastapi import FastAPI, Form, UploadFile, File, HTTPException, APIRouter
from fastapi.responses import StreamingResponse, FileResponse
from rubric.services.streaming_test import stream_rubric_gemini_direct, DOWNLOAD_STORE
from rubric.services.prompt_builder import RUBRIC_SYSTEM_PROMPT_GEMINI, _format_user_block
import uvicorn, os
from rubric.converters.rubric_docx import rubric_to_docx

app = FastAPI()
@app.post(
    "/rubric/generate_gemini_stream",
    summary="Sinh Rubric JSON bằng Gemini (streaming SSE)",
    description="Upload 0..n file (PDF/DOCX/PPTX/TXT) -> đính vào Gemini -> stream tiến trình sinh JSON rubric.",
)
async def generate_rubric_gemini_stream(
    rubric_title: str = Form(..., description="Tiêu đề Rubric", examples=["Bài thuyết trình tính chất hóa học của kim loại"]),
    subject: str = Form(..., description="Môn học", examples=["Khoa học tự nhiên (Môn Hóa)"]),
    grade_level: str = Form(..., description="Khối lớp", examples=["Lớp 9"]),
    assessment_type: str = Form(..., description="Loại đánh giá", examples=["Thuyết trình"]),
    number_of_criteria: int = Form(..., description="Số tiêu chí", examples=[5]),
    user_prompt: Optional[str] = Form("", description="Yêu cầu bổ sung (nếu có)"),
    files: Optional[List[UploadFile]] = File(None, description="Tài liệu tham khảo (tuỳ chọn)"),
):
    """
    Streaming endpoint for generating rubric JSON with Gemini.
    Emits real-time progress and partial outputs as SSE events.
    """
    gen = stream_rubric_gemini_direct(
        rubric_title=rubric_title,
        subject=subject,
        grade_level=grade_level,
        assessment_type=assessment_type,
        number_of_criteria=number_of_criteria,
        user_prompt=user_prompt,
        files=files,
    )
    return StreamingResponse(gen
                             , media_type="text/event-stream"
                             , headers={
        "Cache-Control": "no-cache"
        , "Connection": "keep-alive"
        , "X-Accel-Buffering": "no"
                             })

@app.get("/download-rubric/{token}")
async def download_rubric(token: str):
    meta = DOWNLOAD_STORE.get(token)
    if not meta or not os.path.exists(meta["path"]):
        raise HTTPException(status_code=404, detail="Invalid or expired token")

    return FileResponse(
        meta["path"],
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=meta["filename"],
    )
def run_app():
    # nest_asyncio.apply() # May be needed in environments like Jupyter/Colab
    uvicorn.run(app, host="0.0.0.0", port=8003)

if __name__ == "__main__":
    run_app()