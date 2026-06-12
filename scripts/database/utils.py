from __future__ import annotations

import json
import math
import re
from pathlib import Path
from typing import Any, Callable


COLOR_RE = re.compile(r"</?color(?:=[^>]*)?>", re.IGNORECASE)


def bool_int(value: Any) -> int:
    return 1 if value else 0


def json_list(value: Any) -> str:
    return json.dumps(value if isinstance(value, list) else [], ensure_ascii=False, separators=(",", ":"))


def clean_text(value: Any) -> str | None:
    if value is None:
        return None
    text = COLOR_RE.sub("", str(value)).strip()
    return text or None


def js_number(value: Any) -> float:
    if value is None:
        return 0
    if isinstance(value, bool):
        return 1 if value else 0
    if isinstance(value, (int, float)):
        return value
    if isinstance(value, str):
        if value == "":
            return 0
        try:
            return float(value)
        except ValueError:
            return math.nan
    try:
        return float(value)
    except (TypeError, ValueError):
        return math.nan


def js_int(value: Any) -> int:
    number = js_number(value)
    if not math.isfinite(number):
        return 0
    return int(number)


def is_finite_number(value: Any) -> bool:
    return math.isfinite(js_number(value))


def number_or_none(value: Any) -> int | float | None:
    number = js_number(value)
    return number if math.isfinite(number) else None


def round_number(value: Any, digits: int = 2) -> float:
    factor = 10 ** digits
    return round(js_number(value) * factor) / factor


def table_by_name(tables: list[dict[str, Any]], name: str) -> list[dict[str, Any]]:
    for table in tables:
        if table.get("meta") == name:
            return table.get("rows") or []
    raise RuntimeError(f"原始数据库缺少表：{name}")


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def named_rows(
    type_name: str,
    rows: list[dict[str, Any]],
    id_getter: Callable[[dict[str, Any], int], Any],
    label_getter: Callable[[dict[str, Any], int], Any],
) -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = []
    for index, row in enumerate(rows):
        row_id = js_number(id_getter(row, index))
        label = label_getter(row, index)
        if math.isfinite(row_id) and label not in (None, ""):
            result.append({"type": type_name, "id": int(row_id), "label": label})
    return sorted(result, key=lambda item: item["id"])


def natural_key(value: Any) -> list[Any]:
    parts = re.split(r"(\d+)", str(value))
    return [int(part) if part.isdigit() else part for part in parts]
