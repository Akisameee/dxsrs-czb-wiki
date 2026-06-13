from __future__ import annotations

import argparse
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .unity_assets import iter_asset_files, load_unity_asset


@dataclass
class TextureExport:
    name: str
    file_stem: str
    source: str
    path_id: int
    image: Any
    texture_width: int
    texture_height: int
    original_texture_width: int
    original_texture_height: int
    texture_format: str
    scale: float
    trim: dict[str, Any]


@dataclass
class ExtractResult:
    textures: list[TextureExport]
    skipped: int
    failures: list[dict[str, Any]]


def safe_filename(value: str) -> str:
    name = value.strip() or "unnamed"
    name = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "_", name)
    return name.rstrip(". ") or "unnamed"


def normalize_scale(value: str) -> float:
    scale = float(value)
    if scale <= 0 or scale > 1:
        raise argparse.ArgumentTypeError("scale must be greater than 0 and less than or equal to 1")
    return scale


def scaled_int(value: int | float, scale: float) -> int:
    return max(1, int(round(value * scale)))


def collect_textures(
    source: Path,
    targets: set[str],
    trim_transparent: bool,
    texture_refs: dict[str, set[int]] | None = None,
    texture_scales: dict[str, dict[int, float]] | None = None,
    scale: float = 1,
) -> ExtractResult:
    textures: list[TextureExport] = []
    seen_names: dict[str, int] = {}
    skipped = 0
    failures: list[dict[str, Any]] = []
    remaining_targets = set(targets)

    include_split_assets = bool(texture_refs)
    for asset_path in iter_asset_files(source, include_split_assets=include_split_assets):
        source_name = asset_path.name
        source_refs = (texture_refs or {}).get(source_name)
        if texture_refs is not None and not source_refs and not remaining_targets:
            continue

        try:
            env = load_unity_asset(asset_path)
        except Exception:
            continue

        for obj in env.objects:
            if obj.type.name != "Texture2D":
                continue

            try:
                path_id = int(getattr(obj, "path_id", 0))
                is_referenced_texture = source_refs is not None and path_id in source_refs
                if texture_refs is not None and source_refs is not None and not is_referenced_texture:
                    continue

                texture = obj.read(check_read=False)
                name = getattr(texture, "m_Name", "")
                if targets and name not in targets and not is_referenced_texture:
                    continue
                if name in remaining_targets:
                    remaining_targets.remove(name)

                original_texture_width = int(getattr(texture, "m_Width", 0))
                original_texture_height = int(getattr(texture, "m_Height", 0))
                if original_texture_width <= 0 or original_texture_height <= 0:
                    skipped += 1
                    continue

                image = texture.image
                trim = {
                    "x": 0,
                    "y": 0,
                    "width": image.width,
                    "height": image.height,
                    "trimmed": False,
                }
                if trim_transparent:
                    bbox = image.getbbox()
                    if bbox:
                        left, top, right, bottom = bbox
                        image = image.crop(bbox)
                        trim = {
                            "x": left,
                            "y": top,
                            "width": right - left,
                            "height": bottom - top,
                            "trimmed": True,
                        }

                texture_scale = (texture_scales or {}).get(source_name, {}).get(path_id, scale)
                if texture_scale != 1:
                    image = image.resize(
                        (scaled_int(image.width, texture_scale), scaled_int(image.height, texture_scale)),
                        resample=1,
                    )
                    trim = {
                        "x": scaled_int(trim["x"], texture_scale) if trim["x"] else 0,
                        "y": scaled_int(trim["y"], texture_scale) if trim["y"] else 0,
                        "width": image.width,
                        "height": image.height,
                        "trimmed": trim["trimmed"],
                    }

                duplicate_index = seen_names.get(name, 0)
                seen_names[name] = duplicate_index + 1

                filename = safe_filename(name)
                if duplicate_index:
                    filename = f"{filename}-{duplicate_index + 1}"

                textures.append(
                    TextureExport(
                        name=name,
                        file_stem=filename,
                        source=source_name,
                        path_id=path_id,
                        image=image,
                        texture_width=scaled_int(original_texture_width, texture_scale),
                        texture_height=scaled_int(original_texture_height, texture_scale),
                        original_texture_width=original_texture_width,
                        original_texture_height=original_texture_height,
                        texture_format=str(getattr(texture, "m_TextureFormat", "")),
                        scale=texture_scale,
                        trim=trim,
                    )
                )
            except Exception as exc:
                failures.append(
                    {
                        "source": asset_path.name,
                        "pathId": getattr(obj, "path_id", None),
                        "error": str(exc),
                    }
                )

    return ExtractResult(textures=textures, skipped=skipped, failures=failures)
