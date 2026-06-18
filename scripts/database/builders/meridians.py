from __future__ import annotations

import json
from typing import Any

from ..utils import bool_int, js_int


def text_value(value: Any) -> str | None:
    if value in ("", None):
        return None
    if isinstance(value, (list, dict)):
        return json.dumps(value, ensure_ascii=False)
    return str(value)


class MeridianBuilder:
    def __init__(self, ctx):
        self.ctx = ctx

    def rows(self) -> dict[str, list[dict[str, Any]]]:
        return {"meridians": self.build_meridians()}

    def build_meridians(self) -> list[dict[str, Any]]:
        return [
            {
                "name": row.get("name") or "",
                "meridian_id": js_int(row.get("jingmai")),
                "point_index": js_int(row.get("index")),
                "strength": js_int(row.get("lvli")),
                "constitution": js_int(row.get("gengu")),
                "physique": js_int(row.get("tipo")),
                "agility": js_int(row.get("shenfa")),
                "action_points": js_int(row.get("xingdongli")),
                "lifespan": js_int(row.get("shouming")),
                "martial_art_limit": js_int(row.get("wugongshu")),
                "cost": js_int(row.get("cost")),
                "is_acupoint": bool_int(row.get("ischongxue")),
                "parent": text_value(row.get("parent")),
            }
            for row in self.ctx.meridian_rows
            if row.get("name")
        ]
