from __future__ import annotations

import json
import struct
from pathlib import Path
from typing import Any

from .ids import image_id
from .paths import DEFAULT_MARTIAL_ARTS_SOURCE
from .unity_assets import (
    dependency_maps,
    file_source,
    iter_objects,
    load_table_rows,
    load_unity_asset,
    object_by_path_id,
    pptr_path_id,
    resolve_pointer_file,
    unity_root_file,
)


BATTLE_EFFECT_SCRIPT_PATH_ID = 342
HIT_ARRAY_LENGTH_OFFSET = 0x74
HIT_ARRAY_DATA_OFFSET = 0x78
PPTR_SIZE = 12
NO_EFFECT_ID = 999


def merge_texture_refs(target: dict[str, set[int]], source: dict[str, set[int]]) -> None:
    for asset, path_ids in source.items():
        target.setdefault(asset, set()).update(path_ids)


def used_slash_effect_ids(martial_arts_source: Path = DEFAULT_MARTIAL_ARTS_SOURCE) -> set[int]:
    slash_ids: set[int] = set()
    for row in load_table_rows(martial_arts_source):
        value = row.get("slashfx")
        if value in (None, ""):
            continue
        try:
            effect_id = int(float(value))
        except (TypeError, ValueError):
            continue
        if effect_id != NO_EFFECT_ID:
            slash_ids.add(effect_id)
    return slash_ids


def read_pptr(raw: bytes, offset: int) -> tuple[int, int]:
    file_id = struct.unpack_from("<i", raw, offset)[0]
    path_id = struct.unpack_from("<q", raw, offset + 4)[0]
    return file_id, path_id


def read_pptr_array(raw: bytes, length_offset: int) -> tuple[list[tuple[int, int]], int]:
    length = struct.unpack_from("<i", raw, length_offset)[0]
    data_offset = length_offset + 4
    entries = [
        read_pptr(raw, data_offset + index * PPTR_SIZE)
        for index in range(max(0, length))
    ]
    return entries, data_offset + length * PPTR_SIZE


def battle_effect_prefab_refs(source: Path, martial_arts_source: Path = DEFAULT_MARTIAL_ARTS_SOURCE) -> list[dict[str, Any]]:
    slash_ids = used_slash_effect_ids(martial_arts_source)

    scene_paths = [source / "level2", source / "level4"]
    for asset_path in [path for path in scene_paths if path.exists()]:
        try:
            env = load_unity_asset(asset_path)
            root_file = unity_root_file(env)
            root_file.load_dependencies()
        except Exception:
            continue

        for obj in iter_objects(root_file):
            if obj.type.name != "MonoBehaviour":
                continue

            try:
                data = obj.read(check_read=False)
            except Exception:
                continue

            script = getattr(data, "m_Script", None)
            if pptr_path_id(script) != BATTLE_EFFECT_SCRIPT_PATH_ID:
                continue

            raw = obj.get_raw_data()
            if len(raw) <= HIT_ARRAY_DATA_OFFSET:
                continue

            hit_prefabs, next_offset = read_pptr_array(raw, HIT_ARRAY_LENGTH_OFFSET)
            slash_prefabs, next_offset = read_pptr_array(raw, next_offset)
            next_offset += PPTR_SIZE
            special_prefabs, _ = read_pptr_array(raw, next_offset)
            file_by_id, file_sources = dependency_maps(env, root_file, asset_path.name)

            refs: list[dict[str, Any]] = []
            for effect_id in sorted(slash_ids):
                pointer = None
                array_name = "slashFXPrefabs"
                array_index = effect_id
                if 0 <= effect_id < len(slash_prefabs):
                    pointer = slash_prefabs[effect_id]
                else:
                    special_index = effect_id - len(slash_prefabs)
                    if 0 <= special_index < len(special_prefabs):
                        pointer = special_prefabs[special_index]
                        array_name = "daZhaoPrefabs"
                        array_index = special_index
                if pointer:
                    refs.append({
                        "kind": "slash",
                        "id": effect_id,
                        "array_name": array_name,
                        "array_index": array_index,
                        "pointer": pointer,
                    })

            if refs:
                for ref in refs:
                    file_id, path_id = ref["pointer"]
                    prefab_file = file_by_id.get(file_id)
                    prefab_obj = object_by_path_id(prefab_file, path_id) if prefab_file and path_id else None
                    prefab_name = None
                    if prefab_obj is not None:
                        try:
                            prefab_name = getattr(prefab_obj.read(check_read=False), "m_Name", "") or None
                        except Exception:
                            prefab_name = None
                    ref["env"] = env
                    ref["root_file"] = root_file
                    ref["root_source"] = asset_path.name
                    ref["prefab_source"] = file_sources.get(id(prefab_file), "") if prefab_file else ""
                    ref["prefab_name"] = prefab_name
                return refs

    return []


