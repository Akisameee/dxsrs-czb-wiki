import { Es2BinaryReader, Es2BinaryWriter } from "./binary";
import type { Es2CunDang, Es2File, Es2TypeHash, Es2Value } from "./types";

export const ES2_MAGIC = 0x007e;
export const ES2_TAG_END = 0x7b;
export const ES2_TAG_LIST = 0x53;
export const ES2_TAG_TYPE = 0xff;

export const ES2_TYPE_HASHES = {
  int: typeHash([0x56, 0x08, 0xa8, 0xe2], "int"),
  bool: typeHash([0x9c, 0x7c, 0x4d, 0xad], "bool"),
  string: typeHash([0xee, 0xf1, 0xe9, 0xfd], "string"),
  emptyListUnknown: typeHash([0xf6, 0xdd, 0x63, 0x38], "unknown-list"),
  cunDang: typeHash([0xc3, 0x09, 0x85, 0xfe], "CunDang"),
};

export function readEs2File(bytes: Uint8Array): Es2File {
  const reader = new Es2BinaryReader(bytes);
  const magic = reader.readUInt16();
  if (magic !== ES2_MAGIC) throw new Error(`不是 ES2 存档：magic=0x${magic.toString(16)}`);

  const payloadLength = reader.readInt32();
  if (payloadLength < 0 || reader.offset + payloadLength !== reader.length) {
    throw new Error(`ES2 payload 长度异常：${payloadLength}`);
  }

  const value = readEs2Payload(reader, payloadLength);
  if (reader.offset !== reader.length) {
    throw new Error(`ES2 末尾还有未读取数据：${reader.length - reader.offset} bytes`);
  }

  return {
    magic,
    payloadLength,
    value,
    bytes,
  };
}

export function writeEs2File(file: Es2File) {
  const payload = writeEs2Payload(file.value);
  const writer = new Es2BinaryWriter();
  writer.addUInt16(ES2_MAGIC);
  writer.addInt32(payload.length);
  writer.addBytes(payload);
  return writer.toArray();
}

function readEs2Payload(reader: Es2BinaryReader, payloadLength: number): Es2Value {
  const start = reader.offset;
  const marker = reader.readByte();

  if (marker === ES2_TAG_LIST) {
    return readListValue(reader);
  }

  if (marker === ES2_TAG_TYPE) {
    const type = readTypeHash(reader);
    const value = readValueByHash(reader, type);
    readEndTag(reader);
    return value;
  }

  reader.offset = start;
  return {
    type: "unknown",
    bytes: reader.readBytes(payloadLength),
  };
}

function writeEs2Payload(value: Es2Value) {
  const writer = new Es2BinaryWriter();
  writeValue(writer, value, true);
  return writer.toArray();
}

function readListValue(reader: Es2BinaryReader): Es2Value {
  readTypeTag(reader);
  const elementTypeHash = readTypeHash(reader);
  const reserved = reader.readByte();
  if (reserved !== 0) throw new Error(`ES2 List 保留字节异常：${reserved}`);

  const count = reader.readInt32();
  if (count < 0 || count > 1_000_000) throw new Error(`ES2 List 长度异常：${count}`);

  const values: Es2Value[] = [];
  for (let index = 0; index < count; index += 1) {
    values.push(readValueByHash(reader, elementTypeHash));
  }
  readEndTag(reader);

  return {
    type: "list",
    elementTypeHash,
    values,
  };
}

function readValueByHash(reader: Es2BinaryReader, typeHash: Es2TypeHash): Es2Value {
  if (hashEquals(typeHash, ES2_TYPE_HASHES.int)) {
    return { type: "int", value: reader.readInt32(), typeHash };
  }
  if (hashEquals(typeHash, ES2_TYPE_HASHES.bool)) {
    return { type: "bool", value: reader.readBool(), typeHash };
  }
  if (hashEquals(typeHash, ES2_TYPE_HASHES.string)) {
    return { type: "string", value: reader.readString(), typeHash };
  }
  if (hashEquals(typeHash, ES2_TYPE_HASHES.cunDang)) {
    return { type: "cunDang", value: readCunDang(reader), typeHash };
  }

  return {
    type: "unknown",
    typeHash,
    bytes: new Uint8Array(),
  };
}

