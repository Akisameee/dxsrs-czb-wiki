from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

import UnityPy


def iter_asset_files(source: Path, include_split_assets: bool = False):
    split_bases: set[Path] = set()
    normal_paths: list[Path] = []

    for path in sorted(source.iterdir()):
        if not path.is_file():
            continue
        if path.name.endswith(".resource"):
            continue

        split_match = re.match(r"(.+\.assets)\.split\d+$", path.name)
        if split_match:
            split_bases.add(source / split_match.group(1))
            continue

        normal_paths.append(path)

    existing = {path.name for path in normal_paths}
    for path in normal_paths:
        yield path

    if include_split_assets:
        for path in sorted(split_bases):
            if path.name not in existing:
                yield path


def load_unity_asset(asset_path: Path):
    split0 = asset_path.parent / f"{asset_path.name}.split0"
    if not asset_path.exists() and split0.exists():
        return UnityPy.load(str(split0))
    return UnityPy.load(str(asset_path))


def iter_objects(file: Any):
    objects = getattr(file, "objects", [])
    if isinstance(objects, dict):
        return objects.values()
    return objects


def object_by_path_id(file: Any, path_id: int):
    if file is None:
        return None

    objects = getattr(file, "objects", {})
    if isinstance(objects, dict):
        return objects.get(path_id)

    for obj in objects:
        if getattr(obj, "path_id", None) == path_id:
            return obj
    return None


def pptr_file_id(pointer: Any) -> int:
    return int(getattr(pointer, "m_FileID", getattr(pointer, "file_id", 0)) or 0)


def pptr_path_id(pointer: Any) -> int:
    return int(getattr(pointer, "m_PathID", getattr(pointer, "path_id", 0)) or 0)


def combine_path_id(low: int, high: int) -> int:
    return (high & 0xFFFFFFFF) << 32 | (low & 0xFFFFFFFF)


def source_for_file(file_id: int, root_file: Any, file_sources: dict[int, str]) -> str:
    if file_id == 0:
        return file_sources.get(id(root_file), "local")

    externals = getattr(root_file, "externals", [])
    if 0 < file_id <= len(externals):
        return externals[file_id - 1].path

    return ""


def file_for_pointer(pointer: Any, root_file: Any, file_by_id: dict[int, Any]) -> Any:
    file_id = pptr_file_id(pointer)
    if file_id == 0:
        return getattr(pointer, "assetsfile", None) or root_file
    return file_by_id.get(file_id)


def file_source(file: Any, fallback: str = "") -> str:
    name = getattr(file, "name", "") or getattr(file, "path", "")
    if name:
        return Path(str(name)).name
    return fallback


def resolve_pointer_file(pointer: Any, current_file: Any, env: Any) -> Any:
    file_id = pptr_file_id(pointer)
    if file_id == 0:
        return getattr(pointer, "assetsfile", None) or current_file

    externals = getattr(current_file, "externals", [])
    if 0 < file_id <= len(externals) and isinstance(getattr(env, "files", None), dict):
        return env.files.get(externals[file_id - 1].path)
    return None


def load_table_rows(path: Path) -> list[dict[str, Any]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, dict):
        return data.get("rows") or data.get("data") or []
    if isinstance(data, list):
        return data
    return []


def unity_root_file(env: Any):
    return next(iter(env.files.values())) if isinstance(env.files, dict) else env.files[0]


def dependency_maps(env: Any, root_file: Any, root_source: str) -> tuple[dict[int, Any], dict[int, str]]:
    file_by_id: dict[int, Any] = {0: root_file}
    file_sources: dict[int, str] = {id(root_file): root_source}

    for index, external in enumerate(getattr(root_file, "externals", []), start=1):
        file = env.files.get(external.path) if isinstance(env.files, dict) else None
        file_by_id[index] = file
        if file is not None:
            file_sources[id(file)] = external.path

    return file_by_id, file_sources
