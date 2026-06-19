from __future__ import annotations

from typing import Any

from ..utils import bool_int, clean_text, js_number


def martial_art_display_name_lookup(wugong_rows: list[dict[str, Any]]) -> dict[str, str]:
    lookup: dict[str, str] = {}
    for row in wugong_rows or []:
        legacy_name = row.get("name")
        display_name = row.get("chnname") or legacy_name
        if legacy_name and display_name:
            lookup[legacy_name] = display_name
    return lookup


def build_item_lookups(item_rows: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    item_by_name: dict[str, dict[str, Any]] = {}
    duplicates: list[str] = []
    for row in item_rows or []:
        item = {
            "id": int(js_number(row.get("index"))),
            "name": row.get("chnname") or row.get("name"),
        }
        for name in [row.get("name"), row.get("chnname")]:
            if not name:
                continue
            if name in item_by_name and item_by_name[name]["id"] != item["id"]:
                duplicates.append(name)
            item_by_name[name] = item
    if duplicates:
        raise RuntimeError(f"GItem 名称存在重名，无法安全映射物品：{'、'.join(sorted(set(duplicates)))}")
    return item_by_name


def build_recipe_unlock_item_lookup(item_rows: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    unlock_item_by_target_name: dict[str, dict[str, Any]] = {}
    duplicates: list[str] = []
    for row in item_rows or []:
        if int(js_number(row.get("usetype"))) != 2:
            continue
        target_name = row.get("usestring")
        if not target_name:
            continue
        item = {
            "id": int(js_number(row.get("index"))),
            "name": row.get("chnname") or row.get("name"),
        }
        if target_name in unlock_item_by_target_name and unlock_item_by_target_name[target_name]["id"] != item["id"]:
            duplicates.append(target_name)
        unlock_item_by_target_name[target_name] = item
    if duplicates:
        raise RuntimeError(f"GItem 配方解锁目标存在重名，无法安全映射制作书：{'、'.join(sorted(set(duplicates)))}")
    return unlock_item_by_target_name


class ItemBuilder:
    def __init__(self, ctx):
        self.ctx = ctx

    def rows(self) -> dict[str, list[dict[str, Any]]]:
        return {
            "items": self.build_items(),
            "item_inventory_templates": self.build_inventory_templates(),
            "item_recipes": self.build_recipes(),
            "item_recipe_unlocks": self.build_recipe_unlocks(),
        }

    def build_items(self) -> list[dict[str, Any]]:
        martial_art_name_by_legacy_name = martial_art_display_name_lookup(self.ctx.wugong_rows)

        def use_text(row: dict[str, Any]) -> str | None:
            text = clean_text(row.get("usestring"))
            if int(js_number(row.get("usetype"))) == 1 and text:
                return martial_art_name_by_legacy_name.get(text, text)
            return text

        return [
            {
                "id": int(js_number(row.get("index"))),
                "name": row.get("chnname") or row.get("name") or None,
                "legacy_name": row.get("name") or None,
                "image_id": self.ctx.image_id_by_name.get(row.get("png")),
                "description": clean_text(row.get("desc")),
                "type_id": int(js_number(row.get("type"))),
                "rarity_id": int(js_number(row.get("rare"))),
                "use_type_id": int(js_number(row.get("usetype"))),
                "use_text": use_text(row),
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

    def build_inventory_templates(self) -> list[dict[str, Any]]:
        item_by_name = build_item_lookups(self.ctx.item_rows)
        template_names = {
            row.get("daojuname")
            for row in self.ctx.inventory_rows
            if row.get("juesename") == "all" and row.get("daojuname")
        }
        template_owner = "all" if template_names else "temp"

        rows: list[dict[str, Any]] = []
        for row in self.ctx.inventory_rows:
            if row.get("juesename") != template_owner:
                continue
            legacy_name = row.get("daojuname")
            item = item_by_name.get(legacy_name or "")
            if not item:
                continue
            if int(js_number(row.get("zhuangbeiid"))) <= 0:
                continue
            rows.append({
                "item_id": item["id"],
                "source_row_index": int(js_number(row.get("index"))),
                "template_name": row.get("name") or None,
                "daojuname": legacy_name or None,
                "showname": row.get("showname") or None,
                "type_id": int(js_number(row.get("type"))),
                "rarity_id": int(js_number(row.get("rare"))),
                "zhuangbeiid": int(js_number(row.get("zhuangbeiid"))),
                "att": int(js_number(row.get("att"))),
                "def": int(js_number(row.get("def"))),
                "hp": int(js_number(row.get("hp"))),
                "weight": js_number(row.get("weight")),
                "length": js_number(row.get("length")),
                "zhushuxing": int(js_number(row.get("zhushuxing"))),
                "lvli": int(js_number(row.get("lvli"))),
                "gengu": int(js_number(row.get("gengu"))),
                "tipo": int(js_number(row.get("tipo"))),
                "shenfa": int(js_number(row.get("shenfa"))),
                "showlv": int(js_number(row.get("showlv"))),
                "hidelv": int(js_number(row.get("hidelv"))),
                "mingkecitiao": row.get("mingkecitiao") or None,
                "mingke_fg": int(js_number(row.get("mingke_fg"))),
                "mingke_lvli": int(js_number(row.get("mingke_lvli"))),
                "mingke_gengu": int(js_number(row.get("mingke_gengu"))),
                "mingke_tipo": int(js_number(row.get("mingke_tipo"))),
                "mingke_shenfa": int(js_number(row.get("mingke_shenfa"))),
            })
        return sorted(rows, key=lambda item: (item["type_id"], item["rarity_id"], item["item_id"]))

    def build_recipes(self) -> list[dict[str, Any]]:
        item_by_name = build_item_lookups(self.ctx.item_rows)
        rows: list[dict[str, Any]] = []

        def item_id(name: str | None) -> int | None:
            item = item_by_name.get(name or "")
            return item["id"] if item else None

        def item_display_name(name: str | None) -> str | None:
            item = item_by_name.get(name or "")
            if item:
                return item["name"]
            return name or None

        for row in self.ctx.recipe_rows:
            product_name = row.get("chanwuname") or row.get("name")
            product_id = item_id(product_name)
            if product_id is None:
                continue

            rows.append({
                "id": int(js_number(row.get("index"))),
                "item_id": product_id,
                "template_name": row.get("tuzhi") or None,
                "recipe_name": item_display_name(row.get("name")),
                "product_name": item_display_name(product_name),
                "type_id": int(js_number(row.get("chanwutype"))),
                "quantity": int(js_number(row.get("chanwuqty"))),
                "rarity_id": int(js_number(row.get("chanwurare"))),
                "material_1_name": item_display_name(row.get("cailiao1")),
                "material_1_item_id": item_id(row.get("cailiao1")),
                "material_1_quantity": int(js_number(row.get("cailiao1qty"))),
                "material_2_name": item_display_name(row.get("cailiao2")),
                "material_2_item_id": item_id(row.get("cailiao2")),
                "material_2_quantity": int(js_number(row.get("cailiao2qty"))),
                "material_3_name": item_display_name(row.get("cailiao3")),
                "material_3_item_id": item_id(row.get("cailiao3")),
                "material_3_quantity": int(js_number(row.get("cailiao3qty"))),
                "length_min": js_number(row.get("lengthmin")),
                "length_max": js_number(row.get("lengthmax")),
                "weight_min": js_number(row.get("weightmin")),
                "weight_max": js_number(row.get("weightmax")),
                "att_min": int(js_number(row.get("attmin"))),
                "att_max": int(js_number(row.get("attmax"))),
                "def_min": int(js_number(row.get("defmin"))),
                "def_max": int(js_number(row.get("defmax"))),
                "hp_min": int(js_number(row.get("hpmin"))),
                "hp_max": int(js_number(row.get("hpmax"))),
                "main_attribute_min": int(js_number(row.get("zhushuxingmin"))),
                "main_attribute_max": int(js_number(row.get("zhushuxingmax"))),
                "bonus_count_min": int(js_number(row.get("fujiaqtymin"))),
                "bonus_count_max": int(js_number(row.get("fujiaqtymax"))),
                "bonus_value_min": int(js_number(row.get("fujiavaluemin"))),
                "bonus_value_max": int(js_number(row.get("fujiavaluemax"))),
                "fixed_strength": bool_int(row.get("guding_lv")),
                "fixed_constitution": bool_int(row.get("guding_gengu")),
                "fixed_physique": bool_int(row.get("guding_tipo")),
                "fixed_agility": bool_int(row.get("guding_shenfa")),
                "is_learned": bool_int(row.get("islearned")),
                "required_level": int(js_number(row.get("needlv"))),
                "is_basic": bool_int(row.get("isbasic")),
                "is_basic_material": bool_int(row.get("isjichusucai")),
                "can_buy": bool_int(row.get("canbuy")),
            })

        return sorted(rows, key=lambda item: (item["type_id"], item["rarity_id"], item["item_id"]))

    def build_recipe_unlocks(self) -> list[dict[str, Any]]:
        item_by_name = build_item_lookups(self.ctx.item_rows)
        unlock_item_by_target_name = build_recipe_unlock_item_lookup(self.ctx.item_rows)
        rows: list[dict[str, Any]] = []

        for row in self.ctx.recipe_rows:
            product_name = row.get("chanwuname") or row.get("name")
            product = item_by_name.get(product_name or "")
            unlock_item = unlock_item_by_target_name.get(row.get("tuzhi") or "")
            if not product or not unlock_item:
                continue

            rows.append({
                "unlock_item_id": unlock_item["id"],
                "recipe_id": int(js_number(row.get("index"))),
                "product_item_id": product["id"],
            })

        return sorted(rows, key=lambda row: (row["unlock_item_id"], row["recipe_id"], row["product_item_id"]))
