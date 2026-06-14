from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from .ids import image_id
from .textures import TextureExport


def normalize_format(value: str) -> str:
    normalized = value.lower().lstrip(".")
    if normalized == "jpg":
        normalized = "jpeg"
    if normalized not in {"png", "webp"}:
        raise argparse.ArgumentTypeError("format must be png or webp")
    return normalized


def save_image(image: Any, path: Path, image_format: str, quality: int, lossy_webp: bool) -> None:
    if image_format == "png":
        image.save(path, optimize=True)
        return

    image.save(path, "WEBP", lossless=not lossy_webp, quality=quality, method=6)


def write_manifest(output: Path, manifest: list[dict[str, Any]]) -> None:
    manifest.sort(key=lambda item: item.get("id") or "")
    (output / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def texture_manifest_entry(texture: TextureExport, extra: dict[str, Any]) -> dict[str, Any]:
    texture_id = image_id(texture.source, texture.path_id)
    return {
        "id": texture_id,
        **extra,
        "width": texture.image.width,
        "height": texture.image.height,
        "textureWidth": texture.texture_width,
        "textureHeight": texture.texture_height,
        "trim": texture.trim,
    }


def texture_index_entry(texture: TextureExport) -> dict[str, Any]:
    return {
        "id": image_id(texture.source, texture.path_id),
        "name": texture.name,
        "source": texture.source,
        "pathId": texture.path_id,
    }


def export_atlas(
    textures: list[TextureExport],
    failures: list[dict[str, Any]],
    output: Path,
    image_format: str,
    quality: int,
    lossy_webp: bool,
    atlas_size: int,
    padding: int,
    overwrite: bool,
) -> tuple[int, int, list[dict[str, Any]]]:
    from PIL import Image

    if overwrite:
        for old_file in output.glob(f"atlas-*.{image_format}"):
            old_file.unlink()

    pages: list[dict[str, Any]] = []
    manifest: list[dict[str, Any]] = []
    image_index: list[dict[str, Any]] = []

    def new_page() -> dict[str, Any]:
        page = {
            "image": Image.new("RGBA", (atlas_size, atlas_size), (0, 0, 0, 0)),
            "index": len(pages),
            "x": 0,
            "y": 0,
            "row_height": 0,
            "used_width": 0,
            "used_height": 0,
        }
        pages.append(page)
        return page

    def place(page: dict[str, Any], texture: TextureExport) -> tuple[int, int] | None:
        width = texture.image.width
        height = texture.image.height
        if width > atlas_size or height > atlas_size:
            raise ValueError(f"Texture {texture.name} is larger than atlas size: {width}x{height}")

        if page["x"] + width > atlas_size:
            page["x"] = 0
            page["y"] += page["row_height"] + padding
            page["row_height"] = 0

        if page["y"] + height > atlas_size:
            return None

        x = page["x"]
        y = page["y"]
        page["image"].paste(texture.image, (x, y))
        page["x"] += width + padding
        page["row_height"] = max(page["row_height"], height)
        page["used_width"] = max(page["used_width"], x + width)
        page["used_height"] = max(page["used_height"], y + height)
        return x, y

    page = new_page()
    sorted_textures = sorted(
        textures,
        key=lambda item: (item.image.height, item.image.width, item.name),
        reverse=True,
    )
    for texture in sorted_textures:
        position = place(page, texture)
        if position is None:
            page = new_page()
            position = place(page, texture)
        if position is None:
            raise RuntimeError(f"Unable to pack texture: {texture.name}")

        x, y = position
        manifest.append(texture_manifest_entry(texture, {
            "atlas": f"atlas-{page['index']}.{image_format}",
            "x": x,
            "y": y,
        }))
        image_index.append(texture_index_entry(texture))

    exported = 0
    skipped = 0
    for page in pages:
        filename = f"atlas-{page['index']}.{image_format}"
        out_path = output / filename
        atlas_image = page["image"].crop((0, 0, page["used_width"], page["used_height"]))
        page["filename"] = filename
        page["atlas_width"] = atlas_image.width
        page["atlas_height"] = atlas_image.height
        if out_path.exists() and not overwrite:
            skipped += 1
        else:
            save_image(atlas_image, out_path, image_format, quality, lossy_webp)
            exported += 1

    page_sizes = {
        page["filename"]: {
            "width": page["atlas_width"],
            "height": page["atlas_height"],
        }
        for page in pages
    }
    for entry in manifest:
        size = page_sizes.get(entry["atlas"])
        if size:
            entry["atlasWidth"] = size["width"]
            entry["atlasHeight"] = size["height"]

    write_manifest(output, manifest)
    return exported, skipped, sorted(image_index, key=lambda item: item["id"])
