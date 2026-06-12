from __future__ import annotations

import argparse
from pathlib import Path

from .build import build_sqlite
from .paths import DEFAULT_ENUM_SOURCE, DEFAULT_SOURCE, OUTPUT, ROOT


def main() -> int:
    parser = argparse.ArgumentParser(description="Build the wiki SQLite database.")
    parser.add_argument("source", nargs="?", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("output", nargs="?", type=Path, default=OUTPUT)
    parser.add_argument("enum_source", nargs="?", type=Path, default=DEFAULT_ENUM_SOURCE)
    args = parser.parse_args()

    result = build_sqlite(source=args.source, output=args.output, enum_source=args.enum_source)
    print(f"Wrote {ROOT / result['output']}")
    for name, count in result["tables"].items():
        print(f"{name}: {count}")
    return 0
