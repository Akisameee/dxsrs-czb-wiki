from __future__ import annotations

import re
import struct
from pathlib import Path
from typing import Any

from .paths import DEFAULT_SOURCE


FIELD_RE = re.compile(r"([A-Za-z0-9_]+)([a-z])\x00\x00\x00BansheeGz\.BGDatabase\.BGField([A-Za-z]+),")
CLASS_END = b"PublicKeyToken=null"


def read_u32(data: bytes, offset: int) -> int:
    return struct.unpack_from("<I", data, offset)[0]


def read_i32(data: bytes, offset: int) -> int:
    return struct.unpack_from("<i", data, offset)[0]


def read_f32(data: bytes, offset: int) -> float:
    return struct.unpack_from("<f", data, offset)[0]


def read_i64(data: bytes, offset: int) -> int:
    return struct.unpack_from("<q", data, offset)[0]


def integer_set(min_value: int, max_value: int) -> set[int]:
    return set(range(min_value, max_value + 1))


def find_all_meta_ranges(data: bytes) -> list[dict[str, Any]]:
    segment = data.decode("latin1")
    pattern = re.compile(r"([A-Za-z0-9_]+)a\x00\x00\x00BansheeGz\.BGDatabase\.BGMetaRow")
    matches: list[dict[str, Any]] = []
    for match in pattern.finditer(segment):
        if matches and matches[-1]["start"] == match.start():
            continue
        matches.append({"name": match.group(1), "start": match.start()})

    ranges: list[dict[str, Any]] = []
    for index, match in enumerate(matches):
        ranges.append({
            "name": match["name"],
            "start": match["start"],
            "end": matches[index + 1]["start"] if index + 1 < len(matches) else len(data),
        })
    return ranges


def field_markers(data: bytes, start: int, end: int) -> list[dict[str, Any]]:
    segment = data[start:end].decode("latin1")
    markers: list[dict[str, Any]] = []
    for match in FIELD_RE.finditer(segment):
        offset = start + match.start()
        class_end_at = data.find(CLASS_END, offset)
        if class_end_at < 0:
            continue
        markers.append({
            "name": match.group(1),
            "kind": match.group(2),
            "fieldType": match.group(3),
            "offset": offset,
            "classEnd": class_end_at + len(CLASS_END),
        })
    return markers


def parse_string_field(data: bytes, class_end: int, expected_counts: set[int]) -> dict[str, Any]:
    for length_offset in range(class_end, class_end + 96):
        total_length = read_u32(data, length_offset)
        count = read_u32(data, length_offset + 4)
        if count not in expected_counts:
            continue
        if total_length < 12 or total_length > 1_000_000:
            continue

        entries_start = length_offset + 8
        pool_start = entries_start + count * 8
        pool_length = total_length - (4 + count * 8)
        if pool_length < 0 or pool_start + pool_length > len(data):
            continue

        entries: list[tuple[int, int]] = []
        ok = True
        previous_end = 0
        max_row_index = 0
        for index in range(count):
            row_index = read_u32(data, entries_start + index * 8)
            end_offset = read_u32(data, entries_start + index * 8 + 4)
            if end_offset > pool_length or end_offset < previous_end:
                ok = False
                break
            entries.append((row_index, end_offset))
            previous_end = end_offset
            max_row_index = max(max_row_index, row_index)
        if not ok:
            continue

        pool = data[pool_start:pool_start + pool_length]
        decoded = pool.decode("utf-8", errors="replace")
        replacement_count = decoded.count("\ufffd")
        if replacement_count > max(2, len(decoded) / 20):
            continue

        values: list[str | None] = [None] * (max_row_index + 1)
        previous = 0
        for row_index, end_offset in entries:
            values[row_index] = pool[previous:end_offset].decode("utf-8")
            previous = end_offset
        return {"values": values, "details": {"lengthOffset": length_offset, "totalLength": total_length, "count": count}}
    raise RuntimeError(f"Cannot parse string field near {class_end}")


def parse_i32_field(data: bytes, class_end: int, expected_counts: set[int]) -> dict[str, Any]:
    expected_lengths = {count * 4: count for count in expected_counts}
    for length_offset in range(class_end, class_end + 256):
        total_length = read_u32(data, length_offset)
        count = expected_lengths.get(total_length)
        if not count:
            continue
        values: list[int] = []
        ok = True
        values_start = length_offset + 4
        for index in range(count):
            value = read_i32(data, values_start + index * 4)
            if value < -100000 or value > 100000:
                ok = False
                break
            values.append(value)
        if ok:
            return {"values": values, "details": {"lengthOffset": length_offset, "totalLength": total_length, "count": count}}
    raise RuntimeError(f"Cannot parse int/enum field near {class_end}")


def parse_f32_field(data: bytes, class_end: int, expected_counts: set[int]) -> dict[str, Any]:
    expected_lengths = {count * 4: count for count in expected_counts}
    for length_offset in range(class_end, class_end + 256):
        total_length = read_u32(data, length_offset)
        count = expected_lengths.get(total_length)
        if not count:
            continue
        values: list[float] = []
        ok = True
        values_start = length_offset + 4
        for index in range(count):
            value = read_f32(data, values_start + index * 4)
            if abs(value) > 1_000_000:
                ok = False
                break
            values.append(value)
        if ok:
            return {"values": values, "details": {"lengthOffset": length_offset, "totalLength": total_length, "count": count}}
    raise RuntimeError(f"Cannot parse float field near {class_end}")


