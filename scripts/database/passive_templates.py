from __future__ import annotations

import json
import re
import struct
import subprocess
from pathlib import Path
from typing import Any

from .paths import ROOT
from .utils import natural_key


DEFAULT_DUMPER_DIR = ROOT / "re/.tools/Il2CppDumper-net6-win-v6.7.46"
DEFAULT_DUMPER = DEFAULT_DUMPER_DIR / "Il2CppDumper.exe"
DEFAULT_BINARY = ROOT / "re/jadx/resources/lib/arm64-v8a/libil2cpp.so"
DEFAULT_METADATA = ROOT / "re/jadx/resources/assets/bin/Data/Managed/Metadata/global-metadata.dat"
DEFAULT_SCRIPT_JSON = DEFAULT_DUMPER_DIR / "script.json"
DEFAULT_STRING_LITERAL_JSON = DEFAULT_DUMPER_DIR / "stringliteral.json"
DEFAULT_WUGONG_TABLE = ROOT / "re/raw/tables/004-GWuGong.json"

GET_DESC_NAME = "ExtensionMethods$$GetDesc"
CONCAT_2_ADDRESS = 0x128BE90
CONCAT_3_ADDRESS = 0x128C708
FIRST_PASSIVE_RANGE = {"start": 1, "count": 18}
EXTRA_PASSIVE_RANGE = {"start": 51, "count": 7}


def assert_file(path: Path, label: str) -> None:
    if not path.exists():
        raise RuntimeError(f"找不到{label}：{path}")


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def run_il2cpp_dumper(
    dumper: Path = DEFAULT_DUMPER,
    binary: Path = DEFAULT_BINARY,
    metadata: Path = DEFAULT_METADATA,
) -> None:
    assert_file(dumper, "Il2CppDumper")
    assert_file(binary, "libil2cpp")
    assert_file(metadata, "global-metadata.dat")

    result = subprocess.run(
        [str(dumper), str(binary), str(metadata)],
        cwd=dumper.parent,
        text=True,
        capture_output=True,
        check=False,
        creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
    )
    if result.returncode != 0:
        raise RuntimeError("\n".join(part for part in ["Il2CppDumper 逆向失败", result.stdout, result.stderr] if part))


def ensure_dumper_output(
    *,
    script_json: Path = DEFAULT_SCRIPT_JSON,
    string_literal_json: Path = DEFAULT_STRING_LITERAL_JSON,
    force_dump: bool = False,
    dumper: Path = DEFAULT_DUMPER,
    binary: Path = DEFAULT_BINARY,
    metadata: Path = DEFAULT_METADATA,
) -> dict[str, Path]:
    if force_dump or not script_json.exists() or not string_literal_json.exists():
        run_il2cpp_dumper(dumper=dumper, binary=binary, metadata=metadata)
    assert_file(script_json, "script.json")
    assert_file(string_literal_json, "stringliteral.json")
    return {"script_json": script_json, "string_literal_json": string_literal_json}


def parse_elf_segments(buffer: bytes) -> list[dict[str, int]]:
    if buffer[:4].decode("utf-8", errors="ignore") != "\x7fELF":
        raise RuntimeError("libil2cpp 不是 ELF 文件")
    program_header_offset = struct.unpack_from("<Q", buffer, 32)[0]
    entry_size = struct.unpack_from("<H", buffer, 54)[0]
    count = struct.unpack_from("<H", buffer, 56)[0]
    segments: list[dict[str, int]] = []
    for index in range(count):
        offset = program_header_offset + index * entry_size
        segment_type = struct.unpack_from("<I", buffer, offset)[0]
        if segment_type != 1:
            continue
        file_offset = struct.unpack_from("<Q", buffer, offset + 8)[0]
        virtual_address = struct.unpack_from("<Q", buffer, offset + 16)[0]
        file_size = struct.unpack_from("<Q", buffer, offset + 32)[0]
        memory_size = struct.unpack_from("<Q", buffer, offset + 40)[0]
        segments.append({
            "start": virtual_address,
            "end": virtual_address + memory_size,
            "fileOffset": file_offset,
            "fileSize": file_size,
        })
    return segments


class ElfReader:
    def __init__(self, buffer: bytes):
        self.buffer = buffer
        self.segments = parse_elf_segments(buffer)

    def va_to_offset(self, address: int) -> int:
        for segment in self.segments:
            if address >= segment["start"] and address < segment["start"] + segment["fileSize"]:
                return segment["fileOffset"] + address - segment["start"]
        raise RuntimeError(f"无法映射 VA：0x{address:x}")

    def slice(self, address: int, size: int) -> bytes:
        offset = self.va_to_offset(address)
        return self.buffer[offset:offset + size]

    def read_int32(self, address: int) -> int:
        return struct.unpack_from("<i", self.buffer, self.va_to_offset(address))[0]

    def read_uint32(self, address: int) -> int:
        return struct.unpack_from("<I", self.buffer, self.va_to_offset(address))[0]

    def read_uint64(self, address: int) -> int:
        return struct.unpack_from("<Q", self.buffer, self.va_to_offset(address))[0]


