from __future__ import annotations
from typing import List, Literal, Union, Annotated, Optional
from pydantic import BaseModel, Field

# THÔNG TIN CHUNG
class K12Meta(BaseModel):
    school_name: Optional[str] = Field(None, description="Tên trường")
    teacher_name: Optional[str] = Field(None, description="Họ tên giáo viên")
    department: Optional[str] = Field(None, description="Tổ bộ môn")
    subject: str = Field(..., description="Môn học/Hoạt động giáo dục")
    grade: int = Field(..., ge=1, le=12, description="Lớp")
    lesson_title: str = Field(..., description="Tên bài dạy")
    periods: int = Field(..., ge=1, description="Số tiết thực hiện")

# MỤC TIÊU
class K12Objectives(BaseModel):
    knowledge: List[str] = Field(..., min_items=1, description="Mục tiêu kiến thức")
    competencies: List[str] = Field(..., min_items=1, description="Mục tiêu năng lực")
    qualities: List[str] = Field(..., min_items=1, description="Mục tiêu phẩm chất")

# THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU
class K12Resources(BaseModel):
    teacher: List[str] = Field(..., min_items=2, description="Học liệu, thiết bị dạy học giáo viên cần chuẩn bị (VD: bảng, máy chiếu, sách giáo khoa, giáo án, video...)")
    student: List[str] = Field(..., min_items=1, description="Học liệu, thiết bị học sinh cần chuẩn bị (VD: vở ghi, kiến thức nền, máy tính cá nhân...)")

# TIẾN TRÌNH DẠY HỌC
class ActivityGeneral(BaseModel):
    objective: str = Field(..., description="a. Mục tiêu")
    content: str = Field(..., description="b. Nội dung")
    expected_products: str = Field(..., description="c. Sản phẩm")

class Execution(BaseModel):
    execute_description: List[str] = Field(..., min_items=2, description="Mô tả cách tổ chức ngắn gọn, hoạt động của giáo viên và học sinh")
    teacher_prompts: Optional[List[str]] = Field(None, description="Danh sách câu hỏi gợi mở của GV (nếu có)")

class StepExecute(BaseModel):
    activity: List[str] = Field(..., min_items=2, description="Các hoạt động của giáo viên và học sinh ở bước thực hiện")
    expected_products: List[str] = Field(..., min_items=2, description="Các sản phẩm dự kiến tương ứng với các hoạt dộng ở bước thực hiện")

class ActivityStep(BaseModel):
    """Các bước tổ chức thực hiện của một hoạt động trong phần Hình thành kiến thức."""
    assign_task: StepExecute = Field(..., description="Bước 1: Chuyển giao nhiệm vụ")
    do_task: StepExecute = Field(..., description="Bước 2: Thực hiện nhiệm vụ")
    discuss_task: StepExecute = Field(..., description="Bước 3: Báo cáo - thảo luận")
    conclusion_task: StepExecute = Field(..., description="Bước 4: Kết luận - nhận định")

class SubActivity(BaseModel):
    title: str = Field(..., description="Tên hoạt động")
    general_info: ActivityGeneral = Field(..., description="Thông tin bao gồm mục tiêu, nội dung và sản phẩm của hoạt động")
    step: ActivityStep = Field(..., description="Các bước tổ chức thực hiện")

class GeneralActivityModel(BaseModel):
    general_info: ActivityGeneral = Field(..., description="Thông tin bao gồm mục tiêu, nội dung và sản phẩm hoạt động")
    execution: Execution = Field(..., description="Tổ chức hoạt động của GV và HS")

class FormingActivityModel(BaseModel):
    sub_activities: List[SubActivity] = Field(..., min_items=1, description="Danh sách các hoạt động nhỏ")

# GIÁO ÁN
class K12(BaseModel):
    meta: K12Meta = Field(..., description="Thông tin chung")
    objectives: K12Objectives = Field(..., description="Mục tiêu bài học")
    resources: K12Resources = Field(..., description="Thiết bị và học liệu")
    start_activity: GeneralActivityModel = Field(..., description="Hoạt động mở đầu")
    knowledge_formation_activity: FormingActivityModel = Field(..., description="Hoạt động hình thành kiến thức")
    practice_activity: GeneralActivityModel = Field(..., description="Hoạt động luyện tập")
    extend_activity: GeneralActivityModel = Field(..., description="Hoạt động vận dụng và mở rộng")