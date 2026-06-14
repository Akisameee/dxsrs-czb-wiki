import { BgBinaryReader, BgBinaryWriter, bytesEqual, bytesFromHex } from "./binary";
import type {
  BgDatabaseAddonRecord,
  BgDatabaseFieldRecord,
  BgDatabaseKeyRecord,
  BgDatabaseMetaRecord,
  BgDatabaseRepoRecord,
  BgDatabaseTableRecord,
} from "./types";

export const BG_BINARY_VERSION = 5;
export const BG_UNIQUE_ID = bytesFromHex("97 d8 68 25 45 f1 47 48 ae 49 52 84 cd fc dc c7");
export const BG_ENCRYPTION_ID = bytesFromHex("7c 6f 40 a8 b0 7d 33 42 ad a6 8b 16 56 8b 0f 81");

export function readRepo(bytes: Uint8Array): BgDatabaseRepoRecord {
  const reader = new BgBinaryReader(bytes);
  const version = reader.readInt32();
  if (version !== BG_BINARY_VERSION) throw new Error(`不支持的 BGDatabase 版本：${version}`);

  const uniqueId = reader.readId();
  if (!bytesEqual(uniqueId, BG_UNIQUE_ID)) throw new Error("没有找到 BGDatabase v5 存档头");
  if (reader.peekIdEquals(BG_ENCRYPTION_ID)) {
    throw new Error("这个 BGDatabase 存档启用了加密，当前还不能处理");
  }

  const addons = reader.readArray(() => readAddon(reader));
  if (addons.some(isZippedSettings)) {
    throw new Error("这个 BGDatabase 存档启用了压缩，当前还不能处理");
  }

  const tables = reader.readArray(() => readTable(reader));
  if (reader.offset !== reader.length) {
    throw new Error(`BGDatabase 末尾还有未读取数据：${reader.length - reader.offset} bytes`);
  }

  return {
    version,
    uniqueId,
    addons,
    tables,
    zipped: false,
    encrypted: false,
  };
}

export function writeRepo(repo: BgDatabaseRepoRecord) {
  if (repo.version !== BG_BINARY_VERSION) throw new Error(`不支持写入 BGDatabase 版本：${repo.version}`);
  if (repo.encrypted) throw new Error("加密 BGDatabase 还不能写回");
  if (repo.zipped || repo.addons.some(isZippedSettings)) throw new Error("压缩 BGDatabase 还不能写回");

  const writer = new BgBinaryWriter();
  writer.addInt32(BG_BINARY_VERSION);
  writer.addId(repo.uniqueId);
  writer.addArray(repo.addons, (addon) => writeAddon(writer, addon));
  writer.addArray(repo.tables, (table) => writeTable(writer, table));
  return writer.toArray();
}

export function cloneRepo(repo: BgDatabaseRepoRecord): BgDatabaseRepoRecord {
  return {
    ...repo,
    uniqueId: new Uint8Array(repo.uniqueId),
    addons: repo.addons.map((addon) => ({ ...addon, config: new Uint8Array(addon.config) })),
    tables: repo.tables.map((table) => ({
      meta: cloneMeta(table.meta),
      entityIds: new Uint8Array(table.entityIds),
      fields: table.fields.map(cloneField),
      keys: table.keys.map(cloneKey),
    })),
  };
}

export function tableRowCount(table: BgDatabaseTableRecord) {
  return Math.floor(table.entityIds.length / 16);
}

function readAddon(reader: BgBinaryReader): BgDatabaseAddonRecord {
  return {
    version: reader.readInt32(),
    type: reader.readString(),
    config: reader.readByteArray(),
  };
}

function writeAddon(writer: BgBinaryWriter, addon: BgDatabaseAddonRecord) {
  writer.addInt32(addon.version);
  writer.addString(addon.type);
  writer.addByteArray(addon.config);
}

function readTable(reader: BgBinaryReader): BgDatabaseTableRecord {
  const meta = readMeta(reader);
  const entityIds = reader.readByteArray();
  const fields = reader.readArray(() => {
    const field = readField(reader);
    field.valueBytes = reader.readByteArray();
    return field;
  });
  const keys = reader.readArray(() => readKey(reader));
  return { meta, entityIds, fields, keys };
}