def effect_texture_refs(source: Path, martial_arts_source: Path = DEFAULT_MARTIAL_ARTS_SOURCE) -> dict[str, set[int]]:
    refs: dict[str, set[int]] = {}
    for prefab_ref in battle_effect_prefab_refs(source, martial_arts_source):
        env = prefab_ref["env"]
        root_file = prefab_ref["root_file"]
        root_source = prefab_ref["root_source"]
        file_by_id, file_sources = dependency_maps(env, root_file, root_source)
        file_id, path_id = prefab_ref["pointer"]
        prefab_file = file_by_id.get(file_id)
        if prefab_file is None or not path_id:
            continue

        merge_texture_refs(
            refs,
            prefab_texture_refs(
                env=env,
                file=prefab_file,
                path_id=path_id,
                file_sources=file_sources,
            ),
        )
    return refs


def scalar_curve_value(value: dict[str, Any] | None, fallback: float = 0) -> float:
    if not value:
        return fallback
    for key in ("scalar", "minScalar"):
        number = value.get(key)
        if isinstance(number, (int, float)):
            return float(number)
    return fallback


def nested_number(value: dict[str, Any] | None, key: str = "value", fallback: float = 0) -> float:
    if not value:
        return fallback
    number = value.get(key)
    return float(number) if isinstance(number, (int, float)) else fallback


def vector_number(value: dict[str, Any] | None, key: str, fallback: float = 0) -> float:
    if not value:
        return fallback
    number = value.get(key)
    return float(number) if isinstance(number, (int, float)) else fallback


def json_compact(value: Any) -> str | None:
    if value is None:
        return None
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def material_texture_rows(env: Any, material_file: Any, material_obj: Any, file_sources: dict[int, str]) -> list[dict[str, Any]]:
    try:
        material = material_obj.read(check_read=False)
    except Exception:
        return []

    rows: list[dict[str, Any]] = []
    properties = getattr(material, "m_SavedProperties", None)
    for item in getattr(properties, "m_TexEnvs", []) or []:
        property_name = item[0] if isinstance(item, tuple) and len(item) > 1 else ""
        tex_env = item[1] if isinstance(item, tuple) and len(item) > 1 else item
        texture_pointer = getattr(tex_env, "m_Texture", None)
        texture_file = resolve_pointer_file(texture_pointer, material_file, env) if texture_pointer else None
        texture_path_id = pptr_path_id(texture_pointer) if texture_pointer else 0
        if texture_file is None or not texture_path_id:
            continue

        texture_obj = object_by_path_id(texture_file, texture_path_id)
        if texture_obj is None or texture_obj.type.name != "Texture2D":
            continue

        try:
            texture = texture_obj.read(check_read=False)
        except Exception:
            continue

        rows.append({
            "property": property_name,
            "material_name": getattr(material, "m_Name", "") or None,
            "texture_source": file_sources.get(id(texture_file)) or file_source(texture_file),
            "texture_path_id": texture_path_id,
            "texture_name": getattr(texture, "m_Name", "") or None,
            "texture_width": int(getattr(texture, "m_Width", 0) or 0),
            "texture_height": int(getattr(texture, "m_Height", 0) or 0),
        })
    return rows