def sign_extend(value: int, bits: int) -> int:
    sign = 1 << (bits - 1)
    size = 1 << bits
    return value - size if value & sign else value


def decode_adrp(word: int, address: int) -> dict[str, int] | None:
    if (word & 0x9F000000) != 0x90000000:
        return None
    register = word & 0x1F
    imm_lo = (word >> 29) & 0x3
    imm_hi = (word >> 5) & 0x7FFFF
    immediate = sign_extend((imm_hi << 2) | imm_lo, 21) * 0x1000
    return {"register": register, "value": (address & ~0xFFF) + immediate}


def decode_add_immediate(word: int) -> dict[str, int] | None:
    if (word & 0x7F000000) != 0x11000000:
        return None
    shift = (word >> 22) & 0x3
    immediate = ((word >> 10) & 0xFFF) << (12 if shift else 0)
    return {"register": word & 0x1F, "base": (word >> 5) & 0x1F, "immediate": immediate}


def decode_ldr_unsigned64(word: int) -> dict[str, int] | None:
    if (word & 0xFFC00000) != 0xF9400000:
        return None
    return {
        "register": word & 0x1F,
        "base": (word >> 5) & 0x1F,
        "displacement": ((word >> 10) & 0xFFF) * 8,
    }


def decode_branch(word: int, address: int) -> int | None:
    if (word & 0xFC000000) != 0x14000000:
        return None
    return address + sign_extend(word & 0x03FFFFFF, 26) * 4


def decode_branch_link(word: int, address: int) -> int | None:
    if (word & 0xFC000000) != 0x94000000:
        return None
    return address + sign_extend(word & 0x03FFFFFF, 26) * 4


def find_get_desc_method(script: dict[str, Any]) -> dict[str, int]:
    methods = script.get("ScriptMethod") or []
    method = next(
        (
            item for item in methods
            if item.get("Name") == GET_DESC_NAME and "beiDongType" in item.get("Signature", "")
        ),
        None,
    )
    if not method:
        raise RuntimeError("没有在 script.json 中找到 ExtensionMethods.GetDesc(BeiDongType, int)")

    next_methods = sorted(
        [item for item in methods if item.get("Address", 0) > method["Address"]],
        key=lambda item: item["Address"],
    )
    if not next_methods:
        raise RuntimeError("无法确定 ExtensionMethods.GetDesc 的函数长度")
    return {"address": method["Address"], "size": next_methods[0]["Address"] - method["Address"]}


def create_string_resolver(reader: ElfReader, string_literals: list[dict[str, Any]]):
    strings = {int(item["address"], 16): item["value"] for item in string_literals}

    def resolve_string_slot(slot_address: int) -> str | None:
        if slot_address >= 0x1F00000:
            return None
        pointer = reader.read_uint64(slot_address)
        for address in (pointer, pointer - 8, pointer - 16):
            if address in strings:
                return strings[address]
        return None

    return resolve_string_slot


def find_jump_tables(reader: ElfReader, function_address: int, function_size: int) -> list[int]:
    registers: dict[int, int] = {}
    table_bases: list[int] = []
    for offset in range(0, function_size, 4):
        address = function_address + offset
        word = reader.read_uint32(address)
        adrp = decode_adrp(word, address)
        if adrp:
            registers[adrp["register"]] = adrp["value"]
            continue

        add = decode_add_immediate(word)
        if not add or add["register"] != 9 or add["base"] != 9 or 9 not in registers:
            continue
        table_base = registers[9] + add["immediate"]
        if table_base not in table_bases:
            table_bases.append(table_base)

    if len(table_bases) < 2:
        raise RuntimeError("没有在 GetDesc 中找到完整的被动跳表")
    return table_bases[:2]


def read_jump_table(reader: ElfReader, base: int, passive_range: dict[str, int]) -> dict[int, int]:
    return {
        passive_range["start"] + index: base + reader.read_int32(base + index * 4)
        for index in range(passive_range["count"])
    }


