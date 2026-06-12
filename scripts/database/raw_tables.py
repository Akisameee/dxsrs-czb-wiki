from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

from .bgdatabase import extract_tables
from .paths import DEFAULT_SOURCE, ROOT


def sanitize_name(value: Any) -> str:
    name = re.sub(r'[\\/:*?"<>|]', "_", str(value).strip())
    name = re.sub(r"\s+", "_", name)
    name = re.sub(r"_+", "_", name)
    return name


def export_raw_tables(source: Path = DEFAULT_SOURCE, out_dir: Path = ROOT / "re/raw") -> int:
    tables_dir = out_dir / "tables"
    tables_dir.mkdir(parents=True, exist_ok=True)

    tables = extract_tables(source)
    manifest = []
    for table in tables:
        file_name = f"{table['tableIndex']:03d}-{sanitize_name(table['meta'])}.json"
        payload = {
            "tableIndex": table["tableIndex"],
            "meta": table["meta"],
            "range": table["range"],
            "fieldCount": table["fieldCount"],
            "rowCount": table["rowCount"],
            "fields": table["fields"],
            "fieldMeta": table["fieldMeta"],
            "rows": table["rows"],
        }
        (tables_dir / file_name).write_text(
            json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        manifest.append({
            "tableIndex": table["tableIndex"],
            "meta": table["meta"],
            "file": f"tables/{file_name}",
            "fieldCount": table["fieldCount"],
            "rowCount": table["rowCount"],
        })

    (out_dir / "manifest.json").write_text(
        json.dumps({
            "source": str(source),
            "tableCount": len(tables),
            "tables": manifest,
        }, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return len(tables)


def main() -> int:
    parser = argparse.ArgumentParser(description="Extract raw BGDatabase tables into JSON files.")
    parser.add_argument("source", nargs="?", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("out_dir", nargs="?", type=Path, default=ROOT / "re/raw")
    args = parser.parse_args()
    count = export_raw_tables(args.source, args.out_dir)
    print(f"Extracted {count} tables to {args.out_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
