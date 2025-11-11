import json

def json_try_load(text: str):
    """
    Safely try to parse a full JSON string. Return dict on success, else None.
    Args:
        text (str): Input text to parse as JSON.
    Returns:
        dict or None: Parsed JSON object or None if parsing fails.
    """
    try:
        return json.loads(text)
    except Exception:
        return None

def json_extract_braced(text: str):
    """
    Extract the first top-level JSON object using a brace-balance scan.
    This is robust for streamed text where extra tokens can appear before/after the JSON.
    Args:
        text (str): Input text potentially containing JSON.
    Returns:
        dict or None: Parsed JSON object or None if extraction/parsing fails.
    """
    start = text.find("{")
    if start == -1:
        return None
    depth = 0
    for i, ch in enumerate(text[start:], start=start):
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                candidate = text[start:i+1]
                try:
                    return json.loads(candidate)
                except Exception:
                    return None
    return None

RUBRIC_KEYS_ORDER = [
    "rubric_title",
    "subject",
    "grade_level",
    "assessment_type",
    "criteria",
    "scale",
]

def stream_emit_known_keys(obj: dict, already_sent: set, yield_fn):
    """
    Emit known rubric keys in a deterministic order via yield_fn(event_name, data).
    Skip keys that were already emitted (for idempotency).
    Args:
        obj (dict): Parsed JSON object containing rubric data.
        already_sent (set): Set of keys already emitted.
        yield_fn (function): Function to call with (event_name, data).
    Yields:
    """
    for k in RUBRIC_KEYS_ORDER:
        if k in obj and k not in already_sent:
            yield_fn(k, obj[k])
            already_sent.add(k)
    # Emit any remaining keys (if the model returns extras)
    for k, v in obj.items():
        if k not in already_sent:
            yield_fn(k, v)
            already_sent.add(k)