def parse_block_template(
    reader: ElfReader,
    function_address: int,
    function_size: int,
    resolve_string_slot,
    start_address: int,
) -> str:
    registers: dict[int, int] = {}
    prefix = ""
    suffix = ""
    result = ""
    address = start_address
    steps = 0
    end_address = function_address + function_size

    while function_address <= address < end_address and steps < 100:
        steps += 1
        word = reader.read_uint32(address)

        adrp = decode_adrp(word, address)
        if adrp:
            registers[adrp["register"]] = adrp["value"]
            address += 4
            continue

        add = decode_add_immediate(word)
        if add and add["base"] in registers:
            registers[add["register"]] = registers[add["base"]] + add["immediate"]
            address += 4
            continue

        ldr = decode_ldr_unsigned64(word)
        if ldr and ldr["base"] in registers:
            slot_address = registers[ldr["base"]] + ldr["displacement"]
            registers[ldr["register"]] = reader.read_uint64(slot_address)
            text = resolve_string_slot(slot_address)
            if text and ldr["register"] == 8:
                prefix = text
            if text and ldr["register"] == 9:
                suffix = text
            address += 4
            continue

        branch_link = decode_branch_link(word, address)
        if branch_link == CONCAT_2_ADDRESS:
            result = f"{prefix}{{param}}"
        if branch_link == CONCAT_3_ADDRESS:
            result = f"{prefix}{{param}}{suffix}"

        branch = decode_branch(word, address)
        if branch is not None:
            if result:
                return result
            if branch == function_address + function_size - 0xA8:
                return prefix
            address = branch
            continue

        address += 4

    return result or prefix


def used_wugong_passive_ids(path: Path = DEFAULT_WUGONG_TABLE) -> set[int]:
    table = read_json(path)
    ids: set[int] = set()
    for row in table.get("rows") or []:
        for slot in (1, 2, 3):
            value = row.get(f"beidong{slot}")
            try:
                passive_id = int(float(value))
            except (TypeError, ValueError):
                continue
            if passive_id > 0:
                ids.add(passive_id)
    return ids


def normalize_detail_template(value: str, suffix: str = "") -> str:
    text = re.sub(r"<[^>]+>", "", value)
    text = re.sub(r"^唯一被动-[^：]+：\s*", "", text)
    text = re.sub(r"\s*\+\s*$", "+", text)
    return f"{text}{{param}}{suffix}"


def parse_detail_templates(string_literals: list[dict[str, Any]]) -> list[dict[str, str]]:
    hp = next((item for item in string_literals if "唯一被动-内丹" in item.get("value", "")), None)
    qi_recovery = next((item for item in string_literals if "唯一被动-行脉" in item.get("value", "")), None)
    if not hp or not qi_recovery:
        raise RuntimeError("没有在 stringliteral.json 中找到内丹/行脉模板")

    return [
        {"id": "hp", "template": normalize_detail_template(hp["value"])},
        {"id": "qi_recovery", "template": normalize_detail_template(qi_recovery["value"], "%")},
    ]


def parse_get_desc_templates(
    *,
    binary: Path = DEFAULT_BINARY,
    script_json: Path = DEFAULT_SCRIPT_JSON,
    string_literal_json: Path = DEFAULT_STRING_LITERAL_JSON,
    wu_gong_table: Path = DEFAULT_WUGONG_TABLE,
) -> list[dict[str, str]]:
    script = read_json(script_json)
    string_literals = read_json(string_literal_json)
    reader = ElfReader(binary.read_bytes())
    resolve_string_slot = create_string_resolver(reader, string_literals)
    method = find_get_desc_method(script)
    first_table_base, extra_table_base = find_jump_tables(reader, method["address"], method["size"])
    targets = {
        **read_jump_table(reader, first_table_base, FIRST_PASSIVE_RANGE),
        **read_jump_table(reader, extra_table_base, EXTRA_PASSIVE_RANGE),
    }
    used_ids = used_wugong_passive_ids(wu_gong_table)

    rows: list[dict[str, str]] = []
    for passive_id in sorted(used_ids):
        target = targets.get(passive_id)
        if not target:
            raise RuntimeError(f"GetDesc 跳表中没有被动 id：{passive_id}")
        template = parse_block_template(reader, method["address"], method["size"], resolve_string_slot, target)
        if not template:
            raise RuntimeError(f"没有解析出被动 id {passive_id} 的模板")
        rows.append({"id": str(passive_id), "template": template})
    return rows


def martial_art_passive_template_rows(**options: Any) -> list[dict[str, str]]:
    dumper_output = ensure_dumper_output(
        script_json=options.get("script_json", DEFAULT_SCRIPT_JSON),
        string_literal_json=options.get("string_literal_json", DEFAULT_STRING_LITERAL_JSON),
        force_dump=options.get("force_dump", False),
        dumper=options.get("dumper", DEFAULT_DUMPER),
        binary=options.get("binary", DEFAULT_BINARY),
        metadata=options.get("metadata", DEFAULT_METADATA),
    )
    rows = [
        *parse_get_desc_templates(
            binary=options.get("binary", DEFAULT_BINARY),
            script_json=dumper_output["script_json"],
            string_literal_json=dumper_output["string_literal_json"],
            wu_gong_table=options.get("wu_gong_table", DEFAULT_WUGONG_TABLE),
        ),
        *parse_detail_templates(read_json(dumper_output["string_literal_json"])),
    ]
    return sorted(rows, key=lambda item: natural_key(item["id"]))
