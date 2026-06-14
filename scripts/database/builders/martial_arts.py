from __future__ import annotations

import math
import re
from typing import Any

from ..passive_templates import martial_art_passive_template_rows
from ..utils import bool_int, clean_text, js_number, round_number


STATUS_EFFECT_META = {
    0: {"value_per_level": 10, "template": "伤害提升{value*n}%"},
    1: {"value_per_level": 10, "template": "防御提升{value*n}%"},
    2: {"value_per_level": 10, "template": "速度提升{value*n}%"},
    3: {"value_per_level": 20, "template": "移动距离提升{value*n}%"},
    4: {"value_per_level": None, "template": "未记录"},
    5: {"value_per_level": 10, "template": "真气恢复速度提升{value*n}%"},
    6: {"value_per_level": 10, "template": "防御降低{value*n}%"},
    7: {"value_per_level": 10, "template": "伤害降低{value*n}%"},
    8: {"value_per_level": None, "template": "一段时间无法行动"},
    9: {"value_per_level": 10, "template": "命中率降低{value*n}%"},
    10: {"value_per_level": 3, "template": "持续失去{value*n}点体力"},
    11: {"value_per_level": None, "template": "一段时间无法恢复真气"},
    12: {"value_per_level": 20, "template": "移动距离降低{value*n}%"},
    13: {"value_per_level": 10, "template": "速度降低{value*n}%"},
    14: {"value_per_level": 12, "template": "受伤时额外失去{value*n}点体力"},
    15: {"value_per_level": None, "template": "未记录"},
    99: {"value_per_level": None, "template": "无特殊效果"},
}


def martial_art_id_by_internal_name(wugong_rows: list[dict[str, Any]]) -> dict[str, int]:
    lookup: dict[str, int] = {}
    duplicates: list[str] = []
    for index, row in enumerate(wugong_rows):
        if not row.get("name"):
            continue
        row_id = int(js_number(row.get("index") if row.get("index") is not None else index))
        if row["name"] in lookup:
            duplicates.append(row["name"])
        lookup[row["name"]] = row_id
    if duplicates:
        raise RuntimeError(f"GWuGong.name 存在重名，无法安全映射 NPC 武功：{'、'.join(sorted(set(duplicates)))}")
    return lookup


def style_ids_from_row(row: dict[str, Any]) -> list[int]:
    return [
        int(value)
        for value in (js_number(row.get("liansuo_fg1")), js_number(row.get("liansuo_fg2")))
        if math.isfinite(value) and value > 0
    ]


def max_level_detail_row(detail_rows: list[dict[str, Any]], martial_index: int) -> dict[str, Any] | None:
    rows = detail_rows[martial_index * 10:martial_index * 10 + 10]
    candidates = [row for row in rows if js_number(row.get("weili")) > 0]
    return sorted(candidates, key=lambda row: js_number(row.get("lv")), reverse=True)[0] if candidates else None


def highest_level_detail_row(detail_rows: list[dict[str, Any]], martial_index: int) -> dict[str, Any] | None:
    rows = detail_rows[martial_index * 10:martial_index * 10 + 10]
    return sorted(rows, key=lambda row: js_number(row.get("lv")), reverse=True)[0] if rows else None


def chain_passive_type(row: dict[str, Any]) -> str | None:
    style_id = js_number(row.get("fengge"))
    sect_id = js_number(row.get("menpai"))
    if style_id != 0:
        return "style"
    if sect_id != 15:
        return "sect"
    return None


def chain_passive_id(row: dict[str, Any]) -> int | None:
    passive_type = chain_passive_type(row)
    if passive_type == "style":
        return int(js_number(row.get("fengge")))
    if passive_type == "sect":
        return int(js_number(row.get("menpai")))
    return None


def normalized_number_text(value: Any) -> str | None:
    number = js_number(value)
    if not math.isfinite(number):
        return None
    rounded = round_number(number)
    if float(rounded).is_integer():
        return str(int(rounded))
    return f"{rounded:.12g}"


