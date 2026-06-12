from __future__ import annotations

import math
from typing import Any

from ..utils import bool_int, js_number


class CustomMartialBuilder:
    def __init__(self, ctx):
        self.ctx = ctx

    def rows(self) -> dict[str, list[dict[str, Any]]]:
        return {
            "custom_martial_arts": self.build_custom_martial_arts(),
            "custom_martial_art_effects": self.build_effects(),
            "custom_style_weights": self.build_style_weights(),
            "custom_martial_power_ranges": self.build_power_ranges(),
            "custom_martial_effect_rates": self.build_effect_rates(),
        }

    def build_custom_martial_arts(self) -> list[dict[str, Any]]:
        return [
            {
                "id": row_id,
                "type_id": int(js_number(row.get("type"))),
                "rarity_id": int(js_number(row.get("rare"))),
                "cost": int(js_number(row.get("cost"))),
                "slash_effect_id": int(js_number(row.get("slashfx"))),
                "hit_effect_id": int(js_number(row.get("hitfx"))),
                "attack_area_id": self.ctx.attack_area_by_name.get(row.get("attackareaname")),
                "is_custom": bool_int(row.get("iszichuang")),
            }
            for row_id, row in enumerate(self.ctx.wugong_rows)
        ]

    def build_effects(self) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []
        for row_id, row in enumerate(self.ctx.wugong_rows):
            for slot in (1, 2, 3):
                effect_id = js_number(row.get(f"buff{slot}"))
                if math.isfinite(effect_id) and effect_id != 99:
                    rows.append({
                        "custom_martial_art_id": row_id,
                        "slot": slot,
                        "effect_id": int(effect_id),
                        "target_id": int(js_number(row.get(f"bufftarget{slot}"))),
                    })
        return rows

    def build_style_weights(self) -> list[dict[str, Any]]:
        return [
            {
                "id": row_id,
                "style_id": int(js_number(row.get("fengge"))),
                "weight": int(js_number(row.get("qty"))),
            }
            for row_id, row in enumerate(self.ctx.chain_rows)
        ]

    def build_power_ranges(self) -> list[dict[str, Any]]:
        return [
            {
                "id": row_id,
                "weapon_type_id": int(js_number(row.get("bingqitype"))),
                "rarity_id": int(js_number(row.get("rare"))),
                "cost": int(js_number(row.get("cost"))),
                "power_min": js_number(row.get("weilimin")),
                "power_max": js_number(row.get("weilimax")),
                "percent_min": js_number(row.get("percentmin")),
                "percent_max": js_number(row.get("percentmax")),
            }
            for row_id, row in enumerate(self.ctx.custom_power_rows)
        ]

    def build_effect_rates(self) -> list[dict[str, Any]]:
        return [
            {
                "id": row_id,
                "rarity_id": int(js_number(row.get("rare"))),
                "effect_id": int(js_number(row.get("bufftype"))),
                "target_id": int(js_number(row.get("bufftarget"))),
                "level": int(js_number(row.get("value"))),
                "percent": js_number(row.get("percent")),
            }
            for row_id, row in enumerate(self.ctx.custom_buff_rows)
        ]
