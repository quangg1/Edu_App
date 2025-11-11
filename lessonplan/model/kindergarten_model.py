from __future__ import annotations
from typing import List, Literal, Union, Annotated, Optional
from pydantic import BaseModel, Field

# THÔNG TIN CHUNG
class KindergartenMeta(BaseModel):
    school_name: Optional[str] = Field(None, description="Tên trường")
    teacher_name: Optional[str] = Field(None, description="Họ tên giáo viên")
    subject: str = Field(..., description="Chủ đề")
    lesson_title: str = Field(..., description="Đề tài")

# MỤC TIÊU
class KindergartenSTEAM(BaseModel):
    science: List[str] = Field(..., description="Yếu tố khoa học (Science)")
    technology: List[str] = Field(..., description="Yếu tố công nghệ (Technology)")
    engineering: List[str] = Field(..., description="Yếu tố kỹ thuật (Engineering)")
    mathematics: List[str] = Field(..., description="Yếu tố toán học (Mathematics)")

class KindergartenObjectives(BaseModel):
    steam: KindergartenSTEAM = Field(..., description="Mục tiêu đạt được tương ứng với chuẩn giáo dục STEM")
    skills: List[str] = Field(..., min_items=1, description="Mục tiêu đạt được về kỹ năng")
    attitude: List[str] = Field(..., min_items=1, description="Mục tiêu đạt được về phẩm chất, thái độ")

# CHUẨN BỊ
class KindergartenPrepare(BaseModel):
    place: str = Field(..., description="Địa điểm")
    teacher: List[str] = Field(..., min_items=1, description="Đồ dùng chuẩn bị của giáo viên")
    student: List[str] = Field(..., min_items=1, description="Đồ dùng chuẩn bị của trẻ")

# TỔ CHỨC THỰC HIỆN
class StepExecute(BaseModel):
    teacher_activity: List[str] = Field(..., min_items=2, description="Hoạt động của giáo viên")
    student_activity: List[str] = Field(..., min_items=2, description="Hoạt động của trẻ")

class ActivityStep(BaseModel):
    """Các bước tổ chức thực hiện của một hoạt động theo mô hình 5E trong giáo dục STEM ở mầm non."""
    engagement: StepExecute = Field(..., description="Bước 1: Gắn kết")
    exploration: StepExecute = Field(..., description="Bước 2: Khám phá")
    explanation: StepExecute = Field(..., description="Bước 3: Giải thích và chia sẻ")
    elaborate: StepExecute = Field(..., description="Bước 4: Áp dụng")
    evaluate: StepExecute = Field(..., description="Bước 5: Đánh giá")

# GIÁO ÁN
class Kindergarten(BaseModel):
    meta: KindergartenMeta = Field(..., description="Thông tin chung")
    objectives: KindergartenObjectives = Field(..., description="Mục tiêu bài học")
    resources: KindergartenPrepare = Field(..., description="Chuẩn bị cho bài học")
    activities: ActivityStep = Field(..., description="Các bước tổ chức thực hiện bài học")