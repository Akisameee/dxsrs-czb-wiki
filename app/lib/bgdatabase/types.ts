export type BgDatabasePrimitiveType = "string" | "number" | "boolean";

export type BgDatabaseFieldType =
  | "EntityName"
  | "String"
  | "Int"
  | "Enum"
  | "Float"
  | "Long"
  | "Bool"
  | string;

export type BgDatabaseValue = string | number | boolean | string[] | number[] | Record<string, unknown> | null;

export type BgDatabaseAddonRecord = {
  version: number;
  type: string | null;
  config: Uint8Array;
};

export type BgDatabaseMetaRecord = {
  version: number;
  id: Uint8Array;
  name: string;
  type: string | null;
  config: Uint8Array;
  system: boolean;
  addon: string | null;
  singleton: boolean;
  userDefinedReadonly: boolean;
  emptyName: boolean;
  controllerType: string | null;
};

export type BgDatabaseFieldRecord = {
  version: number;
  id: Uint8Array;
  name: string;
  fullType: string;
  config: Uint8Array;
  system: boolean;
  addon: string | null;
  defaultValue: string | null;
  required: boolean;
  customStringFormatterType: string | null;
  customEditorType: string | null;
  controllerType: string | null;
  valueBytes: Uint8Array;
};

export type BgDatabaseKeyRecord = {
  version: number;
  id: Uint8Array;
  name: string | null;
  isUnique: boolean;
  fieldIds: Uint8Array[];
};

export type BgDatabaseTableRecord = {
  meta: BgDatabaseMetaRecord;
  entityIds: Uint8Array;
  fields: BgDatabaseFieldRecord[];
  keys: BgDatabaseKeyRecord[];
};

export type BgDatabaseRepoRecord = {
  version: number;
  uniqueId: Uint8Array;
  addons: BgDatabaseAddonRecord[];
  tables: BgDatabaseTableRecord[];
  zipped: boolean;
  encrypted: boolean;
};

export type BgDatabaseField = {
  name: string;
  fieldType: BgDatabaseFieldType;
  table: string;
  tableIndex: number;
  fieldIndex: number;
  values: BgDatabaseValue[];
  valueSize?: number;
  entries?: Array<{ rowIndex: number; endOffset: number }>;
  parsed?: boolean;
  error?: string;
};

export type BgDatabaseTable = {
  name: string;
  start: number;
  end: number;
  fields: Record<string, BgDatabaseField>;
  fieldNames: string[];
  fieldCount: number;
  parsedFieldCount: number;
  rowCount: number;
  rows: Array<Record<string, BgDatabaseValue>>;
};

export type BgDatabaseFile = {
  bytes: Uint8Array;
  repo: BgDatabaseRepoRecord;
  tables: BgDatabaseTable[];
  tableNames: string[];
  warnings: string[];
};

export type BgDatabaseFieldUpdate = {
  field: BgDatabaseField;
  rowIndex: number;
  value: string;
};
