import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPT_DIR, "../..");
const DEFAULT_DUMPER_DIR = join(ROOT, "re/.tools/Il2CppDumper-net6-win-v6.7.46");
const DEFAULT_DUMPER = join(DEFAULT_DUMPER_DIR, "Il2CppDumper.exe");
const DEFAULT_BINARY = join(ROOT, "re/jadx/resources/lib/arm64-v8a/libil2cpp.so");
const DEFAULT_METADATA = join(ROOT, "re/jadx/resources/assets/bin/Data/Managed/Metadata/global-metadata.dat");
const DEFAULT_SCRIPT_JSON = join(DEFAULT_DUMPER_DIR, "script.json");
const DEFAULT_STRING_LITERAL_JSON = join(DEFAULT_DUMPER_DIR, "stringliteral.json");
const DEFAULT_WUGONG_TABLE = join(ROOT, "re/raw/tables/004-GWuGong.json");

const GET_DESC_NAME = "ExtensionMethods$$GetDesc";
const CONCAT_2_ADDRESS = 0x128be90;
const CONCAT_3_ADDRESS = 0x128c708;
const FIRST_PASSIVE_RANGE = { start: 1, count: 18 };
const EXTRA_PASSIVE_RANGE = { start: 51, count: 7 };

function assertFile(path, label) {
  if (!existsSync(path)) throw new Error(`找不到${label}：${path}`);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function runIl2CppDumper({
  dumper = DEFAULT_DUMPER,
  binary = DEFAULT_BINARY,
  metadata = DEFAULT_METADATA,
} = {}) {
  assertFile(dumper, "Il2CppDumper");
  assertFile(binary, "libil2cpp");
  assertFile(metadata, "global-metadata.dat");

  const result = spawnSync(dumper, [binary, metadata], {
    cwd: dirname(dumper),
    encoding: "utf8",
    windowsHide: true,
  });

  if (result.status !== 0) {
    throw new Error([
      "Il2CppDumper 逆向失败",
      result.stdout,
      result.stderr,
    ].filter(Boolean).join("\n"));
  }
}

function ensureDumperOutput(options) {
  const scriptJson = options.scriptJson || DEFAULT_SCRIPT_JSON;
  const stringLiteralJson = options.stringLiteralJson || DEFAULT_STRING_LITERAL_JSON;
  if (!existsSync(scriptJson) || !existsSync(stringLiteralJson) || options.forceDump) {
    runIl2CppDumper(options);
  }
  assertFile(scriptJson, "script.json");
  assertFile(stringLiteralJson, "stringliteral.json");
  return { scriptJson, stringLiteralJson };
}

function parseElfSegments(buffer) {
  if (buffer.toString("utf8", 0, 4) !== "\x7fELF") {
    throw new Error("libil2cpp 不是 ELF 文件");
  }
  const programHeaderOffset = Number(buffer.readBigUInt64LE(32));
  const programHeaderEntrySize = buffer.readUInt16LE(54);
  const programHeaderCount = buffer.readUInt16LE(56);
  const segments = [];

  for (let index = 0; index < programHeaderCount; index += 1) {
    const offset = programHeaderOffset + index * programHeaderEntrySize;
    const type = buffer.readUInt32LE(offset);
    if (type !== 1) continue;
    const fileOffset = Number(buffer.readBigUInt64LE(offset + 8));
    const virtualAddress = Number(buffer.readBigUInt64LE(offset + 16));
    const fileSize = Number(buffer.readBigUInt64LE(offset + 32));
    const memorySize = Number(buffer.readBigUInt64LE(offset + 40));
    segments.push({
      start: virtualAddress,
      end: virtualAddress + memorySize,
      fileOffset,
      fileSize,
    });
  }

  return segments;
}

function createElfReader(buffer) {
  const segments = parseElfSegments(buffer);

  function vaToOffset(address) {
    const segment = segments.find((item) => (
      address >= item.start && address < item.start + item.fileSize
    ));
    if (!segment) throw new Error(`无法映射 VA：0x${address.toString(16)}`);
    return segment.fileOffset + address - segment.start;
  }

  return {
    slice(address, size) {
      const offset = vaToOffset(address);
      return buffer.subarray(offset, offset + size);
    },
    readInt32(address) {
      return buffer.readInt32LE(vaToOffset(address));
    },
    readUInt32(address) {
      return buffer.readUInt32LE(vaToOffset(address));
    },
    readUInt64(address) {
      return Number(buffer.readBigUInt64LE(vaToOffset(address)));
    },
  };
}

function signExtend(value, bits) {
  const sign = 1 << (bits - 1);
  const size = 1 << bits;
  return value & sign ? value - size : value;
}

function decodeAdrp(word, address) {
  if (((word & 0x9f000000) >>> 0) !== 0x90000000) return null;
  const register = word & 0x1f;
  const immLo = (word >>> 29) & 0x3;
  const immHi = (word >>> 5) & 0x7ffff;
  const immediate = signExtend((immHi << 2) | immLo, 21) * 0x1000;
  return {
    register,
    value: (address & ~0xfff) + immediate,
  };
}

function decodeAddImmediate(word) {
  if (((word & 0x7f000000) >>> 0) !== 0x11000000) return null;
  const register = word & 0x1f;
  const base = (word >>> 5) & 0x1f;
  const shift = (word >>> 22) & 0x3;
  const immediate = ((word >>> 10) & 0xfff) << (shift ? 12 : 0);
  return { register, base, immediate };
}

function decodeLdrUnsigned64(word) {
  if (((word & 0xffc00000) >>> 0) !== 0xf9400000) return null;
  return {
    register: word & 0x1f,
    base: (word >>> 5) & 0x1f,
    displacement: ((word >>> 10) & 0xfff) * 8,
  };
}

function decodeBranch(word, address) {
  if (((word & 0xfc000000) >>> 0) !== 0x14000000) return null;
  return address + signExtend(word & 0x03ffffff, 26) * 4;
}

function decodeBranchLink(word, address) {
  if (((word & 0xfc000000) >>> 0) !== 0x94000000) return null;
  return address + signExtend(word & 0x03ffffff, 26) * 4;
}

function findGetDescMethod(script) {
  const methods = script.ScriptMethod || [];
  const method = methods.find((item) => (
    item.Name === GET_DESC_NAME && item.Signature.includes("beiDongType")
  ));
  if (!method) throw new Error("没有在 script.json 中找到 ExtensionMethods.GetDesc(BeiDongType, int)");

  const nextMethod = methods
    .filter((item) => item.Address > method.Address)
    .sort((a, b) => a.Address - b.Address)[0];
  if (!nextMethod) throw new Error("无法确定 ExtensionMethods.GetDesc 的函数长度");

  return {
    address: method.Address,
    size: nextMethod.Address - method.Address,
  };
}

function createStringResolver(reader, stringLiterals) {
  const strings = new Map(stringLiterals.map((item) => [Number.parseInt(item.address, 16), item.value]));

  return function resolveStringSlot(slotAddress) {
    // The function loads Il2CppString* from relocated global slots. The string object
    // itself is later in memory; only the global slot should be treated as a source.
    if (slotAddress >= 0x1f00000) return null;

    const pointer = reader.readUInt64(slotAddress);
    for (const address of [pointer, pointer - 8, pointer - 16]) {
      if (strings.has(address)) return strings.get(address);
    }
    return null;
  };
}

function findJumpTables(reader, functionAddress, functionSize) {
  const registers = new Map();
  const tableBases = [];

  for (let offset = 0; offset < functionSize; offset += 4) {
    const address = functionAddress + offset;
    const word = reader.readUInt32(address);
    const adrp = decodeAdrp(word, address);
    if (adrp) {
      registers.set(adrp.register, adrp.value);
      continue;
    }

    const add = decodeAddImmediate(word);
    if (!add || add.register !== 9 || add.base !== 9 || !registers.has(9)) continue;
    const tableBase = registers.get(9) + add.immediate;
    if (!tableBases.includes(tableBase)) tableBases.push(tableBase);
  }

  if (tableBases.length < 2) {
    throw new Error("没有在 GetDesc 中找到完整的被动跳表");
  }
  return tableBases.slice(0, 2);
}

function readJumpTable(reader, base, { start, count }) {
  const entries = new Map();
  for (let index = 0; index < count; index += 1) {
    entries.set(start + index, base + reader.readInt32(base + index * 4));
  }
  return entries;
}

function parseBlockTemplate(reader, functionAddress, functionSize, resolveStringSlot, startAddress) {
  const registers = new Map();
  let prefix = "";
  let suffix = "";
  let result = "";
  let address = startAddress;
  let steps = 0;
  const endAddress = functionAddress + functionSize;

  while (address >= functionAddress && address < endAddress && steps < 100) {
    steps += 1;
    const word = reader.readUInt32(address);

    const adrp = decodeAdrp(word, address);
    if (adrp) {
      registers.set(adrp.register, adrp.value);
      address += 4;
      continue;
    }

    const add = decodeAddImmediate(word);
    if (add && registers.has(add.base)) {
      registers.set(add.register, registers.get(add.base) + add.immediate);
      address += 4;
      continue;
    }

    const ldr = decodeLdrUnsigned64(word);
    if (ldr && registers.has(ldr.base)) {
      const slotAddress = registers.get(ldr.base) + ldr.displacement;
      registers.set(ldr.register, reader.readUInt64(slotAddress));

      const text = resolveStringSlot(slotAddress);
      if (text && ldr.register === 8) prefix = text;
      if (text && ldr.register === 9) suffix = text;

      address += 4;
      continue;
    }

    const branchLink = decodeBranchLink(word, address);
    if (branchLink === CONCAT_2_ADDRESS) result = `${prefix}{param}`;
    if (branchLink === CONCAT_3_ADDRESS) result = `${prefix}{param}${suffix}`;

    const branch = decodeBranch(word, address);
    if (branch !== null) {
      if (result) return result;
      if (branch === functionAddress + functionSize - 0xa8) return prefix;
      address = branch;
      continue;
    }

    address += 4;
  }

  return result || prefix;
}

function usedWuGongPassiveIds(path = DEFAULT_WUGONG_TABLE) {
  const table = readJson(path);
  const ids = new Set();
  for (const row of table.rows || []) {
    for (const slot of [1, 2, 3]) {
      const id = Number(row[`beidong${slot}`]);
      if (Number.isFinite(id) && id > 0) ids.add(id);
    }
  }
  return ids;
}

function normalizeDetailTemplate(value, suffix = "") {
  const text = value
    .replace(/<[^>]+>/g, "")
    .replace(/^唯一被动-[^：]+：\s*/, "")
    .replace(/\s*\+\s*$/, "+");
  return `${text}{param}${suffix}`;
}

function parseDetailTemplates(stringLiterals) {
  const hp = stringLiterals.find((item) => item.value.includes("唯一被动-内丹"));
  const qiRecovery = stringLiterals.find((item) => item.value.includes("唯一被动-行脉"));
  if (!hp || !qiRecovery) throw new Error("没有在 stringliteral.json 中找到内丹/行脉模板");

  return [
    { id: "hp", template: normalizeDetailTemplate(hp.value) },
    { id: "qi_recovery", template: normalizeDetailTemplate(qiRecovery.value, "%") },
  ];
}

function parseGetDescTemplates({
  binary = DEFAULT_BINARY,
  scriptJson = DEFAULT_SCRIPT_JSON,
  stringLiteralJson = DEFAULT_STRING_LITERAL_JSON,
  wuGongTable = DEFAULT_WUGONG_TABLE,
} = {}) {
  const script = readJson(scriptJson);
  const stringLiterals = readJson(stringLiteralJson);
  const binaryBuffer = readFileSync(binary);
  const reader = createElfReader(binaryBuffer);
  const resolveStringSlot = createStringResolver(reader, stringLiterals);
  const method = findGetDescMethod(script);
  const [firstTableBase, extraTableBase] = findJumpTables(reader, method.address, method.size);
  const targets = new Map([
    ...readJumpTable(reader, firstTableBase, FIRST_PASSIVE_RANGE),
    ...readJumpTable(reader, extraTableBase, EXTRA_PASSIVE_RANGE),
  ]);
  const usedIds = usedWuGongPassiveIds(wuGongTable);

  const rows = [];
  for (const id of [...usedIds].sort((a, b) => a - b)) {
    const target = targets.get(id);
    if (!target) throw new Error(`GetDesc 跳表中没有被动 id：${id}`);
    const template = parseBlockTemplate(reader, method.address, method.size, resolveStringSlot, target);
    if (!template) throw new Error(`没有解析出被动 id ${id} 的模板`);
    rows.push({ id: String(id), template });
  }
  return rows;
}

export function martialArtPassiveTemplateRows(options = {}) {
  const dumperOutput = ensureDumperOutput(options);
  return [
    ...parseGetDescTemplates({ ...options, ...dumperOutput }),
    ...parseDetailTemplates(readJson(dumperOutput.stringLiteralJson)),
  ].sort((a, b) => String(a.id).localeCompare(String(b.id), "zh-Hans-CN", { numeric: true }));
}
