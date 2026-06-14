import { cloneRepo, readRepo, tableRowCount, writeRepo } from "./codec";
import { decodeFieldValues, encodeFieldValues, shortFieldType } from "./field-values";
import type {
  BgDatabaseField,
  BgDatabaseFieldUpdate,
  BgDatabaseFile,
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

export function writeBgDatabaseUpdates(database: BgDatabaseFile, updates: BgDatabaseFieldUpdate[]): Uint8Array {
  const repo = cloneRepo(database.repo);

  for (const update of updates) {
    const table = repo.tables[update.field.tableIndex];
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

  return writeRepo(repo);
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
  if (fieldType === "Long" || fieldType === "Int" || fieldType === "Enum") return Math.round(numberValue(value));
  return value;
}

function numberValue(value: string) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
