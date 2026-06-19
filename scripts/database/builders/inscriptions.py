from __future__ import annotations

from typing import Any

from .items import build_item_lookups
from ..utils import bool_int, js_number


class InscriptionBuilder:
    def __init__(self, ctx):
        self.ctx = ctx

    def rows(self) -> dict[str, list[dict[str, Any]]]:
        return {"inscriptions": self.build_inscriptions()}

    def build_inscriptions(self) -> list[dict[str, Any]]:
        item_by_name = build_item_lookups(self.ctx.item_rows)

        def material_id(row: dict[str, Any], key: str) -> int | None:
            item = item_by_name.get(row.get(key) or "")
            return item["id"] if item else None

        return [
            {
                "id": int(js_number(row.get("index"))),
                "name": row.get("chname") or row.get("name") or None,
                "legacy_name": row.get("name") or None,
                "style_id": int(js_number(row.get("fengge"))),
                "bonus_count": int(js_number(row.get("fujiaqty"))),
                "bonus_value_min": int(js_number(row.get("fujiavaluemin"))),
                "bonus_value_max": int(js_number(row.get("fujiavaluemax"))),
                "fixed_strength": bool_int(row.get("guding_lv")),
                "fixed_constitution": bool_int(row.get("guding_gengu")),
                "fixed_physique": bool_int(row.get("guding_tipo")),
                "fixed_agility": bool_int(row.get("guding_shenfa")),
                "material_1_name": row.get("cailiao1") or None,
                "material_1_item_id": material_id(row, "cailiao1"),
                "material_1_quantity": int(js_number(row.get("cailiao1qty"))),
                "material_2_name": row.get("cailiao2") or None,
                "material_2_item_id": material_id(row, "cailiao2"),
                "material_2_quantity": int(js_number(row.get("cailiao2qty"))),
                "material_3_name": row.get("cailiao3") or None,
                "material_3_item_id": material_id(row, "cailiao3"),
                "material_3_quantity": int(js_number(row.get("cailiao3qty"))),
            }
            for row in self.ctx.inscription_rows
        ]
