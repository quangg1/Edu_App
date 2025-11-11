from google import genai
from google.genai.types import Tool, GenerateContentConfig, Part, ToolConfig, FunctionCallingConfig, AutomaticFunctionCallingConfig

import mimetypes
import json, os
from typing import List, Optional
from pydantic import ValidationError
from dotenv import load_dotenv

load_dotenv()
gemini_api_key = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=gemini_api_key)

def get_mime_type(file):
    mime_type, _ = mimetypes.guess_type(file.filename)
    return mime_type or "application/octet-stream"

def generate_lessonplan_template(contents, system_prompt, response_format, model="gemini-2.5-flash"):
    print("# Đang tạo giáo án...")
    response = client.models.generate_content(
        model=model,
        contents=contents,
        config=GenerateContentConfig(
            system_instruction=system_prompt,
            response_mime_type="application/json",
            response_json_schema=response_format
        )
    )

    return response.text

def generate_lessonplan_custom(contents, system_prompt, response_format, model="gemini-2.5-flash"):
    add_para_function = {
        "name": "add_para",
        "description": "Thêm một đoạn văn bản vào tài liệu Word.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "text": {
                    "type": "ARRAY",  # Line[]
                    "description": "Danh sách nội dung văn bản trong cùng một đoạn văn.",
                    "items": {
                        "type": "OBJECT",
                        "properties": {
                            "text": {
                                "type": "STRING",
                                "description": "Nội dung văn bản trong cùng một đoạn văn."
                            },
                            "bold": {
                                "type": "BOOLEAN",
                                "description": "In đậm dòng.",
                                "default": False
                            },
                            "italic": {
                                "type": "BOOLEAN",
                                "description": "In nghiêng dòng.",
                                "default": False
                            },
                            "underline": {
                                "type": "BOOLEAN",
                                "description": "Gạch dưới dòng.",
                                "default": False
                            }
                        }
                    }
                },
                "font_size": {
                    "type": "NUMBER",
                    "description": "Cỡ chữ (pt).",
                    "default": 12
                },
                "align": {
                    "type": "STRING",
                    "enum": ["left", "center", "right", "justify"],
                    "description": "Căn lề đoạn văn."
                },
                "space_before": {
                    "type": "NUMBER",
                    "description": "Khoảng cách phía trước dòng văn bản, đơn vị Pt."
                },
                "space_after": {
                    "type": "NUMBER",
                    "description": "Khoảng cách phía sau dòng văn bản, đơn vị Pt."
                },
                "style": {
                    "type": "STRING",
                    "description": "Tên paragraph style (nếu có)."
                }
            },
            "required": ["text"]
        }
    }

    add_items_function = {
        "name": "add_items",
        "description": "Thêm danh sách các ý vào tài liệu Word.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "items": {
                    "type": "ARRAY",
                    "items": {
                        "type": "ARRAY",  # Line[]
                        "items": {
                            "type": "OBJECT",                
                            "description": "Các mục trong danh sách.",
                            "properties": {
                                "text": {
                                    "type": "STRING",
                                    "description": "Nội dung văn bản trong cùng một đoạn văn."
                                },
                                "bold": {
                                    "type": "BOOLEAN",
                                    "description": "In đậm dòng.",
                                    "default": False
                                },
                                "italic": {
                                    "type": "BOOLEAN",
                                    "description": "In nghiêng dòng.",
                                    "default": False
                                },
                                "underline": {
                                    "type": "BOOLEAN",
                                    "description": "Gạch dưới dòng.",
                                    "default": False
                                }
                            }
                        }
                    }
                },
                "bullet": {
                    "type": "STRING",
                    "description": "Ký hiệu đầu dòng hiển thị trước nội dung (ví dụ: '-', '+', '•'), nếu có."
                }
            },
            "required": ["items"]
        }
    }

    add_table_function = {
        "name": "add_table",
        "description": "Thêm bảng có tiêu đề và nhiều hàng. Mỗi ô có thể có nhiều dòng (line) với định dạng riêng.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "headers": {
                    "type": "ARRAY",
                    "description": "Danh sách tiêu đề cột.",
                    "items": {
                        "type": "OBJECT",
                        "properties": {
                            "text": {
                                "type": "STRING",
                                "description": "Nội dung tiêu đề cột."
                            },
                            "bold": {
                                "type": "BOOLEAN",
                                "description": "In đậm dòng.",
                                "default": False
                            },
                            "italic": {
                                "type": "BOOLEAN",
                                "description": "In nghiêng dòng.",
                                "default": False
                            },
                            "underline": {
                                "type": "BOOLEAN",
                                "description": "Gạch dưới dòng.",
                                "default": False
                            }
                        }
                    }
                },
                "rows": {
                    "type": "ARRAY",
                    "description": "Danh sách hàng (Row). Mỗi Row có số ô bằng số headers.",
                    "items": {
                        "type": "ARRAY",   # Cell[]
                        "items": {
                            "type": "ARRAY",  # Line[]
                            "items": {
                                "type": "OBJECT",
                                "properties": {
                                    "text": {
                                        "type": "ARRAY",  # Line[]
                                        "description": "Danh sách nội dung văn bản trong cùng một đoạn văn của ô.",
                                        "items": {
                                            "type": "OBJECT",
                                            "properties": {
                                                "text": {
                                                    "type": "STRING",
                                                    "description": "Nội dung văn bản trong cùng một đoạn văn của ô."
                                                },
                                                "bold": {
                                                    "type": "BOOLEAN",
                                                    "description": "In đậm dòng.",
                                                    "default": False
                                                },
                                                "italic": {
                                                    "type": "BOOLEAN",
                                                    "description": "In nghiêng dòng.",
                                                    "default": False
                                                },
                                                "underline": {
                                                    "type": "BOOLEAN",
                                                    "description": "Gạch dưới dòng.",
                                                    "default": False
                                                }
                                            }
                                        }
                                    },
                                    "align": {
                                        "type": "STRING",
                                        "enum": ["left", "center", "right", "justify"],
                                        "description": "Căn lề dòng."
                                    },
                                    "space_before": {
                                        "type": "NUMBER",
                                        "description": "Khoảng cách phía trước dòng văn bản, đơn vị Pt."
                                    },
                                    "space_after": {
                                        "type": "NUMBER",
                                        "description": "Khoảng cách phía sau dòng văn bản, đơn vị Pt."
                                    }
                                },
                                "required": ["text"]
                            }
                        }
                    }
                },
                "font_size": {
                    "type": "NUMBER",
                    "description": "Cỡ chữ trong bảng (pt).",
                    "default": 12
                },
                "col_widths": {
                    "type": "ARRAY",
                    "items": {"type": "NUMBER"},
                    "description": "Chiều rộng của các cột trong bảng, đơn vị Inches."
                }
            },
            "required": ["headers", "rows"]
        }
    }

    TOOLS = [{
        "function_declarations": [add_para_function, add_items_function, add_table_function]
    }]
    
    print("# Đang tạo giáo án...")
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=contents,
        config=GenerateContentConfig(
            response_mime_type="application/json",
            response_json_schema=response_format,
            system_instruction=system_prompt,
            tools=TOOLS,
            automatic_function_calling=AutomaticFunctionCallingConfig(
                disable=True
            ),
            tool_config=ToolConfig(
                function_calling_config=FunctionCallingConfig(mode='NONE')
            ),
        ),
    )

    return response.text