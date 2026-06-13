from __future__ import annotations

from pathlib import Path

from .effects import effect_texture_refs, merge_texture_refs
from .paths import DEFAULT_ITEMS_SOURCE, DEFAULT_MARTIAL_ARTS_SOURCE, DEFAULT_PORTRAITS_SOURCE
from .portraits import portrait_texture_refs
from .unity_assets import load_table_rows


DEFAULT_EFFECT_SCALE = 0.25

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


def wiki_texture_names(items_source: Path = DEFAULT_ITEMS_SOURCE) -> set[str]:
    return {
        row.get("png")
        for row in load_table_rows(items_source)
        if row.get("png")
    }


def build_texture_targets(
    *,
    source: Path,
    names: set[str] | None = None,
    items_source: Path = DEFAULT_ITEMS_SOURCE,
    portraits_source: Path = DEFAULT_PORTRAITS_SOURCE,
    martial_arts_source: Path = DEFAULT_MARTIAL_ARTS_SOURCE,
    include_items: bool = True,
    include_martial_art_icons: bool = True,
    include_portraits: bool = True,
    include_effects: bool = True,
) -> tuple[set[str], dict[str, set[int]], dict[str, dict[int, float]]]:
    target_names = set(names or [])
    texture_refs: dict[str, set[int]] = {}
    texture_scales: dict[str, dict[int, float]] = {}

    if include_items:
        target_names.update(wiki_texture_names(items_source))
    if include_martial_art_icons:
        target_names.update(MARTIAL_ART_TEXTURE_NAMES)
    if include_portraits:
        merge_texture_refs(texture_refs, portrait_texture_refs(source, portraits_source))
    if include_effects:
        effect_refs = effect_texture_refs(source, martial_arts_source)
        merge_texture_refs(texture_refs, effect_refs)
        for asset, path_ids in effect_refs.items():
            texture_scales.setdefault(asset, {}).update({
                path_id: DEFAULT_EFFECT_SCALE
                for path_id in path_ids
            })

    return target_names, texture_refs, texture_scales
