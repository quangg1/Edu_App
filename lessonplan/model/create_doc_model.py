from __future__ import annotations
from typing import List, Literal, Union, Annotated, Optional
from pydantic import BaseModel, Field

tools = Literal[
    "add_para",
    "add_items",
    "add_table"
]

text_align = Literal[
    "left",
    "right",
    "center",
    "justify"
]

class Text(BaseModel):
    text: str = Field(..., description="Nội dung một dòng")
    bold: Optional[bool] = Field(False, description="In đậm")
    italic: Optional[bool] = Field(False, description="In nghiêng")
    underline: Optional[bool] = Field(False, description="Gạch dưới")

class Para(BaseModel):
    text: List[Text] = Field(..., min_items=1, description="Nội dung trong cùng 1 đoạn văn (không xuống dòng)")
    align: Optional[text_align] = Field("left", description="Căn lề dòng")
    space_before: Optional[float] = Field(None, ge=0, description="Khoảng cách phía trước đoạn văn, đơn vị Pt (mặc định là 4)")
    space_after: Optional[float] = Field(None, ge=0, description="Khoảng cách phía sau đoạn văn, đơn vị Pt (mặc định là 0)")

class DocMeta(BaseModel):
    font_name: str = Field("Times New Roman", description="Font chữ mặc định")
    font_size: int = Field(12, description="Cỡ chữ mặc định")

class AddParaArgs(BaseModel):
    text: List[Text] = Field(..., min_items=1, description="Nội dung trong cùng 1 đoạn văn (không xuống dòng)")
    font_size: Optional[int] = Field(None, ge=8, le=48, description="Cỡ chữ của đoạn văn (nếu có thay đổi so với mặc định)")
    align: Optional[text_align] = Field("left", description="Căn lề đoạn văn")
    space_before: Optional[float] = Field(None, ge=0, description="Khoảng cách phía trước đoạn văn, đơn vị Pt (mặc định là 4)")
    space_after: Optional[float] = Field(None, ge=0, description="Khoảng cách phía sau đoạn văn, đơn vị Pt (mặc định là 0)")

class AddItemsArgs(BaseModel):
    items: List[List[Text]] = Field(..., min_items=1, description="Danh sách các ý gạch đầu dòng theo thứ tự, format mặc định")
    bullet: Optional[str] = Field(None,  description="Ký hiệu đầu dòng hiển thị trước nội dung (ví dụ: '-', '+', '•'), nếu có")

class AddTableArgs(BaseModel):
    headers: List[Text] = Field(..., min_items=1, description="Tiêu đề cột")
    rows: List[List[List[Para]]] = Field(..., description="Danh sách hàng; mỗi hàng có số cell = số headers")
    font_size: Optional[int] = Field(None, ge=8, le=48, description="Cỡ chữ của văn bản trong toàn bảng (nếu có thay đổi so với mặc định)")
    col_widths: Optional[List[float]] = Field(None, ge=0.3, le=4.5, description="Chiều rộng của các cột trong bảng, đơn vị Inches, tổng chiều rộng <= 6.5 (mặc định là autofit)")

class StepBase(BaseModel):
    tool: Literal["add_para", "add_items", "add_table"]

class AddParaStep(StepBase):
    tool: Literal["add_para"] = "add_para"
    args: AddParaArgs

class AddItemsStep(StepBase):
    tool: Literal["add_items"] = "add_items"
    args: AddItemsArgs

class AddTableStep(StepBase):
    tool: Literal["add_table"] = "add_table"
    args: AddTableArgs

DocStep = Annotated[Union[AddParaStep, AddItemsStep, AddTableStep], Field(discriminator="tool")]

class DocCreate(BaseModel):
    meta: DocMeta = Field(..., description="Thông tin định dạng mặc định")
    step: List[DocStep] = Field(..., min_items=1, description="Danh sách các bước dùng tool để sinh nội dung docx")