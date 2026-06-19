import { cloneRepo, readRepo, tableRowCount, writeRepo } from "./codec";
import { decodeFieldValues, encodeFieldValues, shortFieldType } from "./field-values";
import type {
  BgDatabaseField,
  BgDatabaseFile,
  BgDatabaseRowOperation,
  BgDatabaseTable,
  BgDatabaseValue,
} from "./types";

export function parseBgDatabase(input: ArrayBuffer | Uint8Array): BgDatabaseFile {
  const bytes = input instanceof Uint8Array ? new Uint8Array(input) : new Uint8Array(input);
  const repo = readRepo(bytes);
  const warnings: string[] = [];
  const tables = repo.tables.map((tableRecord, tableIndex) => {
    const rowCount = tableRowCount(tableRecord);
    const fields: Record<string, BgDatabaseField> = {};
    const fieldNames: string[] = [];

    tableRecord.fields.forEach((fieldRecord, fieldIndex) => {
      const fieldType = shortFieldType(fieldRecord.fullType);
      fieldNames.push(fieldRecord.name);
      try {
        const decoded = decodeFieldValues(fieldType, fieldRecord.valueBytes, rowCount);
        fields[fieldRecord.name] = {
          name: fieldRecord.name,
          fieldType,
          table: tableRecord.meta.name,
          tableIndex,
          fieldIndex,
          values: decoded.values,
          valueSize: decoded.valueSize,
          entries: decoded.entries,
          parsed: true,
        };
      } catch (error) {
        const message = errorMessage(error);
        fields[fieldRecord.name] = {
          name: fieldRecord.name,
          fieldType,
          table: tableRecord.meta.name,
          tableIndex,
          fieldIndex,
          values: [],
          parsed: false,
          error: message,
        };
        if (tableRecord.meta.name === "ZhuJue") {
          warnings.push(`${tableRecord.meta.name}.${fieldRecord.name} 暂时无法解析：${message}`);
        }
      }
    });

    const parsedFieldCount = Object.values(fields).filter((field) => field.parsed).length;
    return {
      name: tableRecord.meta.name,
      tableIndex,
      start: 0,
      end: 0,
      fields,
      fieldNames,
      fieldCount: fieldNames.length,
      parsedFieldCount,
      rowCount,
      rows: rowsFromFields(fieldNames, fields, rowCount),
    } satisfies BgDatabaseTable;
  });

  return {
    bytes,
    repo,
    tables,
    tableNames: tables.map((table) => table.name),
    warnings,
  };
}

export function writeBgDatabaseRowOperations(database: BgDatabaseFile, operations: BgDatabaseRowOperation[]): Uint8Array {
  const repo = cloneRepo(database.repo);

  const updates = operations.filter((operation): operation is Extract<BgDatabaseRowOperation, { type: "update" }> =>
    operation.type === "update",
  );
  const deletes = operations
    .filter((operation): operation is Extract<BgDatabaseRowOperation, { type: "delete" }> => operation.type === "delete")
    .sort((left, right) => {
      if (left.tableIndex !== right.tableIndex) return left.tableIndex - right.tableIndex;
      return right.rowIndex - left.rowIndex;
    });
  const inserts = operations.filter((operation): operation is Extract<BgDatabaseRowOperation, { type: "insert" }> =>
    operation.type === "insert",
  );

  for (const update of updates) {
    writeFieldValue(repo.tables, update);
  }

  for (const operation of deletes) {
    deleteTableRow(repo.tables, operation);
  }

  for (const operation of inserts) {
    insertTableRow(repo.tables, operation);
  }

  return writeRepo(repo);
}

function writeFieldValue(
  tables: BgDatabaseFile["repo"]["tables"],
  update: Extract<BgDatabaseRowOperation, { type: "update" }>,
) {
  const table = tables[update.field.tableIndex];
  if (!table) throw new Error(`找不到表索引：${update.field.tableIndex}`);
  const field = table.fields[update.field.fieldIndex];
  if (!field) throw new Error(`找不到字段索引：${update.field.fieldIndex}`);
  if (field.name !== update.field.name) throw new Error(`字段索引不匹配：${update.field.name}`);

  const rowCount = tableRowCount(table);
  if (update.rowIndex < 0 || update.rowIndex >= rowCount) {
    throw new Error(`行索引越界：${update.rowIndex}`);
  }

  const fieldType = shortFieldType(field.fullType);
  const decoded = decodeFieldValues(fieldType, field.valueBytes, rowCount);
  const values = normalizeValueLength(decoded.values, rowCount);
  values[update.rowIndex] = coerceUpdateValue(fieldType, update.value);
  field.valueBytes = encodeFieldValues(fieldType, values, rowCount);
}

