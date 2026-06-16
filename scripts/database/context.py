from __future__ import annotations

from dataclasses import dataclass
import locale
from pathlib import Path
from typing import Any

from .bgdatabase import extract_tables
from .paths import DEFAULT_MERIDIAN_TABLE_JSON
from .utils import js_number, load_json, table_by_name


@dataclass
class LocationRef:
    region_id: int | None
    location_id: int
    location_code: str


def build_location_lookups(area_rows: list[dict[str, Any]]) -> tuple[dict[str, LocationRef], dict[int, LocationRef]]:
    location_by_code: dict[str, LocationRef] = {}
    location_by_id: dict[int, LocationRef] = {}
    for row in area_rows or []:
        if not row.get("name"):
            continue
        region = js_number(row.get("didian"))
        location = LocationRef(
            region_id=int(region) if region == region and region not in (float("inf"), float("-inf")) else None,
            location_id=int(js_number(row.get("index"))),
            location_code=row["name"],
        )
        location_by_code[row["name"]] = location
        location_by_id[location.location_id] = location
    return location_by_code, location_by_id


def attack_area_lookups(wugong_rows: list[dict[str, Any]]) -> tuple[dict[str, int], list[dict[str, Any]]]:
    try:
        locale.setlocale(locale.LC_COLLATE, "zh_CN.UTF-8")
        key = locale.strxfrm
    except locale.Error:
        key = str
    names = sorted(
        {row.get("attackareaname") for row in wugong_rows or [] if row.get("attackareaname")},
        key=key,
    )
    attack_area_by_name = {name: index for index, name in enumerate(names)}
    attack_area_enums = [
        {"type": "AttackArea", "id": index, "label": name}
        for index, name in enumerate(names)
    ]
    return attack_area_by_name, attack_area_enums


@dataclass
class BuildContext:
    source: Path
    enum_source: Path
    extracted: list[dict[str, Any]]
    wugong_rows: list[dict[str, Any]]
    wugong_detail_rows: list[dict[str, Any]]
    chain_rows: list[dict[str, Any]]
    custom_power_rows: list[dict[str, Any]]
    custom_buff_rows: list[dict[str, Any]]
    meridian_rows: list[dict[str, Any]]
    npc_rows: list[dict[str, Any]]
    area_rows: list[dict[str, Any]]
    npc_martial_rows: list[dict[str, Any]]
    npc_attribute_rows: list[dict[str, Any]]
    npc_word_rows: list[dict[str, Any]]
    qing_yuan_rows: list[dict[str, Any]]
    item_rows: list[dict[str, Any]]
    portrait_part_rows: list[dict[str, Any]]
    portrait_option_rows: list[dict[str, Any]]
    portrait_weapon_rows: list[dict[str, Any]]
    location_by_code: dict[str, LocationRef]
    location_by_id: dict[int, LocationRef]
    attack_area_by_name: dict[str, int]
    attack_area_enums: list[dict[str, Any]]
    enum_types: dict[str, dict[Any, Any]]
    image_id_by_name: dict[str, str]
    image_id_by_resource_path: dict[str, str]

    @classmethod
    def from_source(
        cls,
        source: Path,
        enum_source: Path,
        image_id_by_name: dict[str, str] | None = None,
        image_id_by_resource_path: dict[str, str] | None = None,
    ) -> "BuildContext":
        if not source.exists():
            raise RuntimeError(f"找不到原始数据库文件：{source}")
        extracted = extract_tables(source)
        wugong_rows = table_by_name(extracted, "GWuGong")
        area_rows = table_by_name(extracted, "Area")
        chain_rows = table_by_name(extracted, "GLianSuo")
        meridian_rows = load_json(DEFAULT_MERIDIAN_TABLE_JSON).get("rows") or []
        location_by_code, location_by_id = build_location_lookups(area_rows)
        attack_area_by_name, attack_area_enums = attack_area_lookups(wugong_rows)

        from .builders.enums import build_enum_types

        enum_types = build_enum_types(enum_source=enum_source, area_rows=area_rows, chain_rows=chain_rows)
        if image_id_by_name is None:
            image_id_by_name = {}
        if image_id_by_resource_path is None:
            image_id_by_resource_path = {}
        return cls(
            source=source,
            enum_source=enum_source,
            extracted=extracted,
            wugong_rows=wugong_rows,
            wugong_detail_rows=table_by_name(extracted, "GWuGongDetail"),
            chain_rows=chain_rows,
            custom_power_rows=table_by_name(extracted, "GZiChuangWeiLi"),
            custom_buff_rows=table_by_name(extracted, "GZiChuangBuff"),
            meridian_rows=meridian_rows,
            npc_rows=table_by_name(extracted, "Npc"),
            area_rows=area_rows,
            npc_martial_rows=table_by_name(extracted, "GNpcWuGong"),
            npc_attribute_rows=table_by_name(extracted, "GNpcAttribute"),
            npc_word_rows=table_by_name(extracted, "NPC_Word"),
            qing_yuan_rows=table_by_name(extracted, "QingYuan"),
            item_rows=table_by_name(extracted, "GItem"),
            portrait_part_rows=table_by_name(extracted, "RemakeTouXiangParts"),
            portrait_option_rows=table_by_name(extracted, "RemakeTouXiangBuWei"),
            portrait_weapon_rows=table_by_name(extracted, "RemakeTouXiangWuQi"),
            location_by_code=location_by_code,
            location_by_id=location_by_id,
            attack_area_by_name=attack_area_by_name,
            attack_area_enums=attack_area_enums,
            enum_types=enum_types,
            image_id_by_name=image_id_by_name,
            image_id_by_resource_path=image_id_by_resource_path,
        )
