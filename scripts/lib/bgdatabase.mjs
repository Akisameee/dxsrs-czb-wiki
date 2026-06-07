import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
export const DEFAULT_SOURCE = join(ROOT, "resource/assets/bin/Data/8c496bdddc14441489a3cf750a42c690");
export const DATA_DIR = join(ROOT, "public/data");
export const RAW_DIR = join(ROOT, "re/raw");

const FIELD_RE = /([A-Za-z0-9_]+)([abcde])\x00\x00\x00BansheeGz\.BGDatabase\.BGField([A-Za-z]+),/g;
const CLASS_END = Buffer.from("PublicKeyToken=null", "utf8");

function readU32(data, offset) {
  return data.readUInt32LE(offset);
}

function readI32(data, offset) {
  return data.readInt32LE(offset);
}

function readF32(data, offset) {
  return data.readFloatLE(offset);
}

function readI64(data, offset) {
  return data.readBigInt64LE(offset);
}

function integerSet(min, max) {
  return new Set(Array.from({ length: max - min + 1 }, (_, index) => min + index));
}

function findAllMetaRanges(data) {
  const segment = data.toString("latin1");
  const re = /([A-Za-z0-9_]+)a\x00\x00\x00BansheeGz\.BGDatabase\.BGMetaRow/g;
  const matches = [...segment.matchAll(re)]
    .map((match) => ({ name: match[1], start: match.index }))
    .filter((match, index, list) => index === 0 || match.start !== list[index - 1].start);

  return matches.map((match, index) => ({
    name: match.name,
    start: match.start,
    end: matches[index + 1]?.start ?? data.length,
  }));
}

function fieldMarkers(data, start, end) {
  const segment = data.subarray(start, end).toString("latin1");
  const markers = [];
  FIELD_RE.lastIndex = 0;

  for (const match of segment.matchAll(FIELD_RE)) {
    const offset = start + match.index;
    const classEndAt = data.indexOf(CLASS_END, offset);
    if (classEndAt < 0) continue;
    markers.push({
      name: match[1],
      kind: match[2],
      fieldType: match[3],
      offset,
      classEnd: classEndAt + CLASS_END.length,
    });
  }
  return markers;
}

function parseStringField(data, classEnd, expectedCounts) {
  const countSet = expectedCounts instanceof Set ? expectedCounts : new Set(expectedCounts);
  for (let lengthOffset = classEnd; lengthOffset < classEnd + 96; lengthOffset += 1) {
    const totalLength = readU32(data, lengthOffset);
    const count = readU32(data, lengthOffset + 4);
    if (!countSet.has(count)) continue;
    if (totalLength < 12 || totalLength > 1000000) continue;

    const entriesStart = lengthOffset + 8;
    const poolStart = entriesStart + count * 8;
    const poolLength = totalLength - (4 + count * 8);
    if (poolLength < 0 || poolStart + poolLength > data.length) continue;

    const entries = [];
    let ok = true;
    let previousEnd = 0;
    let maxRowIndex = 0;
    for (let index = 0; index < count; index += 1) {
      const rowIndex = readU32(data, entriesStart + index * 8);
      const endOffset = readU32(data, entriesStart + index * 8 + 4);
      if (endOffset > poolLength || endOffset < previousEnd) {
        ok = false;
        break;
      }
      entries.push([rowIndex, endOffset]);
      previousEnd = endOffset;
      maxRowIndex = Math.max(maxRowIndex, rowIndex);
    }
    if (!ok) continue;

    const pool = data.subarray(poolStart, poolStart + poolLength);
    const decoded = pool.toString("utf8");
    const replacementCount = (decoded.match(/\uFFFD/g) || []).length;
    if (replacementCount > Math.max(2, decoded.length / 20)) continue;

    const values = Array(maxRowIndex + 1).fill(null);
    let previous = 0;
    for (const [rowIndex, endOffset] of entries) {
      values[rowIndex] = pool.subarray(previous, endOffset).toString("utf8");
      previous = endOffset;
    }
    return { values, details: { lengthOffset, totalLength, count } };
  }
  throw new Error(`Cannot parse string field near ${classEnd}`);
}

