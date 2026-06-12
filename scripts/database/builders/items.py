from __future__ import annotations

from typing import Any

from ..utils import bool_int, clean_text, js_number


def build_item_lookups(item_rows: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    item_by_name: dict[str, dict[str, Any]] = {}
    duplicates: list[str] = []
    for row in item_rows or []:
        item = {"id": int(js_number(row.get("index")))}
        for name in [row.get("name"), row.get("chnname")]:
            if not name:
                continue
            if name in item_by_name and item_by_name[name]["id"] != item["id"]:
                duplicates.append(name)
            item_by_name[name] = item
    if duplicates:
        raise RuntimeError(f"GItem 名称存在重名，无法安全映射物品：{'、'.join(sorted(set(duplicates)))}")
    return item_by_name


class ItemBuilder:
    def __init__(self, ctx):
        self.ctx = ctx

    def rows(self) -> dict[str, list[dict[str, Any]]]:
        return {"items": self.build_items()}

    def build_items(self) -> list[dict[str, Any]]:
        return [
            {
                "id": int(js_number(row.get("index"))),
                "icon": row.get("png") or None,
                "description": clean_text(row.get("desc")),
                "type_id": int(js_number(row.get("type"))),
                "rarity_id": int(js_number(row.get("rare"))),
                "use_type_id": int(js_number(row.get("usetype"))),
                "use_text": clean_text(row.get("usestring")),
                "use_value": js_number(row.get("usevalue")),
                "use_value2": int(js_number(row.get("usevalue2"))),
                "use_value3": js_number(row.get("usevalue3")),
                "cost": js_number(row.get("ccost")),
                "required_strength": int(js_number(row.get("xianzhi_lvli"))),
                "required_constitution": int(js_number(row.get("xianzhi_gengu"))),
                "required_physique": int(js_number(row.get("xianzhi_tipo"))),
                "required_agility": int(js_number(row.get("xianzhi_shenfa"))),
                "required_cultivation": int(js_number(row.get("xianzhi_xiuwei"))),
                "required_mastery": int(js_number(row.get("xianzhi_jingtong"))),
                "is_material": bool_int(row.get("iscailiao")),
            }
            for row in self.ctx.item_rows
        ]
