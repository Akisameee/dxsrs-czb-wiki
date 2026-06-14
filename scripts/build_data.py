from __future__ import annotations

import argparse
from pathlib import Path

from scripts.database.build import build_sqlite
from scripts.database.paths import DEFAULT_ENUM_SOURCE, DEFAULT_SOURCE as DEFAULT_DB_SOURCE, OUTPUT, ROOT
from scripts.images.atlas import normalize_format
from scripts.images.build import build_images, image_id_by_unique_name
from scripts.images.paths import DEFAULT_OUTPUT as DEFAULT_IMAGE_OUTPUT, DEFAULT_SOURCE as DEFAULT_IMAGE_SOURCE
from scripts.images.textures import normalize_scale


def relative_to_root(path: Path) -> str:
    try:
        return path.resolve().relative_to(ROOT).as_posix()
    except ValueError:
        return str(path)


def main() -> int:
    parser = argparse.ArgumentParser(description="Build image atlas and wiki SQLite in one process.")
    parser.add_argument("--image-source", type=Path, default=DEFAULT_IMAGE_SOURCE)
    parser.add_argument("--image-output", type=Path, default=DEFAULT_IMAGE_OUTPUT)
    parser.add_argument("--db-source", type=Path, default=DEFAULT_DB_SOURCE)
    parser.add_argument("--db-output", type=Path, default=OUTPUT)
    parser.add_argument("--enum-source", type=Path, default=DEFAULT_ENUM_SOURCE)
    parser.add_argument("--format", type=normalize_format, default="webp")
    parser.add_argument("--quality", type=int, default=90)
    parser.add_argument("--scale", type=normalize_scale, default=1)
    parser.add_argument("--lossy-webp", action="store_true")
    parser.add_argument("--atlas-size", type=int, default=4096)
    parser.add_argument("--padding", type=int, default=2)
    parser.add_argument("--overwrite", action=argparse.BooleanOptionalAction, default=True)
    args = parser.parse_args()

    images = build_images(
        source=args.image_source,
        output=args.image_output,
        image_format=args.format,
        quality=args.quality,
        scale=args.scale,
        lossy_webp=args.lossy_webp,
        atlas_size=args.atlas_size,
        padding=args.padding,
        overwrite=args.overwrite,
    )
    print(
        f"Exported {images.exported} atlas pages from {images.texture_count} textures, "
        f"skipped {images.skipped}, failed {images.failed}. "
        f"Manifest: {images.manifest}"
    )
    if images.failed:
        return 2

    image_id_by_name = image_id_by_unique_name(images.image_index)
    sqlite = build_sqlite(
        source=args.db_source,
        enum_source=args.enum_source,
        output=args.db_output,
        image_id_by_name=image_id_by_name,
    )
    print(f"Wrote {ROOT / sqlite['output']}")
    for name, count in sqlite["tables"].items():
        print(f"{name}: {count}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