def replace_number_token(text: str, value: Any, placeholder: str) -> dict[str, Any]:
    candidates = [
        normalized_number_text(value),
        normalized_number_text(js_number(value) * 100),
    ]
    for candidate in [item for item in candidates if item]:
        pattern = re.compile(rf"(?<![A-Za-z0-9_{{.]){re.escape(candidate)}(?![A-Za-z0-9_}}.])")
        if pattern.search(text):
            number_value = js_number(candidate)
            if math.isfinite(number_value) and float(number_value).is_integer():
                number_value = int(number_value)
            return {"text": pattern.sub(placeholder, text, count=1), "param": number_value}
    return {"text": text, "param": None}


def chain_template_and_params(row: dict[str, Any]) -> dict[str, Any]:
    template = clean_text(row.get("desc")) or ""
    params: list[Any] = [None, None]
    replaced_indexes: list[int] = []
    for index, raw_value in enumerate([row.get("value1"), row.get("value2")], start=1):
        number = js_number(raw_value)
        if not math.isfinite(number) or number == 0:
            continue
        result = replace_number_token(template, number, f"{{param{index}}}")
        template = result["text"]
        if result["param"] is not None:
            params[index - 1] = result["param"]
            replaced_indexes.append(index)

    if replaced_indexes == [1]:
        template = template.replace("{param1}", "{param}")

    return {
        "template": template,
        "param1": params[0],
        "param2": params[1],
    }


def chain_passive_template_id(row: dict[str, Any]) -> str | None:
    passive_type = chain_passive_type(row)
    passive_id = chain_passive_id(row)
    count = js_number(row.get("qty"))
    if not passive_type or passive_id is None or not math.isfinite(count):
        return None
    return f"chain:{passive_type}:{passive_id}:{int(count)}"


