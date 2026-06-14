from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .atlas import export_atlas
from .paths import (
    DEFAULT_CHAINS_SOURCE,
    DEFAULT_ITEMS_SOURCE,
    DEFAULT_MARTIAL_ARTS_SOURCE,
    DEFAULT_OUTPUT,
    DEFAULT_PORTRAITS_SOURCE,
    DEFAULT_SOURCE,
)
from .targets import build_texture_targets
from .textures import collect_textures


@dataclass
class ImageBuildResult:
    exported: int
    skipped: int
    failed: int
    texture_count: int
    manifest: Path
    image_index: list[dict[str, Any]]
    image_id_by_resource_path: dict[str, str]


def image_id_by_unique_name(rows: list[dict[str, Any]]) -> dict[str, str]:
    ids_by_name: dict[str, list[str]] = {}
    for row in rows:
        if row.get("id") and row.get("name"):
            ids_by_name.setdefault(row["name"], []).append(row["id"])
    return {
        name: ids[0]
        for name, ids in ids_by_name.items()
        if len(ids) == 1
    }


def build_images(
    *,
    source: Path = DEFAULT_SOURCE,
    output: Path = DEFAULT_OUTPUT,
    image_format: str = "webp",
    quality: int = 90,
    scale: float = 1,
    lossy_webp: bool = False,
    atlas_size: int = 4096,
    padding: int = 2,
    names: set[str] | None = None,
    overwrite: bool = True,
    items_source: Path = DEFAULT_ITEMS_SOURCE,
    chains_source: Path = DEFAULT_CHAINS_SOURCE,
    portraits_source: Path = DEFAULT_PORTRAITS_SOURCE,
    martial_arts_source: Path = DEFAULT_MARTIAL_ARTS_SOURCE,
    include_items: bool = True,
    include_chains: bool = True,
    include_martial_art_icons: bool = True,
    include_portraits: bool = True,
    include_effects: bool = True,
) -> ImageBuildResult:
    if not source.exists():
        raise RuntimeError(f"Source directory does not exist: {source}")

    output.mkdir(parents=True, exist_ok=True)
    target_names, refs, texture_scales, image_id_by_resource_path = build_texture_targets(
        source=source,
        names=names or set(),
        items_source=items_source,
        chains_source=chains_source,
        portraits_source=portraits_source,
        martial_arts_source=martial_arts_source,
        include_items=include_items,
        include_chains=include_chains,
        include_martial_art_icons=include_martial_art_icons,
        include_portraits=include_portraits,
        include_effects=include_effects,
    )
    result = collect_textures(
        source=source,
        targets=target_names,
        trim_transparent=True,
        texture_refs=refs,
        texture_scales=texture_scales,
        scale=scale,
    )
    exported, output_skipped, image_index = export_atlas(
        textures=result.textures,
        failures=result.failures,
        output=output,
        image_format=image_format,
        quality=quality,
        lossy_webp=lossy_webp,
        atlas_size=atlas_size,
        padding=padding,
        overwrite=overwrite,
    )
    return ImageBuildResult(
        exported=exported,
        skipped=result.skipped + output_skipped,
        failed=len(result.failures),
        texture_count=len(result.textures),
        manifest=output / "manifest.json",
        image_index=image_index,
        image_id_by_resource_path=image_id_by_resource_path,
    )
