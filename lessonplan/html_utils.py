import html
from typing import Dict, List, Optional, Literal

ALIGN_MAP_HTML = {
    "left": "left",
    "center": "center",
    "right": "right",
    "justify": "justify"
}

def _render_table_rows(step_order, steps: Dict[str, Dict[str, List[str]]]) -> str:
    rows = []
    for key, title in step_order:
        block = steps.get(key)
        if not block:
            continue
        activities, products = [], []
        for act_field in ("activity", "teacher_activity"):
            value = block.get(act_field)
            if value:
                activities.extend(value if isinstance(value, list) else [str(value)])
        for prod_field in ("expected_products", "student_activity"):
            value = block.get(prod_field)
            if value:
                products.extend(value if isinstance(value, list) else [str(value)])
                
        act_html = "<br>".join(html.escape(a) for a in activities)
        prod_html = "<br>".join(html.escape(p) for p in products)
        rows.append(
            f'<tr>'
            f'<td style="width:45%; vertical-align: top; padding: 8px; border: 1px solid #000;">'
            f'<strong>{html.escape(title)}</strong><br>{act_html}</td>'
            f'<td style="width:45%; vertical-align: top; padding: 8px; border: 1px solid #000;">'
            f'{prod_html}</td>'
            f'</tr>'
        )
    return "\n".join(rows)

def _render_list(items: List[str]) -> str:
    lis = "\n".join(f"<li>{html.escape(str(i))}</li>" for i in items)
    return f"<ul>\n{lis}\n</ul>"

def activity_to_html(activity: Dict) -> str:
    parts: List[str] = []
    gi = activity.get("general_info") or {}
    if gi:
        if gi.get("objective"):
            parts.append(f'<p><strong>Mục tiêu:</strong> {html.escape(gi["objective"])}</p>')
        if gi.get("content"):
            parts.append(f'<p><strong>Nội dung:</strong> {html.escape(gi["content"])}</p>')
        if gi.get("expected_products"):
            parts.append(f'<p><strong>Sản phẩm mong đợi:</strong> {html.escape(gi["expected_products"])}</p>')

    exec_block = activity.get("execution") or {}
    if exec_block.get("execute_description"):
        parts.append('<p><strong>Tiến trình thực hiện</strong></p>')
        parts.append(_render_list(exec_block["execute_description"]))

    if exec_block.get("teacher_prompts"):
        parts.append('<p><strong>Câu hỏi gợi mở</strong></p>')
        parts.append(_render_list(exec_block["teacher_prompts"]))

    parts.append('</div>')
    return "\n".join(parts)

def sub_activity_to_html(sub_act: Dict) -> str:
    parts: List[str] = []
    title = sub_act.get("title", "")
    parts.append(f'<h4>{html.escape(title)}</h4>')
    general_info = sub_act.get("general_info") or {}
    if general_info:
        if general_info.get("objective"):
            parts.append(f'<p><strong>Mục tiêu:</strong> {html.escape(general_info["objective"])}</p>')
        if general_info.get("content"):
            parts.append(f'<p><strong>Nội dung:</strong> {html.escape(general_info["content"])}</p>')
        if general_info.get("expected_products"):
            parts.append(f'<p><strong>Sản phẩm mong đợi:</strong> {html.escape(general_info["expected_products"])}</p>')
    steps = sub_act.get("step", {})
    step_order = [
        ("assign_task",   "Bước 1: Chuyển giao nhiệm vụ"),
        ("do_task",       "Bước 2: Thực hiện nhiệm vụ"),
        ("discuss_task",  "Bước 3: Báo cáo, thảo luận"),
        ("conclusion_task","Bước 4: Kết luận, nhận định"),
    ]
    if steps:
        rows = _render_table_rows(step_order, steps)
        table_html = (
            "<table "
            "style=\"width:100%; border-collapse: collapse; border: 1px solid #000;\">\n"
            "<thead>"
            "<tr>"
            "<th style=\"border: 1px solid #000; padding: 8px; width:45%;\">Hoạt động của GV và HS</th>"
            "<th style=\"border: 1px solid #000; padding: 8px; width:45%;\">Sản phẩm dự kiến</th>"
            "</tr>"
            "</thead>\n"
            f"<tbody>\n{rows}\n</tbody></table>"
        )
        parts.append(table_html)
    return "\n".join(parts)

