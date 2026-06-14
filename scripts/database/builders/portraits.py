from __future__ import annotations

from typing import Any

from scripts.images.ids import image_id
from scripts.images.portraits import extract_portrait_layers
from scripts.images.resources import normalize_resource_path

from ..paths import DEFAULT_NPC_TABLE_JSON
from ..utils import bool_int, json_list, js_number


class PortraitBuilder:
    def __init__(self, ctx):
        self.ctx = ctx
        self._prefab_data: dict[str, Any] | None = None

    def rows(self) -> dict[str, list[dict[str, Any]]]:
        prefab_data = self.prefab_data
        return {
            "portrait_part_assets": self.build_part_assets(),
            "portrait_part_options": self.build_part_options(),
            "portrait_weapon_parts": self.build_weapon_parts(),
            "portrait_prefabs": self.build_prefabs(prefab_data.get("prefabs") or []),
            "portrait_prefab_layers": self.build_prefab_layers(prefab_data.get("layers") or []),
        }

    @property
    def prefab_data(self) -> dict[str, Any]:
        if self._prefab_data is None:
            data = extract_portrait_layers(self.ctx.source.parent, DEFAULT_NPC_TABLE_JSON)
            if data.get("missing") or data.get("failures"):
                raise RuntimeError(
                    f"头像 prefab 解析不完整：missing={len(data.get('missing') or [])}, "
                    f"failures={len(data.get('failures') or [])}"
                )
            self._prefab_data = data
        return self._prefab_data

    def build_part_assets(self) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []
        for row in self.ctx.portrait_part_rows:
            if not row.get("name") or not row.get("path"):
                continue
            resource_path = normalize_resource_path(f"texture/{row['path']}")
            rows.append({
                "name": row["name"],
                "image_id": self.ctx.image_id_by_resource_path.get(resource_path),
                "slot_id": int(js_number(row.get("weizhi"))),
                "sex": row.get("sex") or None,
                "parent": row.get("parent") or None,
            })
        return rows

    def build_part_options(self) -> list[dict[str, Any]]:
        return [
            {
                "name": row["name"],
                "display_name": row.get("showname") or None,
                "type_id": int(js_number(row.get("type"))),
                "sex_id": int(js_number(row.get("sex"))),
                "has_white": bool_int(row.get("has_white")),
                "normal_parts": json_list(row.get("normal_parts")),
                "white_parts": json_list(row.get("white_parts")),
                "is_player": bool_int(row.get("is_zhujue")),
                "sect_id": int(js_number(row.get("menpai"))),
                "sect_level": int(js_number(row.get("menpai_lv"))),
                "sort_order": int(js_number(row.get("index"))),
                "is_default": bool_int(row.get("isdefault")),
            }
            for row in self.ctx.portrait_option_rows
            if row.get("name")
        ]

    def build_weapon_parts(self) -> list[dict[str, Any]]:
        return [
            {
                "id": int(js_number(row.get("index"))),
                "name": row.get("name") or None,
                "sect_id": int(js_number(row.get("menpai"))),
                "sex_id": int(js_number(row.get("sex"))),
                "weapon_type_id": int(js_number(row.get("bingqi"))),
                "part_name": row.get("buwei") or "",
            }
            for row in self.ctx.portrait_weapon_rows
        ]

    def build_prefabs(self, prefabs: list[dict[str, Any]]) -> list[dict[str, Any]]:
        return [
            {
                "name": row["name"],
                "layer_count": int(js_number(row.get("layer_count"))),
                "is_layered": bool_int(row.get("is_layered")),
            }
            for row in prefabs or []
        ]

    def build_prefab_layers(self, layers: list[dict[str, Any]]) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []
        for row in layers or []:
            rows.append({
                "portrait": row["portrait"],
                "slot": row["slot"],
                "sort_order": int(js_number(row.get("sort_order"))),
                "image_id": image_id(row.get("texture_source"), row.get("texture_path_id")),
                "color_r": js_number(row.get("color_r")),
                "color_g": js_number(row.get("color_g")),
                "color_b": js_number(row.get("color_b")),
                "color_a": js_number(row.get("color_a")),
                "active": bool_int(row.get("active")),
            })
        return rows
