from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import UnityPy


DEFAULT_SOURCE = Path("re/jadx/resources/assets/bin/Data")
DEFAULT_OUTPUT = Path("public/images")

MARTIAL_ART_TEXTURE_NAMES = {
    "秘笈r1",
    "秘笈r2",
    "秘笈r3",
    "秘笈r4",
    "秘笈r5",
    "拳法icon",
    "刀法icon",
    "剑法icon",
    "枪法icon",
    "棍法icon",
    "暗器icon",
    "内功icon",
}


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


def load_table_rows(path: Path) -> list[dict[str, Any]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, dict):
        return data.get("rows") or data.get("data") or []
    if isinstance(data, list):
        return data
    return []


def wiki_texture_names(items_source: Path) -> set[str]:
    return {
        row.get("png")
        for row in load_table_rows(items_source)
        if row.get("png")
    }


def normalize_format(value: str) -> str:
    normalized = value.lower().lstrip(".")
    if normalized == "jpg":
        normalized = "jpeg"
    if normalized not in {"png", "webp"}:
        raise argparse.ArgumentTypeError("format must be png or webp")
    return normalized


def normalize_scale(value: str) -> float:
    scale = float(value)
    if scale <= 0 or scale > 1:
        raise argparse.ArgumentTypeError("scale must be greater than 0 and less than or equal to 1")
    return scale


def scaled_int(value: int | float, scale: float) -> int:
    return max(1, int(round(value * scale)))


def save_image(image: Any, path: Path, image_format: str, quality: int, lossy_webp: bool) -> None:
    if image_format == "png":
        image.save(path, optimize=True)
        return

    image.save(path, "WEBP", lossless=not lossy_webp, quality=quality, method=6)


def collect_textures(
    source: Path,
    targets: set[str],
    trim_transparent: bool,
    texture_refs: dict[str, set[int]] | None = None,
    scale: float = 1,
) -> ExtractResult:
    textures: list[TextureExport] = []
    seen_names: dict[str, int] = {}
    skipped = 0
    failures: list[dict[str, Any]] = []

    include_split_assets = bool(texture_refs)
    for asset_path in iter_asset_files(source, include_split_assets=include_split_assets):
        source_name = asset_path.name
        if texture_refs is not None and not asset_path.exists() and source_name not in texture_refs:
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
                is_referenced_texture = (
                    texture_refs is not None
                    and source_name in texture_refs
                    and path_id in texture_refs[source_name]
                )
                if texture_refs is not None and source_name in texture_refs and not is_referenced_texture:
                    continue

                texture = obj.read(check_read=False)
                name = getattr(texture, "m_Name", "")
                if targets and name not in targets and not is_referenced_texture:
                    continue

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

                if scale != 1:
                    image = image.resize(
                        (scaled_int(image.width, scale), scaled_int(image.height, scale)),
                        resample=1,
                    )
                    trim = {
                        "x": scaled_int(trim["x"], scale) if trim["x"] else 0,
                        "y": scaled_int(trim["y"], scale) if trim["y"] else 0,
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
                        texture_width=scaled_int(original_texture_width, scale),
                        texture_height=scaled_int(original_texture_height, scale),
                        original_texture_width=original_texture_width,
                        original_texture_height=original_texture_height,
                        texture_format=str(getattr(texture, "m_TextureFormat", "")),
                        scale=scale,
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


def write_manifest(output: Path, manifest: list[dict[str, Any]]) -> None:
    manifest.sort(key=lambda item: (item.get("name") or "", item.get("source") or ""))
    (output / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def export_files(
    textures: list[TextureExport],
    failures: list[dict[str, Any]],
    output: Path,
    image_format: str,
    quality: int,
    lossy_webp: bool,
    overwrite: bool,
) -> tuple[int, int]:
    exported = 0
    skipped = 0
    manifest: list[dict[str, Any]] = []

    for texture in textures:
        filename = f"{texture.file_stem}.{image_format}"
        out_path = output / filename
        if out_path.exists() and not overwrite:
            skipped += 1
        else:
            save_image(texture.image, out_path, image_format, quality, lossy_webp)
            exported += 1

        manifest.append(texture_manifest_entry(texture, {"file": filename}))

    manifest.extend(failures)
    write_manifest(output, manifest)
    return exported, skipped


def texture_manifest_entry(texture: TextureExport, extra: dict[str, Any]) -> dict[str, Any]:
    return {
        "name": texture.name,
        **extra,
        "source": texture.source,
        "pathId": texture.path_id,
        "key": f"{texture.source}:{texture.path_id}",
        "width": texture.image.width,
        "height": texture.image.height,
        "textureWidth": texture.texture_width,
        "textureHeight": texture.texture_height,
        "originalTextureWidth": texture.original_texture_width,
        "originalTextureHeight": texture.original_texture_height,
        "scale": texture.scale,
        "trim": texture.trim,
        "format": texture.texture_format,
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
) -> tuple[int, int]:
    from PIL import Image

    if overwrite:
        for old_file in output.glob(f"atlas-*.{image_format}"):
            old_file.unlink()

    pages: list[dict[str, Any]] = []
    manifest: list[dict[str, Any]] = []

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

    manifest.extend(failures)
    write_manifest(output, manifest)
    return exported, skipped