def main_activity_to_html(data: Dict) -> str:
    sub_activities = data.get("sub_activities", [])
    html_parts: List[str] = []
    for idx, sub_act in enumerate(sub_activities, 1):
        html_parts.append(sub_activity_to_html(sub_act))
    return "\n".join(html_parts)

def convert_k12_objectives(objectives):
    parts: List[str] = []
    knowledge_list = objectives.get("knowledge", [])
    competencies_list = objectives.get("competencies", [])
    qualities_list = objectives.get("qualities", [])

    if knowledge_list:
        parts.append('<p><strong>Kiến thức</strong></p>')
        parts.append(_render_list(knowledge_list))

    if competencies_list:
        parts.append('<p><strong>Năng lực</strong></p>')
        parts.append(_render_list(competencies_list))

    if qualities_list:
        parts.append('<p><strong>Phẩm chất</strong></p>')
        parts.append(_render_list(qualities_list))

    return parts

def convert_k12_resources(resources):
    parts: List[str] = []
    teacher_list = resources.get("teacher", [])
    student_list = resources.get("student", [])

    if teacher_list:
        parts.append('<p><strong>Giáo viên</strong></p>')
        parts.append(_render_list(teacher_list))

    if student_list:
        parts.append('<p><strong>Học sinh</strong></p>')
        parts.append(_render_list(student_list))

    return parts

def convert_k12_activities(activities, title):
    html_parts = []
    
    html_parts.append(f'<h4>{title}</h4>')

    if title == '2. Hình thành kiến thức':
        html_parts.append(main_activity_to_html(activities))
    else:
        html_parts.append(activity_to_html(activities))

    return html_parts

def convert_kindergarten_objectives(objectives):
    parts: List[str] = []
    steam = objectives.get("steam", {})
    skills = objectives.get("skills", [])
    attitude = objectives.get("attitude", [])

    science = steam.get("science", [])
    technology = steam.get("technology", [])
    engineering = steam.get("engineering", [])
    mathematics = steam.get("mathematics", [])

    if steam:
        parts.append('<p><strong>1. Các thành tố đạt được</strong></p>')
        if science:
            parts.append('<p><strong>Khoa học</strong></p>')
            parts.append(_render_list(science))
        if technology:
            parts.append('<p><strong>Công nghệ</strong></p>')
            parts.append(_render_list(technology))
        if engineering:
            parts.append('<p><strong>Kỹ thuật</strong></p>')
            parts.append(_render_list(engineering))
        if mathematics:
            parts.append('<p><strong>Toán học</strong></p>')
            parts.append(_render_list(mathematics))

    if skills:
        parts.append('<p><strong>2. Kỹ năng</strong></p>')
        parts.append(_render_list(skills))

    if attitude:
        parts.append('<p><strong>3. Phẩm chất</strong></p>')
        parts.append(_render_list(attitude))

    return parts

def convert_kindergarten_resources(resources):
    parts: List[str] = []
    place = resources.get("place", "")
    teacher_list = resources.get("teacher", [])
    student_list = resources.get("student", [])

    if place:
        parts.append(f'<p><strong>Địa điểm:</strong> {html.escape(str(place))}</p>')

    if teacher_list:
        parts.append('<p><strong>Chuẩn bị của giáo viên</strong></p>')
        parts.append(_render_list(teacher_list))

    if student_list:
        parts.append('<p><strong>Chuẩn bị của trẻ</strong></p>')
        parts.append(_render_list(student_list))

    return parts

def convert_kindergarten_activities(activities):
    parts: List[str] = []
    step_order = [
        ("engagement",   "Bước 1: Gắn kết"),
        ("exploration",       "Bước 2: Khám phá"),
        ("explanation",  "Bước 3: Giải thích và chia sẻ"),
        ("elaborate","Bước 4: Áp dụng"),
        ("evaluate","Bước 5: Đánh giá"),
    ]
    if activities:
        rows = _render_table_rows(step_order, activities)
        table_html = (
            "<table "
            "style=\"width:100%; border-collapse: collapse; border: 1px solid #000;\">\n"
            "<thead>"
            "<tr>"
            "<th style=\"border: 1px solid #000; padding: 8px; width:45%;\">Hoạt động của giáo viên</th>"
            "<th style=\"border: 1px solid #000; padding: 8px; width:45%;\">Hoạt động của trẻ</th>"
            "</tr>"
            "</thead>\n"
            f"<tbody>\n{rows}\n</tbody></table>"
        )
        parts.append(table_html)

    return parts

