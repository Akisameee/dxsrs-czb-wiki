from __future__ import annotations

from collections import defaultdict
from typing import Any

from .enums import npc_name
from .items import build_item_lookups
from .martial_arts import martial_art_id_by_internal_name
from .sects import sect_id_by_legacy_id
from ..utils import bool_int, js_number


LEGACY_SECT_TARGET_IDS = {
    "少林寺": 0,
    "武当派": 1,
    "丐帮": 2,
    "逍遥派": 5,
    "古墓派": 6,
    "日月神教": 8,
    "五毒教": 9,
}


def character_id_lookup(npc_rows: list[dict[str, Any]]) -> dict[str, int]:
    id_by_name: dict[str, int] = {}
    for row in npc_rows:
        row_id = int(js_number(row.get("index")))
        if row.get("name"):
            id_by_name[row["name"]] = row_id
            id_by_name[npc_name(row)] = row_id
    return id_by_name


def character_display_name_lookup(npc_rows: list[dict[str, Any]]) -> dict[str, str]:
    name_by_name: dict[str, str] = {}
    for row in npc_rows:
        display_name = npc_name(row)
        if row.get("name"):
            name_by_name[row["name"]] = display_name
        name_by_name[display_name] = display_name
    return name_by_name

class CharacterBuilder:
    def __init__(self, ctx):
        self.ctx = ctx

    def rows(self) -> dict[str, list[dict[str, Any]]]:
        quest_data = self.build_character_quest_data()
        return {
            "characters": self.build_characters(),
            "character_martial_arts": self.build_martial_arts(),
            "character_attribute_snapshots": self.build_attribute_snapshots(),
            "character_quests": quest_data["quests"],
            "character_quest_targets": quest_data["targets"],
            "character_invitation_requirements": self.build_invitation_requirements(),
            "locations": self.build_locations(),
            "location_characters": self.build_location_characters(),
            "unplaced_characters": self.build_unplaced_characters(),
        }

    def build_characters(self) -> list[dict[str, Any]]:
        sect_id_by_old_id = sect_id_by_legacy_id(self.ctx.chain_rows, self.ctx.enum_types)
        word_by_name = {
            row["juesename"]: row.get("word")
            for row in self.ctx.npc_word_rows or []
            if row.get("juesename")
        }
        rows: list[dict[str, Any]] = []
        for row in self.ctx.npc_rows:
            location = self.ctx.location_by_code.get(row.get("area")) if row.get("area") else None
            name = npc_name(row)
            legacy_sect_id = int(js_number(row.get("menpai")))
            rows.append({
                "id": int(js_number(row.get("index"))),
                "name": name,
                "legacy_id": int(js_number(row.get("index"))),
                "legacy_name": row.get("name") or None,
                "portrait": row.get("touxiang") or None,
                "region_id": location.region_id if location else None,
                "location_id": location.location_id if location else None,
                "sect_id": sect_id_by_old_id.get(legacy_sect_id),
                "sex_id": int(js_number(row.get("sex"))),
                "rarity_id": int(js_number(row.get("rare"))),
                "rank_id": int(js_number(row.get("dengji"))),
                "position_id": int(js_number(row.get("diwei"))),
                "level": int(js_number(row.get("lv"))),
                "favorite_rarity_id": int(js_number(row.get("likerare"))),
                "fame": int(js_number(row.get("mingsheng"))),
                "chivalry": int(js_number(row.get("xiayi"))),
                "gold": int(js_number(row.get("gold"))),
                "is_instructor": bool_int(row.get("isjiaotou")),
                "is_manager": bool_int(row.get("isguanshiren")),
                "weapon_type_id": int(js_number(row.get("bingqitype"))),
                "growth_type_id": int(js_number(row.get("changzhangtype"))),
                "martial_type_id": int(js_number(row.get("wugongtype"))),
                "equipment_weapon": row.get("wuqiname") or None,
                "equipment_armor": row.get("fangjuname") or None,
                "equipment_other_weapon": row.get("otherwuqiname") or None,
                "strength": js_number(row.get("lvli")),
                "constitution": js_number(row.get("gengu")),
                "physique": js_number(row.get("tipo")),
                "agility": js_number(row.get("shenfa")),
                "cultivation": js_number(row.get("xiuwei")),
                "fist": js_number(row.get("quanzhang")),
                "blade_sword": js_number(row.get("daojian")),
                "spear_staff": js_number(row.get("qiangbang")),
                "hidden_weapon": js_number(row.get("anqi")),
                "internal": js_number(row.get("neigong")),
                "growth_initial_value": js_number(row.get("chushizhi")),
                "growth_final_value": js_number(row.get("zuizhongzhi")),
                "growth_base_level": int(js_number(row.get("lv_0"))),
                "base_strength": js_number(row.get("lvli_0")),
                "base_constitution": js_number(row.get("gengu_0")),
                "base_physique": js_number(row.get("tipo_0")),
                "base_agility": js_number(row.get("shenfa_0")),
                "growth_strength": js_number(row.get("lvli_up")),
                "growth_constitution": js_number(row.get("gengu_up")),
                "growth_physique": js_number(row.get("tipo_up")),
                "growth_agility": js_number(row.get("shenfa_up")),
                "mining": int(js_number(row.get("wakuang"))),
                "herb_gathering": int(js_number(row.get("caiyao"))),
                "hunting": int(js_number(row.get("dalie"))),
                "forging": int(js_number(row.get("duanzao"))),
                "alchemy": int(js_number(row.get("liandan"))),
                "sewing": int(js_number(row.get("caifeng"))),
                "likes_tea": bool_int(row.get("l_cha")),
                "likes_wine": bool_int(row.get("l_jiu")),
                "likes_music": bool_int(row.get("l_qin")),
                "likes_chess": bool_int(row.get("l_qi")),
                "likes_book": bool_int(row.get("l_shu")),
                "likes_painting": bool_int(row.get("l_hua")),
                "word": word_by_name.get(name) or None,
            })
        return rows

    def build_martial_arts(self) -> list[dict[str, Any]]:
        id_by_name = character_id_lookup(self.ctx.npc_rows)
        martial_id_by_name = martial_art_id_by_internal_name(self.ctx.wugong_rows)
        missing = sorted({
            row.get("wugongname")
            for row in self.ctx.npc_martial_rows or []
            if row.get("wugongname") and row.get("wugongname") not in martial_id_by_name
        })
        if missing:
            raise RuntimeError(f"GNpcWuGong.wugongname 无法映射到 GWuGong.name：{'、'.join(missing)}")

        source_rows = [
            row for row in self.ctx.npc_martial_rows or []
            if row.get("juesename") in id_by_name and row.get("wugongname") in martial_id_by_name
        ]
        source_rows.sort(key=lambda row: (
            id_by_name[row["juesename"]],
            js_number(row.get("lv")),
            martial_id_by_name[row["wugongname"]],
        ))
        return [
            {
                "character_id": id_by_name[row["juesename"]],
                "slot": slot,
                "level": int(js_number(row.get("lv"))),
                "martial_art_id": martial_id_by_name[row["wugongname"]],
                "martial_level": int(js_number(row.get("wugonglv"))),
            }
            for slot, row in enumerate(source_rows)
        ]

    def build_attribute_snapshots(self) -> list[dict[str, Any]]:
        id_by_name = character_id_lookup(self.ctx.npc_rows)
        source_rows = [row for row in self.ctx.npc_attribute_rows or [] if row.get("juesename") in id_by_name]
        source_rows.sort(key=lambda row: js_number(row.get("lv")))
        return [
            {
                "character_id": id_by_name[row["juesename"]],
                "slot": slot,
                "level": row.get("lv"),
                "power": row.get("gongli"),
                "rank_id": row.get("dengji"),
                "position_id": row.get("diwei"),
                "strength": row.get("lvli"),
                "constitution": row.get("gengu"),
                "physique": row.get("tipo"),
                "agility": row.get("shenfa"),
                "cultivation": row.get("xiuwei"),
                "fist": row.get("quanzhang"),
                "blade_sword": row.get("daojian"),
                "spear_staff": row.get("qiangbang"),
                "hidden_weapon": row.get("anqi"),
                "internal": row.get("neigong"),
                "mining": row.get("wakuang"),
                "herb_gathering": row.get("caiyao"),
                "hunting": row.get("dalie"),
                "forging": row.get("duanzao"),
                "alchemy": row.get("liandan"),
                "sewing": row.get("caifeng"),
                "weapon": row.get("wuqiname"),
                "armor": row.get("fangjuname"),
                "fame": row.get("mingsheng"),
                "chivalry": row.get("xiayi"),
            }
            for slot, row in enumerate(source_rows)
        ]

    def resolve_quest_target(self, raw_value: Any, lookups: dict[str, Any]) -> dict[str, Any] | None:
        if not raw_value:
            return None

        location = lookups["location_by_code"].get(raw_value)
        if location:
            return {
                "target_kind": "location",
                "target_id": location.location_id,
                "target_region_id": location.region_id,
            }

        if raw_value in lookups["character_id_by_name"]:
            return {
                "target_kind": "character",
                "target_id": lookups["character_id_by_name"][raw_value],
                "target_region_id": None,
            }

        item = lookups["item_by_name"].get(raw_value)
        if item:
            return {"target_kind": "item", "target_id": item["id"], "target_region_id": None}

        if raw_value in LEGACY_SECT_TARGET_IDS:
            return {"target_kind": "sect", "target_id": LEGACY_SECT_TARGET_IDS[raw_value], "target_region_id": None}

        return {"target_kind": "unknown", "target_id": None, "target_region_id": None}

    def build_character_quest_data(self) -> dict[str, list[dict[str, Any]]]:
        character_id_by_name = character_id_lookup(self.ctx.npc_rows)
        item_by_name = build_item_lookups(self.ctx.item_rows)
        rows = [
            row for row in self.ctx.qing_yuan_rows or []
            if row.get("juesename") in character_id_by_name
        ]
        rows.sort(key=lambda row: (
            character_id_by_name[row["juesename"]],
            js_number(row.get("youhaodu")),
            js_number(row.get("index")),
        ))
        missing_rewards = sorted({
            row.get("reward") for row in rows
            if row.get("reward") and row.get("reward") not in item_by_name
        })
        if missing_rewards:
            raise RuntimeError(f"QingYuan.reward 无法映射到 GItem：{'、'.join(missing_rewards)}")

        stage_by_character: dict[int, int] = defaultdict(int)
        quests: list[dict[str, Any]] = []
        targets: list[dict[str, Any]] = []
        lookups = {
            "character_id_by_name": character_id_by_name,
            "item_by_name": item_by_name,
            "location_by_code": dict(self.ctx.location_by_code),
        }

        for sort_order, row in enumerate(rows):
            character_id = character_id_by_name[row["juesename"]]
            stage_by_character[character_id] += 1
            stage = stage_by_character[character_id]
            quest_id = int(js_number(row.get("index")))
            quests.append({
                "id": quest_id,
                "character_id": character_id,
                "stage": stage,
                "required_affinity": int(js_number(row.get("youhaodu"))),
                "quest_type_id": int(js_number(row.get("questtype"))),
                "reward_item_id": item_by_name[row["reward"]]["id"] if row.get("reward") else None,
                "sort_order": sort_order,
            })

            target_values = [
                {"role": "main", "value": row.get("missiontarget")},
                {"role": "extra", "value": row.get("strparam1")},
                {"role": "extra", "value": row.get("strparam2")},
            ]
            for slot, item in enumerate([item for item in target_values if item["value"]]):
                targets.append({
                    "quest_id": quest_id,
                    "slot": slot,
                    "target_role": item["role"],
                    **self.resolve_quest_target(item["value"], lookups),
                })
        return {"quests": quests, "targets": targets}

    def build_invitation_requirements(self) -> list[dict[str, Any]]:
        character_id_by_name = character_id_lookup(self.ctx.npc_rows)
        character_name_by_name = character_display_name_lookup(self.ctx.npc_rows)
        rows = [
            row for row in self.ctx.yaoqing_rows or []
            if row.get("juesename") in character_id_by_name
        ]
        rows.sort(key=lambda row: (
            character_id_by_name[row["juesename"]],
            js_number(row.get("index")),
        ))

        slot_by_character: dict[int, int] = defaultdict(int)
        requirements: list[dict[str, Any]] = []
        for sort_order, row in enumerate(rows):
            character_id = character_id_by_name[row["juesename"]]
            slot = slot_by_character[character_id]
            slot_by_character[character_id] += 1
            string_value = row.get("stringvalue") or None
            type_id = int(js_number(row.get("yaoqingtype")))
            if type_id == 20 and string_value:
                string_value = character_name_by_name.get(string_value, string_value)
            requirements.append({
                "character_id": character_id,
                "slot": slot,
                "legacy_name": row.get("name") or None,
                "type_id": type_id,
                "int_value": int(js_number(row.get("intvalue"))),
                "string_value": string_value,
                "sort_order": sort_order,
            })
        return requirements

    def build_locations(self) -> list[dict[str, Any]]:
        counts: dict[str, int] = defaultdict(int)
        for row in self.ctx.npc_rows:
            location = self.ctx.location_by_code.get(row.get("area")) if row.get("area") else None
            if not location:
                continue
            counts[f"{location.region_id}:{location.location_id}"] += 1

        locations = [
            location for location in self.ctx.location_by_id.values()
            if location.region_id is not None and location.location_id is not None
        ]
        locations.sort(key=lambda item: (item.region_id, item.location_id))
        return [
            {
                "region_id": location.region_id,
                "location_id": location.location_id,
                "character_count": counts.get(f"{location.region_id}:{location.location_id}", 0),
            }
            for location in locations
        ]

    def build_location_characters(self) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []
        for row in self.ctx.npc_rows:
            location = self.ctx.location_by_code.get(row.get("area")) if row.get("area") else None
            if not location:
                continue
            rows.append({
                "region_id": location.region_id,
                "location_id": location.location_id,
                "character_id": int(js_number(row.get("index"))),
            })
        rows.sort(key=lambda row: (row["region_id"], row["location_id"], row["character_id"]))
        return [{**row, "sort_order": sort_order} for sort_order, row in enumerate(rows)]

    def build_unplaced_characters(self) -> list[dict[str, Any]]:
        ids = [
            int(js_number(row.get("index")))
            for row in self.ctx.npc_rows
            if not row.get("area") or row.get("area") not in self.ctx.location_by_code
        ]
        return [
            {"character_id": character_id, "sort_order": sort_order}
            for sort_order, character_id in enumerate(sorted(ids))
        ]
