from __future__ import annotations

from pathlib import Path
from typing import Any

from .builders.asset_effects import AssetEffectBuilder
from .builders.characters import CharacterBuilder
from .builders.custom_martial import CustomMartialBuilder
from .builders.enums import EnumBuilder
from .builders.items import ItemBuilder
from .builders.martial_arts import MartialArtBuilder
from .builders.meridians import MeridianBuilder
from .builders.portraits import PortraitBuilder
from .builders.sects import SectBuilder
from .context import BuildContext
from .paths import DEFAULT_ENUM_SOURCE, DEFAULT_SOURCE, OUTPUT, ROOT
from .schema import INDEXES, TABLES
from .writer import write_sqlite


def image_manifest_rows(image_manifest: list[dict[str, Any]] | None = None) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for entry in image_manifest or []:
        trim = entry.get("trim") or {}
        rows.append({
            "id": entry.get("id"),
            "atlas": entry.get("atlas"),
            "atlas_width": entry.get("atlasWidth"),
            "atlas_height": entry.get("atlasHeight"),
            "x": entry.get("x"),
            "y": entry.get("y"),
            "width": entry.get("width"),
            "height": entry.get("height"),
            "texture_width": entry.get("textureWidth"),
            "texture_height": entry.get("textureHeight"),
            "trim_x": trim.get("x"),
            "trim_y": trim.get("y"),
            "trim_width": trim.get("width"),
            "trim_height": trim.get("height"),
            "trim_trimmed": 1 if trim.get("trimmed") else 0,
        })
    return rows


def build_rows_from_source(
    source: Path,
    enum_source: Path,
    image_id_by_name: dict[str, str] | None = None,
    image_id_by_resource_path: dict[str, str] | None = None,
    image_manifest: list[dict[str, Any]] | None = None,
) -> dict[str, list[dict[str, Any]]]:
    ctx = BuildContext.from_source(
        source,
        enum_source,
        image_id_by_name=image_id_by_name,
        image_id_by_resource_path=image_id_by_resource_path,
    )
    rows_by_table: dict[str, list[dict[str, Any]]] = {}
    for builder in [
        EnumBuilder(ctx),
        SectBuilder(ctx),
        CharacterBuilder(ctx),
        ItemBuilder(ctx),
        MartialArtBuilder(ctx),
        AssetEffectBuilder(ctx),
        PortraitBuilder(ctx),
        CustomMartialBuilder(ctx),
        MeridianBuilder(ctx),
    ]:
        rows_by_table.update(builder.rows())
    rows_by_table["image_manifest"] = image_manifest_rows(image_manifest)
    return rows_by_table


def relative_to_root(path: Path) -> str:
    try:
        return path.resolve().relative_to(ROOT).as_posix()
    except ValueError:
        return str(path)


def build_sqlite(
    source: Path = DEFAULT_SOURCE,
    enum_source: Path = DEFAULT_ENUM_SOURCE,
    output: Path = OUTPUT,
    image_id_by_name: dict[str, str] | None = None,
    image_id_by_resource_path: dict[str, str] | None = None,
    image_manifest: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    rows_by_table = build_rows_from_source(
        source,
        enum_source,
        image_id_by_name=image_id_by_name,
        image_id_by_resource_path=image_id_by_resource_path,
        image_manifest=image_manifest,
    )
    counts = write_sqlite(output=output, tables=TABLES, indexes=INDEXES, rows_by_table=rows_by_table)
    return {
        "source": relative_to_root(source),
        "output": relative_to_root(output),
        "tables": counts,
    }
