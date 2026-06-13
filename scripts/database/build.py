from __future__ import annotations

from pathlib import Path
from typing import Any

from .builders.asset_effects import AssetEffectBuilder
from .builders.characters import CharacterBuilder
from .builders.custom_martial import CustomMartialBuilder
from .builders.enums import EnumBuilder
from .builders.items import ItemBuilder
from .builders.martial_arts import MartialArtBuilder
from .builders.portraits import PortraitBuilder
from .context import BuildContext
from .paths import DEFAULT_ENUM_SOURCE, DEFAULT_SOURCE, OUTPUT, ROOT
from .schema import INDEXES, TABLES
from .writer import write_sqlite


def build_rows_from_source(source: Path, enum_source: Path) -> dict[str, list[dict[str, Any]]]:
    ctx = BuildContext.from_source(source, enum_source)
    rows_by_table: dict[str, list[dict[str, Any]]] = {}
    for builder in [
        EnumBuilder(ctx),
        CharacterBuilder(ctx),
        ItemBuilder(ctx),
        MartialArtBuilder(ctx),
        AssetEffectBuilder(ctx),
        PortraitBuilder(ctx),
        CustomMartialBuilder(ctx),
    ]:
        rows_by_table.update(builder.rows())
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
) -> dict[str, Any]:
    rows_by_table = build_rows_from_source(source, enum_source)
    counts = write_sqlite(output=output, tables=TABLES, indexes=INDEXES, rows_by_table=rows_by_table)
    return {
        "source": relative_to_root(source),
        "output": relative_to_root(output),
        "tables": counts,
    }
