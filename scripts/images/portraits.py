from __future__ import annotations

import json
import struct
from pathlib import Path
from typing import Any

from .image_export import (
    combine_path_id,
    file_for_pointer,
    iter_asset_files,
    iter_objects,
    load_table_rows,
    load_unity_asset,
    object_by_path_id,
    pptr_path_id,
    source_for_file,
)


PORTRAIT_LAYER_ORDER = {
    "头发后下": 0,
    "头发后上": 1,
    "武器": 2,
    "发饰-后": 3,
    "脸": 4,
    "皱纹": 5,
    "眼睛": 6,
    "嘴巴": 7,
    "眉毛": 8,
    "衣服": 9,
    "胡子": 10,
    "胡子下": 11,
    "头发": 12,
    "发饰-前": 13,
}


def read_image_color(raw: bytes) -> dict[str, float]:
    if len(raw) < 60:
        return {"r": 1, "g": 1, "b": 1, "a": 1}

    r, g, b, a = struct.unpack("<ffff", raw[44:60])
    return {"r": r, "g": g, "b": b, "a": a}


def find_portrait_prefab_files(source: Path, portrait_names: set[str]) -> dict[str, str]:
    found: dict[str, str] = {}
    remaining = set(portrait_names)

    for asset_path in iter_asset_files(source):
        if not remaining:
            break

        try:
            env = load_unity_asset(asset_path)
        except Exception:
            continue

        for obj in env.objects:
            if obj.type.name != "GameObject":
                continue

            try:
                game_object = obj.read(check_read=False)
            except Exception:
                continue

            name = getattr(game_object, "m_Name", "")
            if name in remaining:
                found[name] = asset_path.name
                remaining.remove(name)

    return found


def extract_portrait_layers(source: Path, portraits_source: Path) -> dict[str, Any]:
    portrait_names = {
        row.get("touxiang")
        for row in load_table_rows(portraits_source)
        if row.get("touxiang")
    }
    prefab_files = find_portrait_prefab_files(source, portrait_names)

    prefabs: list[dict[str, Any]] = []
    layers: list[dict[str, Any]] = []
    failures: list[dict[str, Any]] = []

    for portrait_name, asset_name in sorted(prefab_files.items()):
        asset_path = source / asset_name
        try:
            env = load_unity_asset(asset_path)
            root_file = next(iter(env.files.values())) if isinstance(env.files, dict) else env.files[0]
            root_file.load_dependencies()
        except Exception as exc:
            failures.append({"portrait": portrait_name, "source": asset_name, "error": str(exc)})
            continue

        game_objects: dict[int, Any] = {}
        for obj in iter_objects(root_file):
            if obj.type.name != "GameObject":
                continue
            try:
                game_objects[obj.path_id] = obj.read(check_read=False)
            except Exception:
                pass

        file_by_id: dict[int, Any] = {0: root_file}
        file_sources: dict[int, str] = {id(root_file): asset_name}
        for index, external in enumerate(getattr(root_file, "externals", []), start=1):
            file = env.files.get(external.path) if isinstance(env.files, dict) else None
            file_by_id[index] = file
            if file is not None:
                file_sources[id(file)] = external.path

        portrait_layers: list[dict[str, Any]] = []
        for obj in iter_objects(root_file):
            if obj.type.name != "MonoBehaviour":
                continue

            raw = obj.get_raw_data()
            if len(raw) < 100:
                continue

            ints = struct.unpack("<" + "i" * (len(raw) // 4), raw[: (len(raw) // 4) * 4])
            if len(ints) <= 24 or ints[4] != 1 or ints[5] != 1529:
                continue

            slot = getattr(game_objects.get(ints[1]), "m_Name", "") or ""
            sprite_file_id = int(ints[22])
            sprite_path_id = combine_path_id(ints[23], ints[24])
            color = read_image_color(raw)
            active = bool(getattr(game_objects.get(ints[1]), "m_IsActive", True))

            layer = {
                "portrait": portrait_name,
                "source": asset_name,
                "slot": slot,
                "sort_order": PORTRAIT_LAYER_ORDER.get(slot, len(portrait_layers)),
                "image_path_id": int(obj.path_id),
                "sprite_source": source_for_file(sprite_file_id, root_file, file_sources),
                "sprite_path_id": sprite_path_id or None,
                "texture_source": None,
                "texture_path_id": None,
                "texture_name": None,
                "texture_width": None,
                "texture_height": None,
                "color_r": color["r"],
                "color_g": color["g"],
                "color_b": color["b"],
                "color_a": color["a"],
                "active": active,
            }

            if sprite_path_id:
                sprite_file = file_by_id.get(sprite_file_id)
                sprite_obj = object_by_path_id(sprite_file, sprite_path_id)
                if sprite_obj is not None:
                    try:
                        sprite = sprite_obj.read(check_read=False)
                        render_data = getattr(sprite, "m_RD", None)
                        texture_pointer = getattr(render_data, "texture", None) if render_data else None
                        if texture_pointer:
                            texture_file = file_for_pointer(texture_pointer, sprite_file, file_by_id)
                            texture_path_id = pptr_path_id(texture_pointer)
                            texture_obj = object_by_path_id(texture_file, texture_path_id)
                            layer["texture_source"] = file_sources.get(
                                id(texture_file),
                                layer["sprite_source"],
                            )
                            layer["texture_path_id"] = texture_path_id or None

                            if texture_obj is not None:
                                texture = texture_obj.read(check_read=False)
                                layer["texture_name"] = getattr(texture, "m_Name", None)
                                layer["texture_width"] = getattr(texture, "m_Width", None)
                                layer["texture_height"] = getattr(texture, "m_Height", None)
                    except Exception as exc:
                        failures.append(
                            {
                                "portrait": portrait_name,
                                "source": asset_name,
                                "slot": slot,
                                "error": str(exc),
                            }
                        )

            portrait_layers.append(layer)

        portrait_layers.sort(key=lambda item: (item["sort_order"], item["image_path_id"]))
        is_layered = len(portrait_layers) > 1
        for index, layer in enumerate(portrait_layers):
            if not is_layered:
                layer["sort_order"] = index
            layers.append(layer)

        prefabs.append(
            {
                "name": portrait_name,
                "source": asset_name,
                "layer_count": len(portrait_layers),
                "is_layered": is_layered,
            }
        )

    return {
        "prefabs": prefabs,
        "layers": layers,
        "missing": sorted(portrait_names - set(prefab_files)),
        "failures": failures,
    }


def portrait_texture_refs(source: Path, portraits_source: Path) -> dict[str, set[int]]:
    data = extract_portrait_layers(source, portraits_source)
    refs: dict[str, set[int]] = {}
    for layer in data["layers"]:
        texture_source = layer.get("texture_source")
        texture_path_id = layer.get("texture_path_id")
        if not texture_source or texture_path_id is None:
            continue
        refs.setdefault(texture_source, set()).add(int(texture_path_id))
    return refs
