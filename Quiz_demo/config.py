from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Literal

import logging
from pypandoc.pandoc_download import download_pandoc

#---------------------------
#  Set up 
#---------------------------
def setup_logging():
    fmt = "[%(asctime)s] %(levelname)s %(name)s: %(message)s"
    logging.basicConfig(level=logging.INFO, format=fmt)
    return logging.getLogger("quiz")

logger = setup_logging()

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

setup_pandoc()


#---------------------------
# Validator
#---------------------------
class QuizPayLoad(BaseModel):
    quiz: Dict
    
class Option(BaseModel):
    A: str
    B: str
    C: str
    D: str

class Question(BaseModel):
    id: int
    type: str
    question: str
    options: Optional[Dict[str, str]] = None
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None

class QuizResponse(BaseModel):
    name: str = Field(..., description="Tên bài kiểm tra")
    subject: str
    grade: int
    time_limit: int
    question_count: int
    questions: List[Question]
    study_suggestions: Optional[List[str]]
    references: Optional[List[str]]
    search_terms: Optional[List[str]]

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