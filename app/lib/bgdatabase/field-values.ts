import { BgBinaryReader } from "./binary";
import type { BgDatabaseFieldType, BgDatabaseValue } from "./types";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder("utf-8", { fatal: false });

export type DecodedFieldValues = {
  values: BgDatabaseValue[];
  valueSize?: number;
  entries?: Array<{ rowIndex: number; endOffset: number }>;
};

export function shortFieldType(fullType: string) {
  const typeName = fullType.split(",", 1)[0]?.trim() || fullType;
  const match = /(?:^|\.)BGField(.+)$/.exec(typeName);
  return match?.[1] || typeName;
}

export function decodeFieldValues(fieldType: BgDatabaseFieldType, bytes: Uint8Array, rowCount: number) {
  if (fieldType === "String" || fieldType === "EntityName") {
    return decodeVariableValues(bytes, rowCount, decodeStringPayload);
  }
  if (fieldType === "ListString") {
    return decodeVariableValues(bytes, rowCount, decodeListStringPayload);
  }
  if (fieldType === "ListInt") {
    return decodeVariableValues(bytes, rowCount, decodeListIntPayload);
  }
  if (fieldType === "Hashtable") {
    return decodeVariableValues(bytes, rowCount, decodeHashtablePayload);
  }
  if (fieldType === "Int" || fieldType === "Enum") {
    return decodeFixedValues(bytes, rowCount, 4, (view, offset) => view.getInt32(offset, true));
  }
  if (fieldType === "Float") {
    return decodeFixedValues(bytes, rowCount, 4, (view, offset) => view.getFloat32(offset, true));
  }
  if (fieldType === "Long") {
    return decodeFixedValues(bytes, rowCount, 8, (view, offset) => Number(view.getBigInt64(offset, true)));
  }
  if (fieldType === "Bool") {
    return decodeBoolValues(bytes, rowCount);
  }

  throw new Error(`暂不支持的字段类型 ${fieldType}`);
}

export function encodeFieldValues(fieldType: BgDatabaseFieldType, values: BgDatabaseValue[], rowCount: number) {
  if (fieldType === "String" || fieldType === "EntityName") return encodeVariableValues(values, encodeStringPayload);
  if (fieldType === "ListString") return encodeVariableValues(values, encodeListStringPayload);
  if (fieldType === "ListInt") return encodeVariableValues(values, encodeListIntPayload);
  if (fieldType === "Hashtable") return encodeVariableValues(values, encodeHashtablePayload);
  if (fieldType === "Int" || fieldType === "Enum") return encodeInt32Values(values, rowCount);
  if (fieldType === "Float") return encodeFloat32Values(values, rowCount);
  if (fieldType === "Long") return encodeInt64Values(values, rowCount);
  if (fieldType === "Bool") return encodeBoolValues(values, rowCount);
  throw new Error(`暂不支持写入字段类型 ${fieldType}`);
}

function decodeVariableValues(
  bytes: Uint8Array,
  rowCount: number,
  decodePayload: (bytes: Uint8Array) => BgDatabaseValue,
): DecodedFieldValues {
  if (!bytes.length) return { values: Array.from({ length: rowCount }, () => null), entries: [] };

  const reader = new BgBinaryReader(bytes);
  const count = reader.readInt32();
  const entries: Array<{ rowIndex: number; endOffset: number }> = [];
  let previousEnd = 0;
  let maxRowIndex = rowCount - 1;

  for (let index = 0; index < count; index += 1) {
    const rowIndex = reader.readInt32();
    const endOffset = reader.readInt32();
    if (rowIndex < 0) throw new Error(`可变字段 rowIndex 异常：${rowIndex}`);
    if (endOffset < previousEnd) throw new Error("可变字段值池 offset 不是递增的");
    entries.push({ rowIndex, endOffset });
    previousEnd = endOffset;
    maxRowIndex = Math.max(maxRowIndex, rowIndex);
  }

  const poolOffset = reader.offset;
  const poolLength = bytes.length - poolOffset;
  if (previousEnd > poolLength) throw new Error("可变字段值池长度不足");

  const values: BgDatabaseValue[] = Array.from({ length: maxRowIndex + 1 }, () => null);
  let previous = 0;
  for (const entry of entries) {
    values[entry.rowIndex] = decodePayload(bytes.slice(poolOffset + previous, poolOffset + entry.endOffset));
    previous = entry.endOffset;
  }
  return { values, entries };
}

function decodeStringPayload(bytes: Uint8Array) {
  return textDecoder.decode(bytes);
}

function decodeListStringPayload(bytes: Uint8Array): string[] {
  if (bytes.length <= 3) return [];
  const reader = new BgBinaryReader(bytes);
  const count = reader.readInt32();
  if (count < 0 || count > 1_000_000) throw new Error(`ListString 长度异常：${count}`);

  const values: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const byteLength = reader.readInt32();
    if (byteLength < 0) throw new Error(`ListString 元素长度异常：${byteLength}`);
    values.push(byteLength ? textDecoder.decode(reader.readBytes(byteLength)) : "");
  }
  if (reader.offset !== reader.length) throw new Error(`ListString 还有未读取数据：${reader.length - reader.offset} bytes`);
  return values;
}

function decodeListIntPayload(bytes: Uint8Array): number[] {
  if (!bytes.length) return [];
  if (bytes.length % 4 !== 0) throw new Error(`ListInt 字节数 ${bytes.length} 不能被 4 整除`);

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const values: number[] = [];
  for (let offset = 0; offset < bytes.length; offset += 4) {
    values.push(view.getInt32(offset, true));
  }
  return values;
}