class MartialArtBuilder:
    def __init__(self, ctx):
        self.ctx = ctx

    def rows(self) -> dict[str, list[dict[str, Any]]]:
        return {
            "martial_arts": self.build_martial_arts(),
            "martial_art_styles": self.build_styles(),
            "martial_art_effects": self.build_effects(),
            "martial_art_levels": self.build_levels(),
            "passives": self.build_passives(),
            "status_effects": self.build_status_effects(),
            "passive_chains": self.build_passive_chains(),
        }

    def build_martial_arts(self) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []
        for index, row in enumerate(self.ctx.wugong_rows):
            type_id = int(js_number(row.get("type")))
            max_detail = max_level_detail_row(self.ctx.wugong_detail_rows, index)
            highest_detail = highest_level_detail_row(self.ctx.wugong_detail_rows, index)
            obtain_method = clean_text(row.get("huodefangfa"))
            row_id = int(js_number(row.get("index") if row.get("index") is not None else index))
            rows.append({
                "id": row_id,
                "name": row.get("chnname") or row.get("name") or None,
                "legacy_id": row_id,
                "legacy_name": row.get("name") or None,
                "sect_id": int(js_number(row.get("liansuo_mp"))),
                "type_id": type_id,
                "rarity_id": int(js_number(row.get("rare"))),
                "attack_area_id": self.ctx.attack_area_by_name.get(row.get("attackareaname")),
                "slash_effect_id": int(js_number(row.get("slashfx"))),
                "hit_effect_id": int(js_number(row.get("hitfx"))),
                "power": None if type_id == 6 or not max_detail else round_number(max_detail.get("weili")),
                "cost": None if type_id == 6 else int(js_number(row.get("cost"))),
                "interval": int(js_number(row.get("jiange"))),
                "accuracy": int(js_number(row.get("mingzhong"))),
                "obtain_method": obtain_method,
                "is_sect_restricted": bool_int(obtain_method and obtain_method.startswith("武林大会奖品")),
                "is_custom_source": bool_int(row.get("iszichuang")),
                "passive_1_id": int(js_number(row.get("beidong1"))) or None,
                "passive_1_value": js_number(highest_detail.get("b1value") if highest_detail else 0),
                "passive_2_id": int(js_number(row.get("beidong2"))) or None,
                "passive_2_value": js_number(highest_detail.get("b2value") if highest_detail else 0),
                "passive_3_id": int(js_number(row.get("beidong3"))) or None,
                "passive_3_value": js_number(highest_detail.get("b3value") if highest_detail else 0),
            })
        return rows

    def build_styles(self) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []
        for index, row in enumerate(self.ctx.wugong_rows):
            martial_id = int(js_number(row.get("index") if row.get("index") is not None else index))
            for slot, style_id in enumerate(style_ids_from_row(row)):
                rows.append({"martial_art_id": martial_id, "slot": slot, "style_id": style_id})
        return rows

    def build_effects(self) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []
        for index, row in enumerate(self.ctx.wugong_rows):
            detail = max_level_detail_row(self.ctx.wugong_detail_rows, index)
            martial_id = int(js_number(row.get("index") if row.get("index") is not None else index))
            for slot in (1, 2, 3):
                effect_id = js_number(row.get(f"buff{slot}"))
                level = js_number(detail.get(f"b{slot}value") if detail else 0)
                if math.isfinite(effect_id) and effect_id != 99 and level >= 0:
                    rows.append({
                        "martial_art_id": martial_id,
                        "slot": slot,
                        "effect_id": int(effect_id),
                        "target_id": int(js_number(row.get(f"bufftarget{slot}"))),
                        "level": int(level),
                    })
        return rows

    def build_levels(self) -> list[dict[str, Any]]:
        martial_id_by_name = martial_art_id_by_internal_name(self.ctx.wugong_rows)
        rows = [
            {
                "martial_art_id": martial_id_by_name[row.get("wugongname")],
                "level": int(js_number(row.get("lv"))),
                "training_exp": int(js_number(row.get("maxexp"))),
                "required_strength": int(js_number(row.get("xiulian_lvli"))),
                "required_constitution": int(js_number(row.get("xiulian_gengu"))),
                "required_physique": int(js_number(row.get("xiulian_tipo"))),
                "required_agility": int(js_number(row.get("xiulian_shenfa"))),
                "required_mastery": int(js_number(row.get("xiulian_wuyi"))),
                "power": round_number(row.get("weili")),
                "effect_1_level": int(js_number(row.get("b1value"))),
                "effect_2_level": int(js_number(row.get("b2value"))),
                "effect_3_level": int(js_number(row.get("b3value"))),
                "hp": int(js_number(row.get("hp"))),
                "qi_recovery": round_number(row.get("zhenqiup")),
            }
            for row in self.ctx.wugong_detail_rows
            if row.get("wugongname") in martial_id_by_name
        ]
        return sorted(rows, key=lambda item: (item["martial_art_id"], item["level"]))

    def build_passives(self) -> list[dict[str, Any]]:
        rows = [
            {"id": str(row["id"]), "template": row["template"], "image_id": None}
            for row in martial_art_passive_template_rows()
        ]
        for row in self.ctx.chain_rows:
            row_id = chain_passive_template_id(row)
            if not row_id:
                continue
            icon = clean_text(row.get("png")) or None
            rows.append({
                "id": row_id,
                "template": chain_template_and_params(row)["template"],
                "image_id": self.ctx.image_id_by_name.get(icon),
            })
        return sorted(rows, key=lambda item: str(item["id"]))

    def build_passive_chains(self) -> list[dict[str, Any]]:
        rows = []
        for row in self.ctx.chain_rows:
            passive_type = chain_passive_type(row)
            passive_id = chain_passive_id(row)
            count = js_number(row.get("qty"))
            if not passive_type or passive_id is None or not math.isfinite(count):
                continue
            template_data = chain_template_and_params(row)
            chain_template_id = chain_passive_template_id(row)
            if not chain_template_id:
                continue
            rows.append({
                "id": passive_id,
                "passive_type": passive_type,
                "count": int(count),
                "passive_id": chain_template_id,
                "param1": template_data["param1"],
                "param2": template_data["param2"],
            })
        return sorted(rows, key=lambda item: (item["passive_type"], item["id"], item["count"]))

    def build_status_effects(self) -> list[dict[str, Any]]:
        rows = []
        for row_id in (self.ctx.enum_types.get("BuffType") or {}).keys():
            effect_id = int(js_number(row_id))
            if effect_id in STATUS_EFFECT_META:
                rows.append({"id": effect_id, **STATUS_EFFECT_META[effect_id]})
        return sorted(rows, key=lambda item: item["id"])