def _style_span(text: str,
                bold: bool = False,
                italic: bool = False,
                underline: bool = False,
                font_size: Optional[int] = None,
                font_name: str = "Times New Roman") -> str:
    """
    Trả về chuỗi HTML cho 1 run.
    - Ưu tiên thẻ ngữ nghĩa <strong>, <em>, <u>.
    - Font family/size đặt ở style của <span>.
    """
    t = html.escape(text or "")
    style_parts = []
    if font_name:
        style_parts.append(f"font-family:'{html.escape(font_name)}';")
    if font_size:
        style_parts.append(f"font-size:{int(font_size)}pt;")

    inner = t
    if underline:
        inner = f"<u>{inner}</u>"
    if italic:
        inner = f"<em>{inner}</em>"
    if bold:
        inner = f"<strong>{inner}</strong>"

    style_str = f' style="{" ".join(style_parts)}"' if style_parts else ""
    return f"<span{style_str}>{inner}</span>"

def _render_runs(text_runs: List[Dict],
                 default_font_size: Optional[int] = 12,
                 font_name: str = "Times New Roman") -> str:
    """
    text_runs: List[ {text, bold, italic, underline} ]
    """
    parts = []
    for item in text_runs:
        parts.append(
            _style_span(
                text=item.get("text", ""),
                bold=item.get("bold", False),
                italic=item.get("italic", False),
                underline=item.get("underline", False),
                font_size=default_font_size,
                font_name=font_name
            )
        )
    return "".join(parts)

def html_indent(inner_html: str, left_in: float = 0.25) -> str:
    """
    Tương ứng indent(p, left_in). Dùng đơn vị inch để nhất quán.
    """
    return f'<div style="margin-left:{left_in}in">{inner_html}</div>'

def html_add_para(text: List[Dict],
                  font_size: int = 12,
                  align: Optional[str] = None,
                  space_before: Optional[float] = None,
                  space_after: Optional[float] = None,
                  font_name: str = "Times New Roman") -> str:
    """
    Tương ứng add_para(...) nhưng trả về 1 thẻ <p>.
    - text: list run dicts {text,bold,italic,underline}
    - align: 'left'|'center'|'right'|'justify'
    - space_before/after: pt
    - style: gán vào class (nếu muốn match CSS ngoài)
    """
    css = []
    if align and align in ALIGN_MAP_HTML:
        css.append(f"text-align:{ALIGN_MAP_HTML[align]};")
    if space_before:
        css.append(f"margin-top:{float(space_before)}pt;")
    if space_after:
        css.append(f"margin-bottom:{float(space_after)}pt;")

    inner = _render_runs(text, default_font_size=font_size, font_name=font_name)
    return f"<p>{inner}</p>"

def html_add_items(items: List[List[Dict]],
                   bullet: Optional[str] = None,
                   font_size: int = 12,
                   font_name: str = "Times New Roman") -> str:
    """
    Tương ứng add_items(...).
    - Nếu có bullet -> xuất <ul><li>...</li></ul>.
    - Nếu không có bullet -> mỗi item là 1 <p>.
    items: List[ List[run_dict] ], mỗi phần tử là 1 dòng/item.
    """
    if bullet:
        lis = []
        for it in items:
            inner = _render_runs(it, default_font_size=font_size, font_name=font_name)
            lis.append(f"<li>{inner}</li>")
        return f"<ul>{''.join(lis)}</ul>"
    else:
        paras = []
        for it in items:
            inner = _render_runs(it, default_font_size=font_size, font_name=font_name)
            paras.append(f"<p style=\"margin-top:0pt;\">{inner}</p>")
        return "".join(paras)

