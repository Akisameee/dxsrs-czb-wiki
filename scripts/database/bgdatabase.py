from __future__ import annotations

import re
import struct
from pathlib import Path
from typing import Any, Callable

from .paths import DEFAULT_SOURCE


BG_BINARY_VERSION = 5
BG_UNIQUE_ID = bytes.fromhex("97 d8 68 25 45 f1 47 48 ae 49 52 84 cd fc dc c7")
BG_ENCRYPTION_ID = bytes.fromhex("7c 6f 40 a8 b0 7d 33 42 ad a6 8b 16 56 8b 0f 81")


class BgBinaryReader:
    def __init__(self, data: bytes, offset: int = 0):
        self.data = data
        self.offset = offset

    @property
    def length(self) -> int:
        return len(self.data)

    def ensure(self, length: int) -> None:
        if length < 0 or self.offset + length > self.length:
            raise RuntimeError(f"BGDatabase 数据被截断：offset={self.offset}, length={length}")

    def read_i32(self) -> int:
        self.ensure(4)
        value = struct.unpack_from("<i", self.data, self.offset)[0]
        self.offset += 4
        return value

    def read_f32(self) -> float:
        self.ensure(4)
        value = struct.unpack_from("<f", self.data, self.offset)[0]
        self.offset += 4
        return value

    def read_bool(self) -> bool:
        self.ensure(1)
        value = self.data[self.offset] != 0
        self.offset += 1
        return value

    def read_id(self) -> bytes:
        return self.read_bytes(16)

    def read_bytes(self, length: int) -> bytes:
        self.ensure(length)
        value = self.data[self.offset:self.offset + length]
        self.offset += length
        return value

    def read_byte_array(self) -> bytes:
        length = self.read_i32()
        if length < 0:
            raise RuntimeError(f"byte[] 长度异常：{length}")
        return self.read_bytes(length)

    def read_string(self) -> str | None:
        value = self.read_byte_array()
        if not value:
            return None
        return value.decode("utf-8", errors="replace")

    def read_array(self, read_item: Callable[[int], Any]) -> list[Any]:
        count = self.read_i32()
        if count < 0 or count > 1_000_000:
            raise RuntimeError(f"数组长度异常：{count}")
        return [read_item(index) for index in range(count)]

    def peek_id_equals(self, target: bytes) -> bool:
        return self.data[self.offset:self.offset + len(target)] == target


def repo_start_offset(data: bytes) -> int:
    unique_id_offset = data.find(BG_UNIQUE_ID)
    if unique_id_offset < 4:
        raise RuntimeError("没有找到 BGDatabase v5 存档头")
    start = unique_id_offset - 4
    version = struct.unpack_from("<i", data, start)[0]
    if version != BG_BINARY_VERSION:
        raise RuntimeError(f"不支持的 BGDatabase 版本：{version}")
    return start


def assert_record_version(version: int, record_name: str) -> int:
    if version != 1:
        raise RuntimeError(f"不支持的 {record_name} 记录版本：{version}")
    return version


def read_addon(reader: BgBinaryReader) -> dict[str, Any]:
    return {
        "version": reader.read_i32(),
        "type": reader.read_string(),
        "config": reader.read_byte_array(),
    }


def read_meta(reader: BgBinaryReader) -> dict[str, Any]:
    return {
        "version": assert_record_version(reader.read_i32(), "meta"),
        "id": reader.read_id(),
        "name": reader.read_string() or "",
        "type": reader.read_string(),
        "config": reader.read_byte_array(),
        "system": reader.read_bool(),
        "addon": reader.read_string(),
        "singleton": reader.read_bool(),
        "userDefinedReadonly": reader.read_bool(),
        "emptyName": reader.read_bool(),
        "controllerType": reader.read_string(),
    }


def read_field(reader: BgBinaryReader) -> dict[str, Any]:
    return {
        "version": assert_record_version(reader.read_i32(), "field"),
        "id": reader.read_id(),
        "name": reader.read_string() or "",
        "fullType": reader.read_string() or "",
        "config": reader.read_byte_array(),
        "system": reader.read_bool(),
        "addon": reader.read_string(),
        "defaultValue": reader.read_string(),
        "required": reader.read_bool(),
        "customStringFormatterType": reader.read_string(),
        "customEditorType": reader.read_string(),
        "controllerType": reader.read_string(),
        "valueBytes": b"",
    }


def read_key(reader: BgBinaryReader) -> dict[str, Any]:
    return {
        "version": assert_record_version(reader.read_i32(), "key"),
        "id": reader.read_id(),
        "name": reader.read_string(),
        "isUnique": reader.read_bool(),
        "fieldIds": reader.read_array(lambda _index: reader.read_id()),
    }