function writeTable(writer: BgBinaryWriter, table: BgDatabaseTableRecord) {
  writeMeta(writer, table.meta);
  writer.addByteArray(table.entityIds);
  writer.addArray(table.fields, (field) => {
    writeField(writer, field);
    writer.addByteArray(field.valueBytes);
  });
  writer.addArray(table.keys, (key) => writeKey(writer, key));
}

function readMeta(reader: BgBinaryReader): BgDatabaseMetaRecord {
  return {
    version: assertRecordVersion(reader.readInt32(), "meta"),
    id: reader.readId(),
    name: reader.readString() ?? "",
    type: reader.readString(),
    config: reader.readByteArray(),
    system: reader.readBool(),
    addon: reader.readString(),
    singleton: reader.readBool(),
    userDefinedReadonly: reader.readBool(),
    emptyName: reader.readBool(),
    controllerType: reader.readString(),
  };
}

function writeMeta(writer: BgBinaryWriter, meta: BgDatabaseMetaRecord) {
  writer.addInt32(meta.version);
  writer.addId(meta.id);
  writer.addString(meta.name);
  writer.addString(meta.type);
  writer.addByteArray(meta.config);
  writer.addBool(meta.system);
  writer.addString(meta.addon);
  writer.addBool(meta.singleton);
  writer.addBool(meta.userDefinedReadonly);
  writer.addBool(meta.emptyName);
  writer.addString(meta.controllerType);
}

function readField(reader: BgBinaryReader): BgDatabaseFieldRecord {
  return {
    version: assertRecordVersion(reader.readInt32(), "field"),
    id: reader.readId(),
    name: reader.readString() ?? "",
    fullType: reader.readString() ?? "",
    config: reader.readByteArray(),
    system: reader.readBool(),
    addon: reader.readString(),
    defaultValue: reader.readString(),
    required: reader.readBool(),
    customStringFormatterType: reader.readString(),
    customEditorType: reader.readString(),
    controllerType: reader.readString(),
    valueBytes: new Uint8Array(),
  };
}

function writeField(writer: BgBinaryWriter, field: BgDatabaseFieldRecord) {
  writer.addInt32(field.version);
  writer.addId(field.id);
  writer.addString(field.name);
  writer.addString(field.fullType);
  writer.addByteArray(field.config);
  writer.addBool(field.system);
  writer.addString(field.addon);
  writer.addString(field.defaultValue);
  writer.addBool(field.required);
  writer.addString(field.customStringFormatterType);
  writer.addString(field.customEditorType);
  writer.addString(field.controllerType);
}

function readKey(reader: BgBinaryReader): BgDatabaseKeyRecord {
  return {
    version: assertRecordVersion(reader.readInt32(), "key"),
    id: reader.readId(),
    name: reader.readString(),
    isUnique: reader.readBool(),
    fieldIds: reader.readArray(() => reader.readId()),
  };
}

function writeKey(writer: BgBinaryWriter, key: BgDatabaseKeyRecord) {
  writer.addInt32(key.version);
  writer.addId(key.id);
  writer.addString(key.name);
  writer.addBool(key.isUnique);
  writer.addArray(key.fieldIds, (id) => writer.addId(id));
}

function assertRecordVersion(version: number, recordName: string) {
  if (version !== 1) throw new Error(`不支持的 ${recordName} 记录版本：${version}`);
  return version;
}

function isZippedSettings(addon: BgDatabaseAddonRecord) {
  if (!addon.type?.includes("BGAddonSettings")) return false;
  try {
    const reader = new BgBinaryReader(addon.config);
    reader.readBool();
    return reader.readBool();
  } catch {
    return false;
  }
}

function cloneMeta(meta: BgDatabaseMetaRecord): BgDatabaseMetaRecord {
  return { ...meta, id: new Uint8Array(meta.id), config: new Uint8Array(meta.config) };
}

function cloneField(field: BgDatabaseFieldRecord): BgDatabaseFieldRecord {
  return {
    ...field,
    id: new Uint8Array(field.id),
    config: new Uint8Array(field.config),
    valueBytes: new Uint8Array(field.valueBytes),
  };
}

function cloneKey(key: BgDatabaseKeyRecord): BgDatabaseKeyRecord {
  return {
    ...key,
    id: new Uint8Array(key.id),
    fieldIds: key.fieldIds.map((id) => new Uint8Array(id)),
  };
}