def effect_layer_rows_for_ref(ref: dict[str, Any]) -> list[dict[str, Any]]:
    env = ref["env"]
    root_file = ref["root_file"]
    root_source = ref["root_source"]
    file_by_id, file_sources = dependency_maps(env, root_file, root_source)
    file_id, path_id = ref["pointer"]
    prefab_file = file_by_id.get(file_id)
    if prefab_file is None or not path_id:
        return []

    rows: list[dict[str, Any]] = []
    seen: set[tuple[int, int]] = set()
    layer_index = 0

    def visit_game_object(game_object_path_id: int, depth: int = 0) -> None:
        nonlocal layer_index
        key = (id(prefab_file), game_object_path_id)
        if key in seen:
            return
        seen.add(key)

        game_object_obj = object_by_path_id(prefab_file, game_object_path_id)
        if game_object_obj is None:
            return

        try:
            game_object = game_object_obj.read(check_read=False)
        except Exception:
            return

        transform_path_id = 0
        particle_system_path_id = 0
        renderer_obj = None
        renderer_data = None
        particle_typetree: dict[str, Any] = {}

        for component_ref in getattr(game_object, "m_Component", []) or []:
            pointer = getattr(component_ref, "component", component_ref)
            component_obj = object_by_path_id(prefab_file, pptr_path_id(pointer))
            if component_obj is None:
                continue

            if component_obj.type.name == "Transform":
                transform_path_id = int(component_obj.path_id)
            elif component_obj.type.name == "ParticleSystem":
                particle_system_path_id = int(component_obj.path_id)
                try:
                    particle_typetree = component_obj.read_typetree()
                except Exception:
                    particle_typetree = {}
            elif component_obj.type.name.endswith("Renderer"):
                renderer_obj = component_obj
                try:
                    renderer_data = component_obj.read(check_read=False)
                except Exception:
                    renderer_data = None

        if renderer_obj is not None and renderer_data is not None:
            try:
                renderer_typetree = renderer_obj.read_typetree()
            except Exception:
                renderer_typetree = {}

            material_rows: list[dict[str, Any]] = []
            for material_pointer in getattr(renderer_data, "m_Materials", []) or []:
                material_file = resolve_pointer_file(material_pointer, prefab_file, env)
                material_path_id = pptr_path_id(material_pointer)
                material_obj = object_by_path_id(material_file, material_path_id) if material_file else None
                if material_obj is not None:
                    material_rows.extend(material_texture_rows(env, material_file, material_obj, file_sources))

            material_pointer = getattr(renderer_data, "m_Material", None)
            material_file = resolve_pointer_file(material_pointer, prefab_file, env) if material_pointer else None
            material_path_id = pptr_path_id(material_pointer) if material_pointer else 0
            material_obj = object_by_path_id(material_file, material_path_id) if material_file else None
            if material_obj is not None:
                material_rows.extend(material_texture_rows(env, material_file, material_obj, file_sources))

            uv = particle_typetree.get("UVModule") or {}
            initial = particle_typetree.get("InitialModule") or {}
            shape_module = particle_typetree.get("ShapeModule") or {}
            size_module = particle_typetree.get("SizeModule") or {}
            color_module = particle_typetree.get("ColorModule") or {}
            rotation_module = particle_typetree.get("RotationModule") or {}
            emission_module = particle_typetree.get("EmissionModule") or {}
            velocity_module = particle_typetree.get("VelocityModule") or {}
            force_module = particle_typetree.get("ForceModule") or {}
            duration = float(particle_typetree.get("lengthInSec") or 0)
            simulation_speed = float(particle_typetree.get("simulationSpeed") or 1)
            looping = bool(particle_typetree.get("looping"))
            tiles_x = int(uv.get("tilesX") or 1)
            tiles_y = int(uv.get("tilesY") or 1)
            frame_count = max(1, tiles_x * tiles_y)
            uv_enabled = bool(uv.get("enabled"))
            row_mode = int(uv.get("rowMode") or 0)
            row_index = int(uv.get("rowIndex") or 0)
            fps = float(uv.get("fps") or 0)
            cycles = float(uv.get("cycles") or 1)
            start_frame = scalar_curve_value(uv.get("startFrame"), 0)
            frame_curve = uv.get("frameOverTime")
            start_size = scalar_curve_value(initial.get("startSize"), 1)
            start_lifetime = scalar_curve_value(initial.get("startLifetime"), duration or 1)
            start_speed = scalar_curve_value(initial.get("startSpeed"), 0)
            start_rotation = scalar_curve_value(initial.get("startRotation"), 0)
            gravity_modifier = scalar_curve_value(initial.get("gravityModifier"), 0)
            max_particles = int(initial.get("maxNumParticles") or 0)
            size_curve = size_module.get("curve") if size_module.get("enabled") else None
            color_gradient = color_module.get("gradient") if color_module.get("enabled") else None
            rotation_curve = rotation_module.get("curve") if rotation_module.get("enabled") else None
            burst_count = int(emission_module.get("m_BurstCount") or 0)
            emission_rate = scalar_curve_value(emission_module.get("rateOverTime"), 0)
            shape_position = shape_module.get("m_Position") or {}
            shape_rotation = shape_module.get("m_Rotation") or {}
            shape_scale = shape_module.get("m_Scale") or {}
            sort_order = int(renderer_typetree.get("m_SortingOrder") or 0)

            seen_textures: set[tuple[str, int]] = set()
            for texture_slot, material_row in enumerate(material_rows):
                texture_key = (material_row["texture_source"], int(material_row["texture_path_id"]))
                if texture_key in seen_textures:
                    continue
                seen_textures.add(texture_key)
                rows.append({
                    "kind": ref["kind"],
                    "effect_id": ref["id"],
                    "layer_index": layer_index,
                    "texture_slot": texture_slot,
                    "game_object_name": getattr(game_object, "m_Name", "") or None,
                    "depth": depth,
                    "particle_system_path_id": particle_system_path_id or None,
                    "renderer_path_id": int(renderer_obj.path_id),
                    "renderer_type": renderer_obj.type.name,
                    "sorting_order": sort_order,
                    "material_name": material_row["material_name"],
                    "texture_property": material_row["property"],
                    "texture_source": material_row["texture_source"],
                    "texture_path_id": material_row["texture_path_id"],
                    "image_id": image_id(material_row["texture_source"], material_row["texture_path_id"]),
                    "texture_name": material_row["texture_name"],
                    "texture_width": material_row["texture_width"],
                    "texture_height": material_row["texture_height"],
                    "duration": duration,
                    "simulation_speed": simulation_speed,
                    "looping": int(looping),
                    "uv_enabled": int(uv_enabled),
                    "tiles_x": tiles_x,
                    "tiles_y": tiles_y,
                    "frame_count": frame_count,
                    "fps": fps,
                    "cycles": cycles,
                    "row_mode": row_mode,
                    "row_index": row_index,
                    "start_frame": start_frame,
                    "frame_curve": json_compact(frame_curve),
                    "start_size": start_size,
                    "start_lifetime": start_lifetime,
                    "start_lifetime_curve": json_compact(initial.get("startLifetime")),
                    "start_speed": start_speed,
                    "start_speed_curve": json_compact(initial.get("startSpeed")),
                    "start_color": json_compact(initial.get("startColor")),
                    "start_rotation": start_rotation,
                    "gravity_modifier": gravity_modifier,
                    "gravity_modifier_curve": json_compact(initial.get("gravityModifier")),
                    "max_particles": max_particles or None,
                    "size_curve": json_compact(size_curve),
                    "color_gradient": json_compact(color_gradient),
                    "rotation_enabled": int(bool(rotation_curve)),
                    "rotation_curve": json_compact(rotation_curve),
                    "burst_count": burst_count,
                    "emission_rate": emission_rate,
                    "emission_rate_curve": json_compact(emission_module.get("rateOverTime")),
                    "emission_bursts": json_compact(emission_module.get("m_Bursts")),
                    "shape_enabled": int(bool(shape_module.get("enabled"))),
                    "shape_type": int(shape_module.get("type") or 0),
                    "shape_angle": float(shape_module.get("angle") or 0),
                    "shape_radius": nested_number(shape_module.get("radius")),
                    "shape_arc": nested_number(shape_module.get("arc"), fallback=360),
                    "shape_length": float(shape_module.get("length") or 0),
                    "shape_position_x": vector_number(shape_position, "x"),
                    "shape_position_y": vector_number(shape_position, "y"),
                    "shape_position_z": vector_number(shape_position, "z"),
                    "shape_rotation_x": vector_number(shape_rotation, "x"),
                    "shape_rotation_y": vector_number(shape_rotation, "y"),
                    "shape_rotation_z": vector_number(shape_rotation, "z"),
                    "shape_scale_x": vector_number(shape_scale, "x", 1),
                    "shape_scale_y": vector_number(shape_scale, "y", 1),
                    "shape_scale_z": vector_number(shape_scale, "z", 1),
                    "random_direction_amount": float(shape_module.get("randomDirectionAmount") or 0),
                    "spherical_direction_amount": float(shape_module.get("sphericalDirectionAmount") or 0),
                    "random_position_amount": float(shape_module.get("randomPositionAmount") or 0),
                    "velocity_enabled": int(bool(velocity_module.get("enabled"))),
                    "velocity_x": json_compact(velocity_module.get("x")),
                    "velocity_y": json_compact(velocity_module.get("y")),
                    "velocity_z": json_compact(velocity_module.get("z")),
                    "velocity_radial": json_compact(velocity_module.get("radial")),
                    "velocity_orbital_x": json_compact(velocity_module.get("orbitalX")),
                    "velocity_orbital_y": json_compact(velocity_module.get("orbitalY")),
                    "velocity_orbital_z": json_compact(velocity_module.get("orbitalZ")),
                    "force_enabled": int(bool(force_module.get("enabled"))),
                    "force_x": json_compact(force_module.get("x")),
                    "force_y": json_compact(force_module.get("y")),
                    "force_z": json_compact(force_module.get("z")),
                })
            layer_index += 1

        if transform_path_id:
            try:
                transform = object_by_path_id(prefab_file, transform_path_id).read(check_read=False)
            except Exception:
                return

            for child_pointer in getattr(transform, "m_Children", []) or []:
                child_transform = object_by_path_id(prefab_file, pptr_path_id(child_pointer))
                if child_transform is None:
                    continue
                try:
                    child_transform_data = child_transform.read(check_read=False)
                except Exception:
                    continue
                child_game_object = getattr(child_transform_data, "m_GameObject", None)
                if child_game_object:
                    visit_game_object(pptr_path_id(child_game_object), depth + 1)

    visit_game_object(path_id)
    return sorted(rows, key=lambda item: (item["sorting_order"], item["layer_index"], item["texture_slot"]))


