from typing import AsyncGenerator, List, Optional
import re, uuid, os, tempfile
import json
from fastapi import UploadFile
from .sse import sse
from .gemini_upload import upload_files_to_gemini
from .gemini_client import get_gemini_client
from .prompt_builder import RUBRIC_SYSTEM_PROMPT_GEMINI, _format_user_block
from .json_parser import RUBRIC_KEYS_ORDER, json_extract_braced, json_try_load, stream_emit_known_keys
from ..converters.rubric_docx import rubric_to_docx

DOWNLOAD_STORE = {}
async def stream_rubric_gemini_direct(
    rubric_title: str,
    subject: str,
    grade_level: str,
    assessment_type: str,
    number_of_criteria: int,
    user_prompt: str,
    files: Optional[List[UploadFile]],
    model: str = "gemini-2.5-flash",
) -> AsyncGenerator[str, None]:
    """
    Stream a rubric JSON using Gemini, emitting SSE events as soon as chunks arrive.
    Events:
      - status: general status messages
      - debug: optional debug info (token fragments)
      - rubric_*: partial key events (rubric_title, subject, grade_level, assessment_type, criteria, scale)
      - rubric_json: final full JSON
      - error: error messages

    The function tries to emit partial structured data when a full JSON object is already parsable,
    otherwise it keeps streaming partial text (optional).
    Args:
        rubric_title (str): Title of the rubric.
        subject (str): Subject name.
        grade_level (str): Grade level.
        assessment_type (str): Type of assessment.
        number_of_criteria (int): Number of criteria.
        user_prompt (str): Additional user prompt.
        files (Optional[List[UploadFile]]): List of user-uploaded files.
        model (str): Gemini model to use.
    Yields:
        AsyncGenerator[str, None]: SSE events as strings.
    """
    # 1) Init client
    try:
        client = get_gemini_client()
    except Exception as e:
        yield sse("error", {"message": f"Client init failed: {str(e)}"})
        return

    # 2) Upload files
    try:
        uploaded_files = await upload_files_to_gemini(client, files)
    except Exception as e:
        yield sse("error", {"message": f"File upload failed: {str(e)}"})
        return

    # 3) Build parts for Gemini
    parts = [
        {"text": RUBRIC_SYSTEM_PROMPT_GEMINI},
        {"text": _format_user_block(
            rubric_title, subject, grade_level, assessment_type, number_of_criteria, user_prompt
        )},
    ]
    for uf in uploaded_files:
        parts.append({
            "file_data": {
                "file_uri": uf["uri"],
                "mime_type": uf["mime_type"]
            }
        })
    
    yield sse("status", {"message": "Starting Gemini streaming..."})

    # 4) Start streaming
    try:
        stream = client.models.generate_content_stream(
            model=model,
            contents=[{"role": "user", "parts": parts}],
            config={"temperature": 0.0},   # keep deterministic
        )
    except Exception as e:
        yield sse("error", {"message": f"Start stream failed: {str(e)}"})
        return

    buffer = ""
    already_sent_keys = set()

    # 5) Consume streaming chunks
    try:
        for chunk in stream:
            # NOTE: Each SDK exposes chunk fields differently. You used 'chunk.text' already.
            part = getattr(chunk, "text", None)
            if not part:
                continue

            buffer += part

            # OPTIONAL: if you want token preview in UI
            # yield sse("debug", {"partial_text": part})

            # Attempt to parse a full JSON as soon as possible (brace-balanced extraction)
            obj = json_extract_braced(buffer)
            if obj and isinstance(obj, dict):
                # Emit partial structured keys as soon as we can parse the JSON
                def _emit(k, v):
                    yield sse(f"rubric_{k}", v)

                # Actually emit the events
                for k in RUBRIC_KEYS_ORDER:
                    if k in obj and k not in already_sent_keys:
                        yield sse(f"rubric_{k}", obj[k])
                        already_sent_keys.add(k)

                for k, v in obj.items():
                    if k not in already_sent_keys:
                        yield sse(f"rubric_{k}", v)
                        already_sent_keys.add(k)

        # 6) After stream finishes, try final parse and emit the full JSON
        final_obj = json_extract_braced(buffer) or json_try_load(buffer)
        if not final_obj:
            # Best-effort regex fallback
            m = re.search(r"\{.*\}", buffer, flags=re.DOTALL)
            if m:
                try:
                    final_obj = json.loads(m.group(0))
                except Exception:
                    pass

        if final_obj:
            yield sse("rubric_json", final_obj)
            
            token = uuid.uuid4().hex
            
            safe_title = re.sub(r'[^\w\s-]', '', final_obj.get("rubric_title", "Rubric")).strip().replace(" ", "_")
            filename = f"{safe_title}.docx"
            
            out_path = os.path.join(tempfile.gettempdir(), f"{token}_{filename}")
            rubric_to_docx(final_obj, out_path, landscape=True)
            DOWNLOAD_STORE[token] = {"path": out_path, "filename": filename}
            yield sse("download_url", {
                "url": f"/download-lesson-plan/{token}",
                "message": f"Rubric đã sẵn sàng: {filename}"
            })
            yield sse("status", {"message": "Done"})
        else:
            yield sse("error", {"message": "Could not parse final JSON from stream."})

    except Exception as e:
        yield sse("error", {"message": f"Streaming error: {str(e)}"})