def read_table(reader: BgBinaryReader) -> dict[str, Any]:
    start = reader.offset
    meta = read_meta(reader)
    entity_ids = reader.read_byte_array()

    def read_field_with_values(_index: int) -> dict[str, Any]:
        field = read_field(reader)
        field["valueBytes"] = reader.read_byte_array()
        return field

    fields = reader.read_array(read_field_with_values)
    keys = reader.read_array(lambda _index: read_key(reader))
    return {
        "start": start,
        "end": reader.offset,
        "meta": meta,
        "entityIds": entity_ids,
        "fields": fields,
        "keys": keys,
    }


def is_zipped_settings(addon: dict[str, Any]) -> bool:
    if "BGAddonSettings" not in (addon.get("type") or ""):
        return False
    try:
        reader = BgBinaryReader(addon["config"])
        reader.read_bool()
        return reader.read_bool()
    except Exception:
        return False


def read_repo(data: bytes) -> dict[str, Any]:
    reader = BgBinaryReader(data, repo_start_offset(data))
    version = reader.read_i32()
    if version != BG_BINARY_VERSION:
        raise RuntimeError(f"不支持的 BGDatabase 版本：{version}")

    unique_id = reader.read_id()
    if unique_id != BG_UNIQUE_ID:
        raise RuntimeError("没有找到 BGDatabase v5 存档头")
    if reader.peek_id_equals(BG_ENCRYPTION_ID):
        raise RuntimeError("这个 BGDatabase 启用了加密，当前还不能处理")

    addons = reader.read_array(lambda _index: read_addon(reader))
    if any(is_zipped_settings(addon) for addon in addons):
        raise RuntimeError("这个 BGDatabase 启用了压缩，当前还不能处理")

    tables = reader.read_array(lambda _index: read_table(reader))
    return {
        "version": version,
        "uniqueId": unique_id,
        "addons": addons,
        "tables": tables,
        "start": reader.offset,
    }


def short_field_type(full_type: str) -> str:
    type_name = (full_type.split(",", 1)[0] or full_type).strip()
    match = re.search(r"(?:^|\.)BGField(.+)$", type_name)
    return match.group(1) if match else type_name


def table_row_count(table: dict[str, Any]) -> int:
    return len(table["entityIds"]) // 16


def decode_field_values(field_type: str, data: bytes, row_count: int) -> dict[str, Any]:
    if field_type in ("String", "EntityName"):
        return decode_variable_values(data, row_count, decode_string_payload)
    if field_type == "ListString":
        return decode_variable_values(data, row_count, decode_list_string_payload)
    if field_type == "ListInt":
        return decode_variable_values(data, row_count, decode_list_int_payload)
    if field_type == "Hashtable":
        return decode_variable_values(data, row_count, decode_hashtable_payload)
    if field_type in ("Int", "Enum"):
        return decode_fixed_values(data, row_count, 4, lambda chunk: struct.unpack("<i", chunk)[0])
    if field_type == "Float":
        return decode_fixed_values(data, row_count, 4, lambda chunk: struct.unpack("<f", chunk)[0])
    if field_type == "Long":
        return decode_fixed_values(data, row_count, 8, lambda chunk: struct.unpack("<q", chunk)[0])
    if field_type == "Bool":
        return decode_bool_values(data, row_count)
    raise RuntimeError(f"暂不支持的字段类型 {field_type}")


def decode_variable_values(
    data: bytes,
    row_count: int,
    decode_payload: Callable[[bytes], Any],
) -> dict[str, Any]:
    if not data:
        return {"values": [None] * row_count, "entries": []}

    reader = BgBinaryReader(data)
    count = reader.read_i32()
    entries: list[dict[str, int]] = []
    previous_end = 0
    max_row_index = row_count - 1

    for _index in range(count):
        row_index = reader.read_i32()
        end_offset = reader.read_i32()
        if row_index < 0:
            raise RuntimeError(f"可变字段 rowIndex 异常：{row_index}")
        if end_offset < previous_end:
            raise RuntimeError("可变字段值池 offset 不是递增的")
        entries.append({"rowIndex": row_index, "endOffset": end_offset})
        previous_end = end_offset
        max_row_index = max(max_row_index, row_index)

    pool_offset = reader.offset
    pool_length = len(data) - pool_offset
    if previous_end > pool_length:
        raise RuntimeError("可变字段值池长度不足")

    values = [None] * (max_row_index + 1)
    previous = 0
    for entry in entries:
        values[entry["rowIndex"]] = decode_payload(data[pool_offset + previous:pool_offset + entry["endOffset"]])
        previous = entry["endOffset"]
    return {"values": values, "entries": entries}