def build_effect_assets(source: Path, martial_arts_source: Path = DEFAULT_MARTIAL_ARTS_SOURCE) -> dict[str, list[dict[str, Any]]]:
    effects: list[dict[str, Any]] = []
    layers: list[dict[str, Any]] = []

    for ref in battle_effect_prefab_refs(source, martial_arts_source):
        file_id, path_id = ref["pointer"]
        layer_rows = effect_layer_rows_for_ref(ref)
        primary = primary_effect_layer(layer_rows)
        duration = max((float(row["duration"] or 0) for row in layer_rows), default=0)

        effects.append({
            "kind": ref["kind"],
            "effect_id": ref["id"],
            "array_name": ref.get("array_name"),
            "array_index": ref.get("array_index"),
            "prefab_source": ref.get("prefab_source"),
            "prefab_path_id": path_id,
            "prefab_name": ref.get("prefab_name"),
            "primary_texture_source": primary.get("texture_source") if primary else None,
            "primary_texture_path_id": primary.get("texture_path_id") if primary else None,
            "image_id": image_id(
                primary.get("texture_source") if primary else None,
                primary.get("texture_path_id") if primary else None,
            ),
            "primary_texture_name": primary.get("texture_name") if primary else None,
            "duration": duration,
            "layer_count": len({row["layer_index"] for row in layer_rows}),
        })

        layers.extend(layer_rows)

    return {"asset_effects": effects, "asset_effect_layers": layers}