function parseI32Field(data, classEnd, expectedCounts) {
  const expectedLengths = new Map([...expectedCounts].map((count) => [count * 4, count]));
  for (let lengthOffset = classEnd; lengthOffset < classEnd + 256; lengthOffset += 1) {
    const totalLength = readU32(data, lengthOffset);
    const count = expectedLengths.get(totalLength);
    if (!count) continue;

    const valuesStart = lengthOffset + 4;
    const values = [];
    let ok = true;
    for (let index = 0; index < count; index += 1) {
      const value = readI32(data, valuesStart + index * 4);
      if (value < -100000 || value > 100000) {
        ok = false;
        break;
      }
      values.push(value);
    }
    if (ok) return { values, details: { lengthOffset, totalLength, count } };
  }
  throw new Error(`Cannot parse int/enum field near ${classEnd}`);
}

function parseF32Field(data, classEnd, expectedCounts) {
  const expectedLengths = new Map([...expectedCounts].map((count) => [count * 4, count]));
  for (let lengthOffset = classEnd; lengthOffset < classEnd + 256; lengthOffset += 1) {
    const totalLength = readU32(data, lengthOffset);
    const count = expectedLengths.get(totalLength);
    if (!count) continue;

    const valuesStart = lengthOffset + 4;
    const values = [];
    let ok = true;
    for (let index = 0; index < count; index += 1) {
      const value = readF32(data, valuesStart + index * 4);
      if (!Number.isFinite(value) || Math.abs(value) > 1000000) {
        ok = false;
        break;
      }
      values.push(value);
    }
    if (ok) return { values, details: { lengthOffset, totalLength, count } };
  }
  throw new Error(`Cannot parse float field near ${classEnd}`);
}

function parseI64Field(data, classEnd, expectedCounts) {
  const expectedLengths = new Map([...expectedCounts].map((count) => [count * 8, count]));
  for (let lengthOffset = classEnd; lengthOffset < classEnd + 256; lengthOffset += 1) {
    const totalLength = readU32(data, lengthOffset);
    const count = expectedLengths.get(totalLength);
    if (!count) continue;

    const valuesStart = lengthOffset + 4;
    const values = [];
    let ok = true;
    for (let index = 0; index < count; index += 1) {
      const value = readI64(data, valuesStart + index * 8);
      const asNumber = Number(value);
      if (!Number.isSafeInteger(asNumber)) {
        ok = false;
        break;
      }
      values.push(asNumber);
    }
    if (ok) return { values, details: { lengthOffset, totalLength, count } };
  }
  throw new Error(`Cannot parse long field near ${classEnd}`);
}

function parseBoolField(data, classEnd, expectedCounts) {
  const countSet = expectedCounts instanceof Set ? expectedCounts : new Set(expectedCounts);
  for (let lengthOffset = classEnd; lengthOffset < classEnd + 256; lengthOffset += 1) {
    const totalLength = readU32(data, lengthOffset);
    if (!countSet.has(totalLength)) continue;

    const valuesStart = lengthOffset + 4;
    const raw = data.subarray(valuesStart, valuesStart + totalLength);
    if (![...raw].every((value) => value === 0 || value === 1)) continue;
    return {
      values: [...raw].map(Boolean),
      details: { lengthOffset, totalLength, count: totalLength },
    };
  }
  throw new Error(`Cannot parse bool field near ${classEnd}`);
}

function rowsFromFields(fields) {
  const lengths = Object.values(fields).map((values) => values.length);
  const rowCount = lengths.length ? Math.max(...lengths) : 0;
  return Array.from({ length: rowCount }, (_, index) => {
    const row = { index };
    for (const [name, values] of Object.entries(fields)) {
      row[name] = index < values.length ? values[index] : null;
    }
    return row;
  });
}

