from __future__ import annotations

import re

from .characters import character_id_lookup
from .items import build_item_lookups
from ..utils import bool_int, js_number


SHOP_OWNER_SUFFIX_RE = re.compile(r"_shop(?:_.*)?$")


def normalize_shop_owner_name(name: str | None) -> str | None:
    if not name:
        return None
    return SHOP_OWNER_SUFFIX_RE.sub("", name)


class InventoryBuilder:
    def __init__(self, ctx):
        self.ctx = ctx

    def rows(self) -> dict[str, list[dict[str, object]]]:
        return {
            "inventory_presets": self.build_inventory_presets(),
            "shop": self.build_shop_rows(),
        }

    def build_inventory_presets(self) -> list[dict[str, object]]:
        character_id_by_name = character_id_lookup(self.ctx.npc_rows)
        item_by_name = build_item_lookups(self.ctx.item_rows)
        rows: list[dict[str, object]] = []

        for row in self.ctx.inventory_rows or []:
            legacy_character_name = row.get("juesename")
            normalized_character_name = normalize_shop_owner_name(legacy_character_name)
            character_id = character_id_by_name.get(normalized_character_name or "")
            if character_id is None:
                continue

            legacy_item_name = row.get("daojuname")
            item = item_by_name.get(legacy_item_name or "")
            if not item:
                raise RuntimeError(f"XingNang.daojuname 无法映射到 GItem：{legacy_item_name}")

            rows.append({
                "source_row_index": int(js_number(row.get("index"))),
                "legacy_name": row.get("name") or None,
                "legacy_character_name": legacy_character_name or None,
                "legacy_item_name": legacy_item_name or None,
                "character_id": character_id,
                "item_id": item["id"],
                "type_id": int(js_number(row.get("type"))),
                "equipment_id": int(js_number(row.get("zhuangbeiid"))),
                "quantity": int(js_number(row.get("qty"))),
                "rarity_id": int(js_number(row.get("rare"))),
                "att": int(js_number(row.get("att"))),
                "def": int(js_number(row.get("def"))),
                "hp": int(js_number(row.get("hp"))),
                "weight": js_number(row.get("weight")),
                "length": js_number(row.get("length")),
                "main_attribute": int(js_number(row.get("zhushuxing"))),
                "strength": int(js_number(row.get("lvli"))),
                "constitution": int(js_number(row.get("gengu"))),
                "physique": int(js_number(row.get("tipo"))),
                "agility": int(js_number(row.get("shenfa"))),
                "is_equipped": bool_int(row.get("iseuipped")),
                "show_level": int(js_number(row.get("showlv"))),
                "hide_level": int(js_number(row.get("hidelv"))),
                "is_new": bool_int(row.get("isnew")),
                "show_name": row.get("showname") or None,
                "inscription": row.get("mingkecitiao") or None,
                "inscription_fg": int(js_number(row.get("mingke_fg"))),
                "inscription_strength": int(js_number(row.get("mingke_lvli"))),
                "inscription_constitution": int(js_number(row.get("mingke_gengu"))),
                "inscription_physique": int(js_number(row.get("mingke_tipo"))),
                "inscription_agility": int(js_number(row.get("mingke_shenfa"))),
                "redpoint": bool_int(row.get("redpoint")),
                "selected": bool_int(row.get("selected")),
                "uid": row.get("uid") or None,
            })

        return sorted(rows, key=lambda row: (row["character_id"], row["source_row_index"]))

    def build_shop_rows(self) -> list[dict[str, object]]:
        character_id_by_name = character_id_lookup(self.ctx.npc_rows)
        item_by_name = build_item_lookups(self.ctx.item_rows)
        rows: list[dict[str, object]] = []

        for row in self.ctx.shop_rows or []:
            legacy_character_name = row.get("juesename")
            normalized_character_name = normalize_shop_owner_name(legacy_character_name)
            character_id = character_id_by_name.get(normalized_character_name or "")
            if character_id is None:
                raise RuntimeError(f"Shop.juesename 无法映射到 Npc：{legacy_character_name}")

            legacy_item_name = row.get("daojuname")
            item = item_by_name.get(legacy_item_name or "")
            if not item:
                raise RuntimeError(f"Shop.daojuname 无法映射到 GItem：{legacy_item_name}")

            rows.append({
                "source_row_index": int(js_number(row.get("index"))),
                "legacy_name": row.get("name") or None,
                "legacy_character_name": legacy_character_name or None,
                "legacy_item_name": legacy_item_name or None,
                "character_id": character_id,
                "item_id": item["id"],
                "type_id": int(js_number(row.get("type"))),
                "min_quantity": int(js_number(row.get("minqty"))),
                "max_quantity": int(js_number(row.get("maxqty"))),
                "rarity_id": int(js_number(row.get("rare"))),
                "chance": js_number(row.get("chuxianjilv")),
            })

        return sorted(rows, key=lambda row: (row["character_id"], row["source_row_index"]))