function decodeHashtablePayload(bytes: Uint8Array): Record<string, unknown> {
  if (!bytes.length) return {};
  const reader = new BgBinaryReader(bytes);
  const count = reader.readInt32();
  if (count === 0 && reader.offset === reader.length) return {};
  throw new Error(`Hashtable 非空 payload 暂未复现：entries=${count}, bytes=${bytes.length}`);
}

function decodeFixedValues(
  bytes: Uint8Array,
  rowCount: number,
  valueSize: number,
  read: (view: DataView, offset: number) => number,
): DecodedFieldValues {
  const expectedLength = rowCount * valueSize;
  if (bytes.length !== expectedLength) {
    throw new Error(`字段值长度 ${bytes.length} 与行数 ${rowCount} 不匹配`);
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const values: number[] = [];
  for (let index = 0; index < rowCount; index += 1) {
    const value = read(view, index * valueSize);
    if (!Number.isFinite(value)) throw new Error(`字段值不是有限数字：${value}`);
    values.push(value);
  }
  return { values, valueSize };
}

function decodeBoolValues(bytes: Uint8Array, rowCount: number): DecodedFieldValues {
  if (bytes.length !== rowCount) {
    throw new Error(`Bool 字段值长度 ${bytes.length} 与行数 ${rowCount} 不匹配`);
  }
  if (!bytes.every((value) => value === 0 || value === 1)) {
    throw new Error("Bool 字段包含非 0/1 值");
  }
  return { values: [...bytes].map(Boolean), valueSize: 1 };
}

function encodeVariableValues(values: BgDatabaseValue[], encodePayload: (value: BgDatabaseValue) => Uint8Array) {
  const entries = values.flatMap((value, rowIndex) => {
    const bytes = encodePayload(value);
    return bytes.length ? [{ rowIndex, bytes }] : [];
  });
  const poolLength = entries.reduce((sum, entry) => sum + entry.bytes.length, 0);
  const output = new Uint8Array(4 + entries.length * 8 + poolLength);
  const view = new DataView(output.buffer);
  view.setInt32(0, entries.length, true);

  let endOffset = 0;
  let poolOffset = 4 + entries.length * 8;
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    if (!entry) continue;
    endOffset += entry.bytes.length;
    view.setInt32(4 + index * 8, entry.rowIndex, true);
    view.setInt32(4 + index * 8 + 4, endOffset, true);
    output.set(entry.bytes, poolOffset);
    poolOffset += entry.bytes.length;
  }
  return output;
}

function encodeStringPayload(value: BgDatabaseValue) {
  const stringValue = value === null || value === undefined ? "" : String(value);
  return stringValue ? textEncoder.encode(stringValue) : new Uint8Array();
}

function encodeListStringPayload(value: BgDatabaseValue) {
  if (!Array.isArray(value) || !value.length) return new Uint8Array();
  const items = value.map((item) => textEncoder.encode(item === null || item === undefined ? "" : String(item)));
  const output = new Uint8Array(4 + items.reduce((sum, item) => sum + 4 + item.length, 0));
  const view = new DataView(output.buffer);
  view.setInt32(0, items.length, true);

  let offset = 4;
  for (const item of items) {
    view.setInt32(offset, item.length, true);
    offset += 4;
    output.set(item, offset);
    offset += item.length;
  }
  return output;
}

function encodeListIntPayload(value: BgDatabaseValue) {
  if (!Array.isArray(value) || !value.length) return new Uint8Array();
  const output = new Uint8Array(value.length * 4);
  const view = new DataView(output.buffer);
  value.forEach((item, index) => view.setInt32(index * 4, Math.round(Number(item) || 0), true));
  return output;
}

function encodeHashtablePayload(value: BgDatabaseValue) {
  if (!value || typeof value !== "object" || Array.isArray(value) || !Object.keys(value).length) return new Uint8Array();
  throw new Error("非空 Hashtable 写入暂未复现");
}

function encodeInt32Values(values: BgDatabaseValue[], rowCount: number) {
  const output = new Uint8Array(rowCount * 4);
  const view = new DataView(output.buffer);
  for (let index = 0; index < rowCount; index += 1) {
    view.setInt32(index * 4, Math.round(numberValue(values[index] ?? null)), true);
  }
  return output;
}

function encodeFloat32Values(values: BgDatabaseValue[], rowCount: number) {
  const output = new Uint8Array(rowCount * 4);
  const view = new DataView(output.buffer);
  for (let index = 0; index < rowCount; index += 1) {
    view.setFloat32(index * 4, numberValue(values[index] ?? null), true);
  }
  return output;
}

function encodeInt64Values(values: BgDatabaseValue[], rowCount: number) {
  const output = new Uint8Array(rowCount * 8);
  const view = new DataView(output.buffer);
  for (let index = 0; index < rowCount; index += 1) {
    view.setBigInt64(index * 8, BigInt(Math.round(numberValue(values[index] ?? null))), true);
  }
  return output;
}

function encodeBoolValues(values: BgDatabaseValue[], rowCount: number) {
  const output = new Uint8Array(rowCount);
  for (let index = 0; index < rowCount; index += 1) {
    const value = values[index];
    output[index] = value === true || value === "true" || value === 1 || value === "1" ? 1 : 0;
  }
  return output;
}

function numberValue(value: BgDatabaseValue) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}
