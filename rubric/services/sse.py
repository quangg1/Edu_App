from typing import Any
import json
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