function parseTypedField(data, marker, expectedCounts) {
  if (marker.fieldType === "String" || marker.fieldType === "EntityName") {
    return parseStringField(data, marker.classEnd, expectedCounts);
  }
  if (marker.fieldType === "Int" || marker.fieldType === "Enum") {
    return parseI32Field(data, marker.classEnd, expectedCounts);
  }
  if (marker.fieldType === "Float") {
    return parseF32Field(data, marker.classEnd, expectedCounts);
  }
  if (marker.fieldType === "Long") {
    return parseI64Field(data, marker.classEnd, expectedCounts);
  }
  if (marker.fieldType === "Bool") {
    return parseBoolField(data, marker.classEnd, expectedCounts);
  }
  return null;
}

function parseTable(data, range, tableIndex) {
  const markers = fieldMarkers(data, range.start, range.end);
  const fields = {};
  const fieldMeta = {};
  const flexibleStringCounts = integerSet(1, 5000);

  for (const marker of markers) {
    if (marker.fieldType !== "String" && marker.fieldType !== "EntityName") continue;
    try {
      const parsed = parseStringField(data, marker.classEnd, flexibleStringCounts);
      fields[marker.name] = parsed.values;
      fieldMeta[marker.name] = {
        fieldType: marker.fieldType,
        offset: marker.offset,
        ...parsed.details,
      };
    } catch (error) {
      fieldMeta[marker.name] = {
        fieldType: marker.fieldType,
        offset: marker.offset,
        error: error.message,
      };
    }
  }

  const rowCount = rowsFromFields(fields).length;
  const expectedCounts = rowCount ? new Set([rowCount]) : integerSet(1, 5000);

  for (const marker of markers) {
    if (fields[marker.name] || marker.fieldType === "String" || marker.fieldType === "EntityName") continue;
    try {
      const parsed = parseTypedField(data, marker, expectedCounts);
      if (!parsed) {
        fieldMeta[marker.name] = {
          fieldType: marker.fieldType,
          offset: marker.offset,
          skipped: "Unsupported field type",
        };
        continue;
      }

      fields[marker.name] = parsed.values;
      fieldMeta[marker.name] = {
        fieldType: marker.fieldType,
        offset: marker.offset,
        ...parsed.details,
      };
    } catch (error) {
      fieldMeta[marker.name] = {
        fieldType: marker.fieldType,
        offset: marker.offset,
        error: error.message,
      };
    }
  }

  const rows = rowsFromFields(fields);
  return {
    tableIndex,
    meta: range.name,
    range: { start: range.start, end: range.end },
    fieldCount: markers.length,
    fields: markers.map((marker) => marker.name),
    fieldMeta,
    rowCount: rows.length,
    rows,
  };
}

export function extractTables(source = DEFAULT_SOURCE) {
  const data = readFileSync(source);
  const ranges = findAllMetaRanges(data);
  return ranges.map((range, tableIndex) => parseTable(data, range, tableIndex));
}

export function deriveChainEnums(chainRows) {
  const sect = { 15: null };
  const style = { 0: null };

  for (const row of chainRows) {
    if (row.chnname === null || row.chnname === undefined) continue;
    if (row.fengge === 0 && row.menpai !== 15 && sect[row.menpai] === undefined) {
      sect[row.menpai] = row.chnname;
    }
    if (row.fengge !== 0 && style[row.fengge] === undefined) {
      style[row.fengge] = row.chnname;
    }
  }

  return {
    source: "GLianSuo",
    enumTypes: {
      LianSuo_MP: Object.fromEntries(Object.entries(sect).sort(([a], [b]) => Number(a) - Number(b))),
      LianSuo_FG: Object.fromEntries(Object.entries(style).sort(([a], [b]) => Number(a) - Number(b))),
    },
    note: "LianSuo_MP=15 is used by style-chain rows as a no-sect placeholder; it is not a sect name.",
  };
}

export function readJson(path, fallback = null) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, "utf8"));
}

export function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
