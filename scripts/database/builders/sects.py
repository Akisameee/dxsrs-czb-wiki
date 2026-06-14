from __future__ import annotations

import re
from typing import Any

from ..utils import js_number


TRAILING_LEVEL_RE = re.compile(r"\d+$")


def legacy_sect_name(value: Any) -> str | None:
    if not value:
        return None
    name = TRAILING_LEVEL_RE.sub("", str(value)).strip()
    return name or None


def legacy_sect_id_by_name(enum_types: dict[str, dict[Any, Any]]) -> dict[str, int]:
    return {
        str(label): int(js_number(row_id))
        for row_id, label in (enum_types.get("MenPai") or {}).items()
        if label not in (None, "")
    }


def sect_records(
    chain_rows: list[dict[str, Any]],
    enum_types: dict[str, dict[Any, Any]],
) -> dict[int, dict[str, Any]]:
    old_id_by_name = legacy_sect_id_by_name(enum_types)
    by_id: dict[int, dict[str, Any]] = {}
    for row in chain_rows:
        if int(js_number(row.get("fengge"))) != 0:
            continue
        sect_id = int(js_number(row.get("menpai")))
        if sect_id == 15 or sect_id in by_id:
            continue
        old_name = legacy_sect_name(row.get("name"))
        by_id[sect_id] = {
            "id": sect_id,
            "name": row.get("chnname") or None,
            "legacy_id": old_id_by_name.get(old_name) if old_name else None,
            "legacy_name": old_name,
        }
    return by_id


def sect_id_by_legacy_id(
    chain_rows: list[dict[str, Any]],
    enum_types: dict[str, dict[Any, Any]],
) -> dict[int, int]:
    return {
        int(record["legacy_id"]): sect_id
        for sect_id, record in sect_records(chain_rows, enum_types).items()
        if record.get("legacy_id") is not None
    }


class SectBuilder:
    def __init__(self, ctx):
        self.ctx = ctx

    def rows(self) -> dict[str, list[dict[str, Any]]]:
        return {"sects": self.build_sects()}

    def build_sects(self) -> list[dict[str, Any]]:
        by_id = sect_records(self.ctx.chain_rows, self.ctx.enum_types)
        return [by_id[row_id] for row_id in sorted(by_id)]
