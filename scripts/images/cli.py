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

from .atlas import export_atlas, normalize_format
from .paths import (
    DEFAULT_ITEMS_SOURCE,
    DEFAULT_CHAINS_SOURCE,
    DEFAULT_MARTIAL_ARTS_SOURCE,
    DEFAULT_OUTPUT,
    DEFAULT_PORTRAITS_SOURCE,
    DEFAULT_SOURCE,
)
from .targets import build_texture_targets
from .textures import collect_textures, normalize_scale


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
    parser.add_argument("--martial-arts-source", type=Path, default=DEFAULT_MARTIAL_ARTS_SOURCE)
    parser.add_argument("--no-items", action="store_true")
    parser.add_argument("--no-chains", action="store_true")
    parser.add_argument("--no-martial-art-icons", action="store_true")
    parser.add_argument("--no-portraits", action="store_true")
    parser.add_argument("--no-effects", action="store_true")
    args = parser.parse_args()

    if not args.source.exists():
        print(f"Source directory does not exist: {args.source}", file=sys.stderr)
        return 1

    args.output.mkdir(parents=True, exist_ok=True)
    target_names, refs, texture_scales = build_texture_targets(
        source=args.source,
        names=set(args.names or []),
        items_source=args.items_source,
        chains_source=args.chains_source,
        portraits_source=args.portraits_source,
        martial_arts_source=args.martial_arts_source,
        include_items=not args.no_items,
        include_chains=not args.no_chains,
        include_martial_art_icons=not args.no_martial_art_icons,
        include_portraits=not args.no_portraits,
        include_effects=not args.no_effects,
    )
    result = collect_textures(
        source=args.source,
        targets=target_names,
        trim_transparent=True,
        texture_refs=refs,
        texture_scales=texture_scales,
        scale=args.scale,
    )
    exported, output_skipped = export_atlas(
        textures=result.textures,
        failures=result.failures,
        output=args.output,
        image_format=args.format,
        quality=args.quality,
        lossy_webp=args.lossy_webp,
        atlas_size=args.atlas_size,
        padding=args.padding,
        overwrite=args.overwrite,
    )

    print(
        f"Exported {exported} atlas pages from {len(result.textures)} textures, "
        f"skipped {result.skipped + output_skipped}, failed {len(result.failures)}. "
        f"Manifest: {args.output / 'manifest.json'}"
    )
    return 0 if len(result.failures) == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