function deleteTableRow(
  tables: BgDatabaseFile["repo"]["tables"],
  operation: Extract<BgDatabaseRowOperation, { type: "delete" }>,
) {
  const table = tables[operation.tableIndex];
  if (!table) throw new Error(`找不到表索引：${operation.tableIndex}`);
  if (table.meta.name !== operation.tableName) throw new Error(`表索引不匹配：${operation.tableName}`);

  const rowCount = tableRowCount(table);
  if (operation.rowIndex < 0 || operation.rowIndex >= rowCount) {
    throw new Error(`行索引越界：${operation.rowIndex}`);
  }

  table.entityIds = removeEntityId(table.entityIds, operation.rowIndex);
  for (const field of table.fields) {
    const fieldType = shortFieldType(field.fullType);
    const values = normalizeValueLength(decodeFieldValues(fieldType, field.valueBytes, rowCount).values, rowCount);
    values.splice(operation.rowIndex, 1);
    field.valueBytes = encodeFieldValues(fieldType, values, rowCount - 1);
  }
}

function insertTableRow(
  tables: BgDatabaseFile["repo"]["tables"],
  operation: Extract<BgDatabaseRowOperation, { type: "insert" }>,
) {
  const table = tables[operation.tableIndex];
  if (!table) throw new Error(`找不到表索引：${operation.tableIndex}`);
  if (table.meta.name !== operation.tableName) throw new Error(`表索引不匹配：${operation.tableName}`);

  const rowCount = tableRowCount(table);
  table.entityIds = appendEntityId(table.entityIds, operation.tempId);
  for (const field of table.fields) {
    const fieldType = shortFieldType(field.fullType);
    const values = normalizeValueLength(decodeFieldValues(fieldType, field.valueBytes, rowCount).values, rowCount);
    values.push(coerceUpdateValue(fieldType, operation.values[field.name] ?? defaultFieldValue(fieldType, field.defaultValue)));
    field.valueBytes = encodeFieldValues(fieldType, values, rowCount + 1);
  }
}

function rowsFromFields(
  fieldNames: string[],
  fields: Record<string, BgDatabaseField>,
  rowCount: number,
): Array<Record<string, BgDatabaseValue>> {
  return Array.from({ length: rowCount }, (_, index) => {
    const row: Record<string, BgDatabaseValue> = { index };
    for (const name of fieldNames) {
      const field = fields[name];
      if (!field?.parsed) continue;
      row[name] = field.values[index] ?? null;
    }
    return row;
  });
}

function normalizeValueLength(values: BgDatabaseValue[], rowCount: number) {
  const output = values.slice(0, rowCount);
  while (output.length < rowCount) output.push(null);
  return output;
}

function coerceUpdateValue(fieldType: string, value: string): BgDatabaseValue {
  if (fieldType === "Bool") return value === "true" || value === "1";
  if (fieldType === "String" || fieldType === "EntityName") return value;
  if (fieldType === "Float") return numberValue(value);
  if (fieldType === "Long") return value;
  if (fieldType === "Int" || fieldType === "Enum") return Math.round(numberValue(value));
  return value;
}

function defaultFieldValue(fieldType: string, value: string | null) {
  if (value !== null && value !== undefined) return value;
  if (fieldType === "Bool") return "false";
  if (fieldType === "String" || fieldType === "EntityName") return "";
  return "0";
}

function appendEntityId(entityIds: Uint8Array, seed: string) {
  const next = new Uint8Array(entityIds.length + 16);
  next.set(entityIds);
  next.set(stableEntityId(seed), entityIds.length);
  return next;
}

function removeEntityId(entityIds: Uint8Array, rowIndex: number) {
  const start = rowIndex * 16;
  const next = new Uint8Array(entityIds.length - 16);
  next.set(entityIds.slice(0, start));
  next.set(entityIds.slice(start + 16), start);
  return next;
}

function stableEntityId(seed: string) {
  const bytes = new Uint8Array(16);
  let hash = 0x811c9dc5;
  const input = new TextEncoder().encode(seed);
  for (let index = 0; index < 16; index += 1) {
    for (const byte of input) {
      hash ^= byte + index;
      hash = Math.imul(hash, 0x01000193);
    }
    hash ^= index * 0x9e3779b1;
    bytes[index] = hash & 0xff;
  }
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  return bytes;
}

function numberValue(value: string) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
