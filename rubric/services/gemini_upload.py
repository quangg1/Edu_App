from google import genai
import os
import tempfile
import mimetypes
from typing import List, Optional, Any
from fastapi import UploadFile

# Define allowed MIME types for safety
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",  # .docx
    "application/msword",  # .doc
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",  # .pptx
    "text/plain",  # .txt
}

async def upload_files_to_gemini(client: genai.Client, files: Optional[List[UploadFile]]) -> List[Any]:
    """
    Upload user-provided files (PDF, Word, PowerPoint, TXT) to Gemini's file storage.

    Notes:
        - Files are persisted temporarily on disk because the Gemini SDK expects file paths.
        - Each file is uploaded individually, and temp files are deleted afterward.
        - Only specific MIME types are allowed (see ALLOWED_MIME_TYPES).
        - Each uploaded file object will be extended to include a `.mime_type` attribute for later use.

    Args:
        client (genai.Client): Configured Gemini client.
        files (Optional[List[UploadFile]]): List of uploaded files from FastAPI.

    Returns:
        List[Any]: List of uploaded Gemini file objects, each with `.uri` and `.mime_type` attributes.
    """
    uploaded_files = []
    if not files:
        return uploaded_files

    for f in files:
        # Detect MIME type based on file extension
        mime_type, _ = mimetypes.guess_type(f.filename)
        if mime_type is None:
            mime_type = "application/octet-stream"

        # Reject unsupported formats
        if mime_type not in ALLOWED_MIME_TYPES:
            print(f"⚠️ Unsupported file type: {f.filename} ({mime_type}) – skipping upload.")
            continue

        data = await f.read()
        suffix = "_" + f.filename
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(data)
            tmp_path = tmp.name

        try:
            uploaded = client.files.upload(file=tmp_path)
            uploaded_files.append({
                "uri": uploaded.uri,
                "mime_type": mime_type,
                "filename": f.filename
            })
            print(f"✅ Uploaded to Gemini: {f.filename} ({len(data)} bytes) -> {uploaded.uri} [{mime_type}]")
        finally:
            try:
                os.remove(tmp_path)
            except Exception:
                pass

    return uploaded_files
