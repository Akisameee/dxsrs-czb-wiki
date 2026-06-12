from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

try:
    import UnityPy  # noqa: F401
except ModuleNotFoundError:
    print(
        "Missing dependency: UnityPy. Install it with `python -m pip install UnityPy Pillow`.",
        file=sys.stderr,
    )
    raise

if __package__:
    from .image_export import (
        DEFAULT_OUTPUT,
        DEFAULT_SOURCE,
        MARTIAL_ART_TEXTURE_NAMES,
        collect_textures,
        export_atlas,
        export_files,
        normalize_format,
        normalize_scale,
        wiki_texture_names,
    )
    from .portraits import extract_portrait_layers, portrait_texture_refs
else:
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    from images.image_export import (
        DEFAULT_OUTPUT,
        DEFAULT_SOURCE,
        MARTIAL_ART_TEXTURE_NAMES,
        collect_textures,
        export_atlas,
        export_files,
        normalize_format,
        normalize_scale,
        wiki_texture_names,
    )
    from images.portraits import extract_portrait_layers, portrait_texture_refs


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Extract Unity Texture2D images into the Nuxt public/images directory."
    )
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--format", type=normalize_format, default="png")
    parser.add_argument("--quality", type=int, default=90)
    parser.add_argument(
        "--scale",
        type=normalize_scale,
        default=1,
        help="Resize exported textures before packing, for example 0.75 or 0.5.",
    )
    parser.add_argument(
        "--lossy-webp",
        action="store_true",
        help="Use lossy WebP instead of the default lossless WebP. Only applies to --format webp.",
    )
    parser.add_argument("--mode", choices=["files", "atlas", "portrait-layers"], default="files")
    parser.add_argument("--atlas-size", type=int, default=4096)
    parser.add_argument("--padding", type=int, default=2)
    parser.add_argument(
        "--names",
        nargs="*",
        help="Only export these Texture2D names. Useful for item icons such as qupu01 dao01.",
    )
    parser.add_argument(
        "--trim-transparent",
        action="store_true",
        help="Crop fully transparent padding around each image. Disabled by default.",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Overwrite existing image files instead of reusing them.",
    )
    parser.add_argument(
        "--portraits-source",
        type=Path,
        default=Path("re/raw/tables/016-Npc.json"),
        help="Npc table JSON used by --mode portrait-layers.",
    )
    parser.add_argument(
        "--items-source",
        type=Path,
        default=Path("re/raw/tables/006-GItem.json"),
        help="GItem table JSON used by --wiki-textures.",
    )
    parser.add_argument(
        "--include-portrait-textures",
        action="store_true",
        help="Also export Texture2D entries referenced by NPC portrait prefabs.",
    )
    parser.add_argument(
        "--include-martial-art-textures",
        action="store_true",
        help="Also export martial art book frames and type icons.",
    )
    parser.add_argument(
        "--wiki-textures",
        action="store_true",
        help="Export images currently referenced by wiki data, such as item and martial art icons.",
    )
    args = parser.parse_args()

    if not args.source.exists():
        print(f"Source directory does not exist: {args.source}", file=sys.stderr)
        return 1

    if args.mode == "portrait-layers":
        result = extract_portrait_layers(args.source, args.portraits_source)
        print(json.dumps(result, ensure_ascii=True))
        return 0 if not result["missing"] and not result["failures"] else 2

    output: Path = args.output
    output.mkdir(parents=True, exist_ok=True)

    target_names = set(args.names or [])
    if args.wiki_textures:
        target_names.update(wiki_texture_names(args.items_source))
        target_names.update(MARTIAL_ART_TEXTURE_NAMES)
    if args.include_martial_art_textures:
        target_names.update(MARTIAL_ART_TEXTURE_NAMES)

    refs = portrait_texture_refs(args.source, args.portraits_source) if args.include_portrait_textures else None
    result = collect_textures(
        source=args.source,
        targets=target_names,
        trim_transparent=args.trim_transparent,
        texture_refs=refs,
        scale=args.scale,
    )

    if args.mode == "atlas":
        exported, output_skipped = export_atlas(
            textures=result.textures,
            failures=result.failures,
            output=output,
            image_format=args.format,
            quality=args.quality,
            lossy_webp=args.lossy_webp,
            atlas_size=args.atlas_size,
            padding=args.padding,
            overwrite=args.overwrite,
        )
        unit = "atlas pages"
    else:
        exported, output_skipped = export_files(
            textures=result.textures,
            failures=result.failures,
            output=output,
            image_format=args.format,
            quality=args.quality,
            lossy_webp=args.lossy_webp,
            overwrite=args.overwrite,
        )
        unit = "images"

    print(
        f"Exported {exported} {unit}, skipped {result.skipped + output_skipped}, "
        f"failed {len(result.failures)}. Manifest: {output / 'manifest.json'}"
    )
    return 0 if len(result.failures) == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