def parse_i64_field(data: bytes, class_end: int, expected_counts: set[int]) -> dict[str, Any]:
    expected_lengths = {count * 8: count for count in expected_counts}
    for length_offset in range(class_end, class_end + 256):
        total_length = read_u32(data, length_offset)
        count = expected_lengths.get(total_length)
        if not count:
            continue
        values: list[int] = []
        ok = True
        values_start = length_offset + 4
        for index in range(count):
            value = read_i64(data, values_start + index * 8)
            if abs(value) > 9007199254740991:
                ok = False
                break
            values.append(value)
        if ok:
            return {"values": values, "details": {"lengthOffset": length_offset, "totalLength": total_length, "count": count}}
    raise RuntimeError(f"Cannot parse long field near {class_end}")


def parse_bool_field(data: bytes, class_end: int, expected_counts: set[int]) -> dict[str, Any]:
    for length_offset in range(class_end, class_end + 256):
        total_length = read_u32(data, length_offset)
        if total_length not in expected_counts:
            continue
        values_start = length_offset + 4
        raw = data[values_start:values_start + total_length]
        if not all(value in (0, 1) for value in raw):
            continue
        return {
            "values": [bool(value) for value in raw],
            "details": {"lengthOffset": length_offset, "totalLength": total_length, "count": total_length},
        }
    raise RuntimeError(f"Cannot parse bool field near {class_end}")


def rows_from_fields(fields: dict[str, list[Any]]) -> list[dict[str, Any]]:
    row_count = max((len(values) for values in fields.values()), default=0)
    rows: list[dict[str, Any]] = []
    for index in range(row_count):
        row: dict[str, Any] = {"index": index}
        for name, values in fields.items():
            row[name] = values[index] if index < len(values) else None
        rows.append(row)
    return rows


def parse_typed_field(data: bytes, marker: dict[str, Any], expected_counts: set[int]) -> dict[str, Any] | None:
    field_type = marker["fieldType"]
    if field_type in ("String", "EntityName"):
        return parse_string_field(data, marker["classEnd"], expected_counts)
    if field_type in ("Int", "Enum"):
        return parse_i32_field(data, marker["classEnd"], expected_counts)
    if field_type == "Float":
        return parse_f32_field(data, marker["classEnd"], expected_counts)
    if field_type == "Long":
        return parse_i64_field(data, marker["classEnd"], expected_counts)
    if field_type == "Bool":
        return parse_bool_field(data, marker["classEnd"], expected_counts)
    return None


def parse_table(data: bytes, table_range: dict[str, Any], table_index: int) -> dict[str, Any]:
    markers = field_markers(data, table_range["start"], table_range["end"])
    fields: dict[str, list[Any]] = {}
    field_meta: dict[str, Any] = {}
    flexible_string_counts = integer_set(1, 5000)

    for marker in markers:
        if marker["fieldType"] not in ("String", "EntityName"):
            continue
        try:
            parsed = parse_string_field(data, marker["classEnd"], flexible_string_counts)
            fields[marker["name"]] = parsed["values"]
            field_meta[marker["name"]] = {
                "fieldType": marker["fieldType"],
                "offset": marker["offset"],
                **parsed["details"],
            }
        except Exception as exc:
            field_meta[marker["name"]] = {
                "fieldType": marker["fieldType"],
                "offset": marker["offset"],
                "error": str(exc),
            }

    row_count = len(rows_from_fields(fields))
    expected_counts = {row_count} if row_count else integer_set(1, 5000)

    for marker in markers:
        if marker["name"] in fields or marker["fieldType"] in ("String", "EntityName"):
            continue
        try:
            parsed = parse_typed_field(data, marker, expected_counts)
            if not parsed:
                field_meta[marker["name"]] = {
                    "fieldType": marker["fieldType"],
                    "offset": marker["offset"],
                    "skipped": "Unsupported field type",
                }
                continue
            fields[marker["name"]] = parsed["values"]
            field_meta[marker["name"]] = {
                "fieldType": marker["fieldType"],
                "offset": marker["offset"],
                **parsed["details"],
            }
        except Exception as exc:
            field_meta[marker["name"]] = {
                "fieldType": marker["fieldType"],
                "offset": marker["offset"],
                "error": str(exc),
            }

    rows = rows_from_fields(fields)
    return {
        "tableIndex": table_index,
        "meta": table_range["name"],
        "range": {"start": table_range["start"], "end": table_range["end"]},
        "fieldCount": len(markers),
        "fields": [marker["name"] for marker in markers],
        "fieldMeta": field_meta,
        "rowCount": len(rows),
        "rows": rows,
    }


def extract_tables(source: Path = DEFAULT_SOURCE) -> list[dict[str, Any]]:
    data = Path(source).read_bytes()
    ranges = find_all_meta_ranges(data)
    return [parse_table(data, table_range, index) for index, table_range in enumerate(ranges)]


def derive_chain_enums(chain_rows: list[dict[str, Any]]) -> dict[str, Any]:
    sect: dict[int, str | None] = {15: None}
    style: dict[int, str | None] = {0: None}

    for row in chain_rows:
        if row.get("chnname") is None:
            continue
        if row.get("fengge") == 0 and row.get("menpai") != 15 and row.get("menpai") not in sect:
            sect[row["menpai"]] = row["chnname"]
        if row.get("fengge") != 0 and row.get("fengge") not in style:
            style[row["fengge"]] = row["chnname"]

    return {
        "source": "GLianSuo",
        "enumTypes": {
            "LianSuo_MP": dict(sorted(sect.items(), key=lambda item: int(item[0]))),
            "LianSuo_FG": dict(sorted(style.items(), key=lambda item: int(item[0]))),
        },
        "note": "LianSuo_MP=15 is used by style-chain rows as a no-sect placeholder; it is not a sect name.",
    }