def primary_effect_layer(rows: list[dict[str, Any]]) -> dict[str, Any] | None:
    if not rows:
        return None

    def score(row: dict[str, Any]) -> tuple[int, int, int, int]:
        area = int(row.get("texture_width") or 0) * int(row.get("texture_height") or 0)
        return (
            1 if row.get("uv_enabled") else 0,
            int(row.get("frame_count") or 1),
            area,
            -int(row.get("layer_index") or 0),
        )

    return sorted(rows, key=score, reverse=True)[0]


def prefab_texture_refs(
    *,
    env: Any,
    file: Any,
    path_id: int,
    file_sources: dict[int, str],
) -> dict[str, set[int]]:
    refs: dict[str, set[int]] = {}
    seen: set[tuple[int, int]] = set()

    def add_texture_pointer(pointer: Any, current_file: Any) -> None:
        texture_file = resolve_pointer_file(pointer, current_file, env)
        texture_path_id = pptr_path_id(pointer)
        if texture_file is None or not texture_path_id:
            return
        texture_obj = object_by_path_id(texture_file, texture_path_id)
        if texture_obj is None or texture_obj.type.name != "Texture2D":
            return
        source_name = file_sources.get(id(texture_file)) or file_source(texture_file)
        refs.setdefault(source_name, set()).add(texture_path_id)

    def visit_pointer(pointer: Any, current_file: Any) -> None:
        target_file = resolve_pointer_file(pointer, current_file, env)
        target_path_id = pptr_path_id(pointer)
        if target_file is None or not target_path_id:
            return
        visit_object(target_file, target_path_id)

    def visit_material(material_file: Any, material_path_id: int) -> None:
        material_obj = object_by_path_id(material_file, material_path_id)
        if material_obj is None:
            return
        try:
            material = material_obj.read(check_read=False)
        except Exception:
            return

        properties = getattr(material, "m_SavedProperties", None)
        for item in getattr(properties, "m_TexEnvs", []) or []:
            tex_env = item[1] if isinstance(item, tuple) and len(item) > 1 else item
            texture_pointer = getattr(tex_env, "m_Texture", None)
            if texture_pointer:
                add_texture_pointer(texture_pointer, material_file)

    def visit_sprite(sprite_file: Any, sprite_path_id: int) -> None:
        sprite_obj = object_by_path_id(sprite_file, sprite_path_id)
        if sprite_obj is None:
            return
        try:
            sprite = sprite_obj.read(check_read=False)
        except Exception:
            return
        render_data = getattr(sprite, "m_RD", None)
        texture_pointer = getattr(render_data, "texture", None) if render_data else None
        if texture_pointer:
            add_texture_pointer(texture_pointer, sprite_file)

    def visit_renderer(component: Any, component_file: Any) -> None:
        for pointer in getattr(component, "m_Materials", []) or []:
            material_file = resolve_pointer_file(pointer, component_file, env)
            material_path_id = pptr_path_id(pointer)
            if material_file is not None and material_path_id:
                visit_material(material_file, material_path_id)

        material_pointer = getattr(component, "m_Material", None)
        if material_pointer:
            material_file = resolve_pointer_file(material_pointer, component_file, env)
            material_path_id = pptr_path_id(material_pointer)
            if material_file is not None and material_path_id:
                visit_material(material_file, material_path_id)

        sprite_pointer = getattr(component, "m_Sprite", None)
        if sprite_pointer:
            sprite_file = resolve_pointer_file(sprite_pointer, component_file, env)
            sprite_path_id = pptr_path_id(sprite_pointer)
            if sprite_file is not None and sprite_path_id:
                visit_sprite(sprite_file, sprite_path_id)

    def visit_transform(transform: Any, transform_file: Any) -> None:
        for child in getattr(transform, "m_Children", []) or []:
            child_file = resolve_pointer_file(child, transform_file, env)
            child_path_id = pptr_path_id(child)
            child_obj = object_by_path_id(child_file, child_path_id) if child_file else None
            if child_obj is None:
                continue
            try:
                child_transform = child_obj.read(check_read=False)
            except Exception:
                continue
            game_object_pointer = getattr(child_transform, "m_GameObject", None)
            if game_object_pointer:
                visit_pointer(game_object_pointer, child_file)

    def visit_game_object(game_object: Any, game_object_file: Any) -> None:
        for component_ref in getattr(game_object, "m_Component", []) or []:
            component_pointer = getattr(component_ref, "component", component_ref)
            component_file = resolve_pointer_file(component_pointer, game_object_file, env)
            component_path_id = pptr_path_id(component_pointer)
            component_obj = object_by_path_id(component_file, component_path_id) if component_file else None
            if component_obj is None:
                continue
            visit_object(component_file, component_path_id)

    def visit_object(current_file: Any, current_path_id: int) -> None:
        key = (id(current_file), current_path_id)
        if key in seen:
            return
        seen.add(key)

        obj = object_by_path_id(current_file, current_path_id)
        if obj is None:
            return

        try:
            data = obj.read(check_read=False)
        except Exception:
            return

        if obj.type.name == "GameObject":
            visit_game_object(data, current_file)
        elif obj.type.name == "Transform":
            visit_transform(data, current_file)
        elif obj.type.name == "Sprite":
            visit_sprite(current_file, current_path_id)
        elif obj.type.name == "Material":
            visit_material(current_file, current_path_id)
        elif obj.type.name.endswith("Renderer"):
            visit_renderer(data, current_file)

    visit_object(file, path_id)
    return refs