def html_render_cell(value: List[Dict],
                     font_size: Optional[int] = None,
                     font_name: str = "Times New Roman") -> str:
    """
    Tương ứng render_cell(...), NHƯNG trả về HTML cho nội dung 1 ô.
    - value: List[line_dict], mỗi line_dict có thể có:
        {
          "align": "left|center|right|justify",
          "space_before": <pt>,
          "space_after": <pt>,
          "text": [run_dict, ...]
        }
    - Mỗi line xuất 1 <div>. Line cuối nếu không có space_after -> margin-bottom:4pt (như code gốc).
    """
    if not value:
        return ""

    pieces = []
    for i, line in enumerate(value):
        align = line.get("align", "left")
        sb = line.get("space_before", None)
        sa = line.get("space_after", None)
        css = []
        css.append(f"text-align:{ALIGN_MAP_HTML.get(align, 'left')};")
        if sb:
            css.append(f"margin-top:{float(sb)}pt;")
        if sa:
            css.append(f"margin-bottom:{float(sa)}pt;")
        elif i == len(value) - 1:
            css.append("margin-bottom:4pt;")

        runs = line.get("text", []) or []
        inner = _render_runs(runs, default_font_size=font_size, font_name=font_name)
        pieces.append(f'<div style="{" ".join(css)}">{inner}</div>')
    return "".join(pieces)

def html_add_table(headers: List[Dict],
                   rows: List[List[List[Dict]]],
                   font_size: Optional[int] = None,
                   font_name: str = "Times New Roman") -> str:
    """
    Tương ứng add_table(...), trả về <table> hoàn chỉnh.
    - headers: List[ {text, bold, italic, underline} ]
    - rows: List[ row ], mỗi row là List[cell_value],
            cell_value là List[line_dict] như html_render_cell().
    - col_widths: List[float] chiều rộng cột theo inch (tùy chọn).
    - font_size/font_name áp cho runs bên trong.
    """
    if not headers:
        return "<!-- Cần có headers hoặc ít nhất một hàng dữ liệu. -->"

    ths = []
    for h in headers:
        inner = _render_runs(
            [h],
            default_font_size=font_size,
            font_name=font_name
        ) if "text" in h else _render_runs(
            [dict(text=h.get("text",""),
                  bold=h.get("bold", False),
                  italic=h.get("italic", False),
                  underline=h.get("underline", False))],
            default_font_size=font_size,
            font_name=font_name
        )
        ths.append(f'<th style="text-align:center; padding:4pt 6pt;">{inner}</th>')
    thead = f"<thead><tr>{''.join(ths)}</tr></thead>"

    trs = []
    for row in rows:
        tds = []
        for ci, cell_val in enumerate(row):
            cell_inner = html_render_cell(cell_val, font_size=font_size, font_name=font_name)
            tds.append(f'<td style="vertical-align:top; padding:4pt 6pt;">{cell_inner}</td>')
        trs.append(f"<tr>{''.join(tds)}</tr>")
    tbody = f"<tbody>{''.join(trs)}</tbody>"

    table_style = (
        "border-collapse:collapse; border:1px solid #000;"
        "table-layout:fixed; width:auto;"
    )
    cell_border_css = (
        "<style>"
        "table.docx-grid th, table.docx-grid td{border:1px solid #000;}"
        "</style>"
    )

    return (
        f"{cell_border_css}"
        f'<table class="docx-grid" style="{table_style}">'
        f"{thead}{tbody}"
        f"</table>"
    )

def gen_html(args: dict, tool: Literal["add_para", "add_items", "add_table"]):
    default_font_name = "Times New Roman"
    default_font_size = 12
    html_parts = None
    match tool:
        case "add_para":
            text = args.get("text", [])
            font_size = args.get("font_size", default_font_size) 
            align = args.get("align", "left")
            space_before = args.get("space_before", None)
            space_after = args.get("space_after", None)
            html_parts = html_add_para(text, font_size, align, space_before, space_after, default_font_name)
        case "add_items":
            items = args.get("items", [])
            bullet = args.get("bullet", None)
            html_parts = html_add_items(items, bullet, default_font_size, default_font_name)
        case "add_table":
            headers = args.get("headers", [])
            rows = args.get("rows", [])
            font_size = args.get("font_size", default_font_size)
            html_parts = html_add_table(headers, rows, default_font_size, default_font_name)

    return html_parts