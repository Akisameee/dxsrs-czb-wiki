from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Any


def sqlite_identifier(name: str) -> str:
    return f'"{name.replace(chr(34), chr(34) + chr(34))}"'


def column_affinity(type_name: str) -> str:
    if "INTEGER" in type_name:
        return "INTEGER"
    if "REAL" in type_name:
        return "REAL"
    return "TEXT"


def coerce_value(value: Any, type_name: str) -> Any:
    if value == "" or value is None:
        return None
    affinity = column_affinity(type_name)
    if affinity == "INTEGER":
        return int(value)
    if affinity == "REAL":
        return float(value)
    return value


def create_table(db: sqlite3.Connection, name: str, definition: dict[str, Any]) -> None:
    columns = [
        f"{sqlite_identifier(column)} {type_name}"
        for column, type_name in definition["columns"].items()
    ]
    primary_key = definition.get("primaryKey")
    if primary_key:
        columns.append(f"PRIMARY KEY ({', '.join(sqlite_identifier(column) for column in primary_key)})")
    db.execute(f"CREATE TABLE {sqlite_identifier(name)} ({', '.join(columns)})")


def import_table(
    db: sqlite3.Connection,
    name: str,
    definition: dict[str, Any],
    rows: list[dict[str, Any]],
) -> int:
    columns = list(definition["columns"].keys())
    placeholders = ", ".join("?" for _ in columns)
    sql = (
        f"INSERT INTO {sqlite_identifier(name)} "
        f"({', '.join(sqlite_identifier(column) for column in columns)}) VALUES ({placeholders})"
    )
    values = [
        [coerce_value(row.get(column), definition["columns"][column]) for column in columns]
        for row in rows
    ]
    db.executemany(sql, values)
    return len(rows)


def write_sqlite(
    *,
    output: Path,
    tables: dict[str, Any],
    indexes: list[str],
    rows_by_table: dict[str, list[dict[str, Any]]],
) -> dict[str, int]:
    output.parent.mkdir(parents=True, exist_ok=True)
    output.unlink(missing_ok=True)

    db = sqlite3.connect(output)
    db.execute("PRAGMA journal_mode = DELETE")
    db.execute("PRAGMA foreign_keys = OFF")
    db.execute("BEGIN")

    counts: dict[str, int] = {}
    try:
        for name, definition in tables.items():
            create_table(db, name, definition)
            counts[name] = import_table(db, name, definition, rows_by_table.get(name, []))
        for statement in indexes:
            db.execute(statement)
        db.commit()
    except Exception:
        db.rollback()
        db.close()
        raise

    db.execute("VACUUM")
    db.close()
    return counts
