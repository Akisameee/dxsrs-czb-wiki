from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from .ids import image_id
from .unity_assets import (
    file_source,
    load_unity_asset,
    object_by_path_id,
    pptr_path_id,
    resolve_pointer_file,
)


RESOURCE_MANAGER_FILE = "globalgamemanagers"
PORTRAIT_PART_RESOURCE_PREFIX = "texture/remake_touxiang/"


@dataclass
class ResourceTextureIndex:
    refs: dict[str, set[int]]
    image_id_by_resource_path: dict[str, str]


def normalize_resource_path(path: str) -> str:
    return path.replace("\\", "/").strip().lstrip("/").casefold()


def portrait_part_resource_textures(source: Path) -> ResourceTextureIndex:
    env = load_unity_asset(source / RESOURCE_MANAGER_FILE)
    root_file = next(iter(env.files.values())) if isinstance(env.files, dict) else env.files[0]
    root_file.load_dependencies()

    refs: dict[str, set[int]] = {}
    image_id_by_resource_path: dict[str, str] = {}

    for obj in env.objects:
        if obj.type.name != "ResourceManager":
            continue

        resource_manager = obj.read(check_read=False)
        for resource_path, pointer in resource_manager.m_Container:
            normalized_path = normalize_resource_path(str(resource_path))
            if not normalized_path.startswith(PORTRAIT_PART_RESOURCE_PREFIX):
                continue

            file = resolve_pointer_file(pointer, root_file, env)
            path_id = pptr_path_id(pointer)
            target_obj = object_by_path_id(file, path_id) if file is not None else None
            if target_obj is None or target_obj.type.name != "Texture2D":
                continue

            source_name = file_source(file)
            texture_id = image_id(source_name, path_id)
            if texture_id is None:
                continue

            refs.setdefault(source_name, set()).add(path_id)
            image_id_by_resource_path[normalized_path] = texture_id

    return ResourceTextureIndex(
        refs=refs,
        image_id_by_resource_path=image_id_by_resource_path,
    )
