from __future__ import annotations

import argparse
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

from .atlas import normalize_format
from .build import build_images
from .paths import (
    DEFAULT_ITEMS_SOURCE,
    DEFAULT_CHAINS_SOURCE,
    DEFAULT_MARTIAL_ARTS_SOURCE,
    DEFAULT_OUTPUT,
    DEFAULT_PORTRAIT_PARTS_SOURCE,
    DEFAULT_PORTRAITS_SOURCE,
    DEFAULT_SOURCE,
)
from .textures import normalize_scale


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Export game Texture2D assets into a single atlas manifest for the Nuxt app."
    )
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--format", type=normalize_format, default="webp")
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
    parser.add_argument("--atlas-size", type=int, default=4096)
    parser.add_argument("--padding", type=int, default=2)
    parser.add_argument(
        "--names",
        nargs="*",
        help="Also export these Texture2D names.",
    )
    parser.add_argument("--overwrite", action=argparse.BooleanOptionalAction, default=True)
    parser.add_argument("--items-source", type=Path, default=DEFAULT_ITEMS_SOURCE)
    parser.add_argument("--chains-source", type=Path, default=DEFAULT_CHAINS_SOURCE)
    parser.add_argument("--portraits-source", type=Path, default=DEFAULT_PORTRAITS_SOURCE)
    parser.add_argument("--portrait-parts-source", type=Path, default=DEFAULT_PORTRAIT_PARTS_SOURCE)
    parser.add_argument("--martial-arts-source", type=Path, default=DEFAULT_MARTIAL_ARTS_SOURCE)
    parser.add_argument("--no-items", action="store_true")
    parser.add_argument("--no-chains", action="store_true")
    parser.add_argument("--no-martial-art-icons", action="store_true")
    parser.add_argument("--no-portraits", action="store_true")
    parser.add_argument("--no-effects", action="store_true")
    args = parser.parse_args()

    try:
        result = build_images(
            source=args.source,
            output=args.output,
            image_format=args.format,
            quality=args.quality,
            scale=args.scale,
            lossy_webp=args.lossy_webp,
            atlas_size=args.atlas_size,
            padding=args.padding,
            names=set(args.names or []),
            overwrite=args.overwrite,
            items_source=args.items_source,
            chains_source=args.chains_source,
            portraits_source=args.portraits_source,
            portrait_parts_source=args.portrait_parts_source,
            martial_arts_source=args.martial_arts_source,
            include_items=not args.no_items,
            include_chains=not args.no_chains,
            include_martial_art_icons=not args.no_martial_art_icons,
            include_portraits=not args.no_portraits,
            include_effects=not args.no_effects,
        )
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    print(
        f"Exported {result.exported} atlas pages from {result.texture_count} textures, "
        f"skipped {result.skipped}, failed {result.failed}. "
        f"Manifest: {result.manifest}"
    )
    return 0 if result.failed == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
