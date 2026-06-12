from __future__ import annotations

import re
from pathlib import Path
from typing import Any

from ..bgdatabase import derive_chain_enums
from ..utils import js_number, named_rows


def parse_enum_file(path: Path) -> dict[str, Any] | None:
    text = path.read_text(encoding="utf-8")
    if "System.Enum" not in text:
        return None

    type_match = re.search(r"^Type:\s*([^:\r\n]+):", text, re.MULTILINE)
    if not type_match:
        return None

    entries: dict[str, str] = {}
    lines = re.split(r"\r?\n", text)
    for index, line in enumerate(lines):
        field_match = re.match(r"^\s*Static Field:\s*(.+?)\s*$", line)
        if not field_match:
            continue
        field = field_match.group(1)
        if field == "value__":
            continue

        for scan in range(index + 1, min(index + 8, len(lines))):
            value_match = re.match(r"^\s*Default Value:\s*(-?\d+)\s*$", lines[scan])
            if not value_match:
                continue
            entries[value_match.group(1)] = field
            break

    if not entries:
        return None
    return {
        "type": type_match.group(1),
        "values": dict(sorted(entries.items(), key=lambda item: int(item[0]))),
    }


def build_enum_types(
    *,
    enum_source: Path,
    area_rows: list[dict[str, Any]],
    chain_rows: list[dict[str, Any]],
) -> dict[str, dict[Any, Any]]:
    enum_types: dict[str, dict[Any, Any]] = {}
    if enum_source.exists():
        for file in sorted(enum_source.glob("*_metadata.txt")):
            parsed = parse_enum_file(file)
            if parsed:
                enum_types[parsed["type"]] = parsed["values"]

    enum_types.update(derive_chain_enums(chain_rows).get("enumTypes") or {})
    enum_types["Area"] = dict(sorted(
        (
            (str(row.get("index")), row.get("chnname"))
            for row in area_rows
            if row.get("index") is not None and row.get("chnname")
        ),
        key=lambda item: int(item[0]),
    ))
    return enum_types


def enum_rows(enum_types: dict[str, dict[Any, Any]]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for type_name, values in enum_types.items():
        for row_id, label in (values or {}).items():
            rows.append({"type": type_name, "id": int(js_number(row_id)), "label": label})
    return rows


class EnumBuilder:
    def __init__(self, ctx):
        self.ctx = ctx

    def rows(self) -> dict[str, list[dict[str, Any]]]:
        display_rows = [
            *named_rows("Character", self.ctx.npc_rows, lambda row, index: row.get("index"), lambda row, index: npc_name(row)),
            *named_rows("MartialArt", self.ctx.wugong_rows, lambda row, index: row.get("index", index), lambda row, index: row.get("chnname")),
            *named_rows("Item", self.ctx.item_rows, lambda row, index: row.get("index"), lambda row, index: row.get("chnname") or row.get("name")),
            *self.ctx.attack_area_enums,
        ]
        return {"enums": [*enum_rows(self.ctx.enum_types), *display_rows]}


def npc_name(row: dict[str, Any]) -> str:
    return f"{row.get('xing') or ''}{row.get('ming') or ''}" or f"NPC {row.get('index')}"