def decode_string_payload(data: bytes) -> str:
    return data.decode("utf-8", errors="replace")


def decode_list_string_payload(data: bytes) -> list[str]:
    if len(data) <= 3:
        return []
    reader = BgBinaryReader(data)
    count = reader.read_i32()
    if count < 0 or count > 1_000_000:
        raise RuntimeError(f"ListString 长度异常：{count}")

    values: list[str] = []
    for _index in range(count):
        byte_length = reader.read_i32()
        if byte_length < 0:
            raise RuntimeError(f"ListString 元素长度异常：{byte_length}")
        values.append(reader.read_bytes(byte_length).decode("utf-8", errors="replace") if byte_length else "")
    if reader.offset != reader.length:
        raise RuntimeError(f"ListString 还有未读取数据：{reader.length - reader.offset} bytes")
    return values


def decode_list_int_payload(data: bytes) -> list[int]:
    if not data:
        return []
    if len(data) % 4:
        raise RuntimeError(f"ListInt 字节数 {len(data)} 不能被 4 整除")
    return [struct.unpack_from("<i", data, offset)[0] for offset in range(0, len(data), 4)]


def decode_hashtable_payload(data: bytes) -> dict[str, Any]:
    if not data:
        return {}
    reader = BgBinaryReader(data)
    count = reader.read_i32()
    if count == 0 and reader.offset == reader.length:
        return {}
    raise RuntimeError(f"Hashtable 非空 payload 暂未复现：entries={count}, bytes={len(data)}")


def decode_fixed_values(
    data: bytes,
    row_count: int,
    value_size: int,
    read_value: Callable[[bytes], Any],
) -> dict[str, Any]:
    expected_length = row_count * value_size
    if len(data) != expected_length:
        raise RuntimeError(f"字段值长度 {len(data)} 与行数 {row_count} 不匹配")

    values = []
    for offset in range(0, len(data), value_size):
        value = read_value(data[offset:offset + value_size])
        if isinstance(value, float) and value != value:
            raise RuntimeError("字段值不是有限数字：NaN")
        values.append(value)
    return {"values": values, "valueSize": value_size}


def decode_bool_values(data: bytes, row_count: int) -> dict[str, Any]:
    if len(data) != row_count:
        raise RuntimeError(f"Bool 字段值长度 {len(data)} 与行数 {row_count} 不匹配")
    if any(value not in (0, 1) for value in data):
        raise RuntimeError("Bool 字段包含非 0/1 值")
    return {"values": [bool(value) for value in data], "valueSize": 1}


def rows_from_fields(field_names: list[str], fields: dict[str, dict[str, Any]], row_count: int) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for row_index in range(row_count):
        row: dict[str, Any] = {"index": row_index}
        for name in field_names:
            field = fields.get(name)
            if not field or not field.get("parsed"):
                continue
            values = field.get("values") or []
            row[name] = values[row_index] if row_index < len(values) else None
        rows.append(row)
    return rows


def parse_table(table: dict[str, Any], table_index: int) -> dict[str, Any]:
    row_count = table_row_count(table)
    fields: dict[str, dict[str, Any]] = {}
    field_names: list[str] = []
    field_meta: dict[str, Any] = {}

    for field_index, field_record in enumerate(table["fields"]):
        field_name = field_record["name"]
        field_type = short_field_type(field_record["fullType"])
        field_names.append(field_name)
        try:
            decoded = decode_field_values(field_type, field_record["valueBytes"], row_count)
            fields[field_name] = {
                "name": field_name,
                "fieldType": field_type,
                "values": decoded["values"],
                "parsed": True,
            }
            field_meta[field_name] = {
                "fieldType": field_type,
                "fieldIndex": field_index,
                "valueSize": decoded.get("valueSize"),
                "entryCount": len(decoded.get("entries") or []),
            }
        except Exception as exc:
            fields[field_name] = {
                "name": field_name,
                "fieldType": field_type,
                "values": [],
                "parsed": False,
                "error": str(exc),
            }
            field_meta[field_name] = {
                "fieldType": field_type,
                "fieldIndex": field_index,
                "error": str(exc),
            }

    return {
        "tableIndex": table_index,
        "meta": table["meta"]["name"],
        "range": {"start": table["start"], "end": table["end"]},
        "fieldCount": len(field_names),
        "fields": field_names,
        "fieldMeta": field_meta,
        "rowCount": row_count,
        "rows": rows_from_fields(field_names, fields, row_count),
    }


def extract_tables(source: Path = DEFAULT_SOURCE) -> list[dict[str, Any]]:
    data = Path(source).read_bytes()
    repo = read_repo(data)
    return [parse_table(table, index) for index, table in enumerate(repo["tables"])]


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