function writeValue(writer: Es2BinaryWriter, value: Es2Value, includeEnvelope: boolean) {
  if (value.type === "list") {
    writer.addByte(ES2_TAG_LIST);
    writeTypeTag(writer, value.elementTypeHash);
    writer.addByte(0);
    writer.addInt32(value.values.length);
    for (const item of value.values) writeValue(writer, item, false);
    writer.addByte(ES2_TAG_END);
    return;
  }

  if (includeEnvelope) writeTypeTag(writer, value.type === "unknown" ? value.typeHash : value.typeHash);

  if (value.type === "int") writer.addInt32(value.value);
  else if (value.type === "bool") writer.addBool(value.value);
  else if (value.type === "string") writer.addString(value.value);
  else if (value.type === "cunDang") writeCunDang(writer, value.value);
  else if (value.type === "unknown") writer.addBytes(value.bytes);

  if (includeEnvelope) writer.addByte(ES2_TAG_END);
}

function readCunDang(reader: Es2BinaryReader): Es2CunDang {
  return {
    uid: reader.readString(),
    isNormalMode: reader.readBool(),
    slotid: reader.readInt32(),
    player: reader.readString(),
    menPai: reader.readInt32(),
    old: reader.readInt32(),
    qianfa: reader.readString(),
    houfa: reader.readString(),
    maozi: reader.readString(),
    meimao: reader.readString(),
    lianshi: reader.readString(),
    yifu: reader.readString(),
    houbei: reader.readString(),
    huzi: reader.readString(),
    isplaying: reader.readBool(),
    savepath: reader.readString(),
    zhujue: reader.readInt32(),
    gongli: reader.readInt32(),
    difficult: reader.readInt32(),
    sex: reader.readInt32(),
  };
}

function writeCunDang(writer: Es2BinaryWriter, value: Es2CunDang) {
  writer.addString(value.uid);
  writer.addBool(value.isNormalMode);
  writer.addInt32(value.slotid);
  writer.addString(value.player);
  writer.addInt32(value.menPai);
  writer.addInt32(value.old);
  writer.addString(value.qianfa);
  writer.addString(value.houfa);
  writer.addString(value.maozi);
  writer.addString(value.meimao);
  writer.addString(value.lianshi);
  writer.addString(value.yifu);
  writer.addString(value.houbei);
  writer.addString(value.huzi);
  writer.addBool(value.isplaying);
  writer.addString(value.savepath);
  writer.addInt32(value.zhujue);
  writer.addInt32(value.gongli);
  writer.addInt32(value.difficult);
  writer.addInt32(value.sex);
}

function readTypeTag(reader: Es2BinaryReader) {
  const marker = reader.readByte();
  if (marker !== ES2_TAG_TYPE) throw new Error(`ES2 类型标记异常：${marker}`);
}

function writeTypeTag(writer: Es2BinaryWriter, typeHash: Es2TypeHash | undefined) {
  if (!typeHash) throw new Error("缺少 ES2 类型 hash，不能写回");
  writer.addByte(ES2_TAG_TYPE);
  writer.addBytes(typeHash.bytes);
}

function readEndTag(reader: Es2BinaryReader) {
  const marker = reader.readByte();
  if (marker !== ES2_TAG_END) throw new Error(`ES2 结束标记异常：${marker}`);
}

function readTypeHash(reader: Es2BinaryReader) {
  const bytes = [...reader.readBytes(4)];
  const known = Object.values(ES2_TYPE_HASHES).find((item) => byteArraysEqual(item.bytes, bytes));
  return known || typeHash(bytes, `unknown:${hashHex(bytes)}`);
}

function typeHash(bytes: number[], name: string): Es2TypeHash {
  return {
    bytes,
    hex: hashHex(bytes),
    name,
  };
}

function hashHex(bytes: number[]) {
  return bytes.map((value) => value.toString(16).padStart(2, "0")).join("");
}

function hashEquals(left: Es2TypeHash, right: Es2TypeHash) {
  return byteArraysEqual(left.bytes, right.bytes);
}

function byteArraysEqual(left: number[], right: number[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}
