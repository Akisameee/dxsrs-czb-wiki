import type { BgDatabaseField, BgDatabaseTable, BgDatabaseValue } from "../bgdatabase";
import { formatSaveValue } from "./format";

export type SaveEditRowDraftTarget =
  | { type: "row"; rowIndex: number }
  | { type: "insert"; tempId: string };

export type SaveEditRowDraftOperation =
  | { type: "insert"; tempId: string; initialValues?: Record<string, string>; values: Record<string, string> }
  | { type: "update"; target: SaveEditRowDraftTarget; values: Record<string, string> }
  | { type: "delete"; target: SaveEditRowDraftTarget };

export type SaveEditDraftResetTarget =
  | { type: "table" }
  | { type: "field"; target: SaveEditRowDraftTarget; fieldName: string }
  | SaveEditRowDraftTarget;

export type SaveEditDraftResetOperation = {
  table: BgDatabaseTable;
  target: SaveEditDraftResetTarget;
};

export type SaveEditInsertedRowDraft = {
  initialValues: Record<string, string>;
  values: Record<string, string>;
};

export type SaveEditTableDraft = {
  updated: Record<string, Record<string, string>>;
  inserted: Record<string, SaveEditInsertedRowDraft>;
  deleted: Record<string, true>;
};

export type SaveEditDraft = {
  tables: Record<string, SaveEditTableDraft>;
  es2: Record<string, string>;
};

export type SaveEditTableRowView = {
  key: string;
  target: SaveEditRowDraftTarget;
  status: "clean" | "updated" | "inserted" | "deleted";
  rowIndex: number | null;
  initialValues: Record<string, string>;
  values: Record<string, string>;
  dirtyFields: Set<string>;
  rowDirty: boolean;
};

export type SaveEditFieldView = {
  field?: BgDatabaseField;
  rowIndex: number;
  initialValue: BgDatabaseValue;
  value: BgDatabaseValue;
  initialText: string;
  text: string;
  dirty: boolean;
};

export type SaveEditTableView = {
  table: BgDatabaseTable;
  draft: SaveEditDraft;
  dirty: boolean;
  dirtyRows: Set<number>;
  deletedRows: Set<number>;
  insertedRows: SaveEditTableRowView[];
};

export type SaveEditRowDraft =
  | {
      type: "insert";
      tableIndex: number;
      tableName: string;
      tempId: string;
      initialValues: Record<string, string>;
      values: Record<string, string>;
    }
  | {
      type: "update";
      tableIndex: number;
      tableName: string;
      rowIndex: number;
      values: Record<string, string>;
    }
  | {
      type: "delete";
      tableIndex: number;
      tableName: string;
      rowIndex: number;
    };

export function createEmptySaveEditDraft(): SaveEditDraft {
  return { tables: {}, es2: {} };
}

export function normalizeSaveEditDraft(draft: SaveEditDraft | undefined): SaveEditDraft {
  return {
    tables: draft?.tables || {},
    es2: draft?.es2 || {},
  };
}

export function hasSaveEditDraft(draft: SaveEditDraft | undefined) {
  const normalized = normalizeSaveEditDraft(draft);
  return Object.values(normalized.tables).some(tableDraftDirty) || Object.keys(normalized.es2).length > 0;
}

export function saveEditDraftRowOperations(draft: SaveEditDraft | undefined) {
  const rows: SaveEditRowDraft[] = [];
  for (const [key, tableDraft] of Object.entries(normalizeSaveEditDraft(draft).tables)) {
    const parsed = parseTableDraftKey(key);
    if (!parsed) continue;
    for (const [rowIndex, values] of Object.entries(tableDraft.updated)) {
      if (!Object.keys(values).length) continue;
      rows.push({
        type: "update",
        tableIndex: parsed.tableIndex,
        tableName: parsed.tableName,
        rowIndex: Number(rowIndex),
        values: { ...values },
      });
    }
    for (const [tempId, inserted] of Object.entries(tableDraft.inserted)) {
      rows.push({
        type: "insert",
        tableIndex: parsed.tableIndex,
        tableName: parsed.tableName,
        tempId,
        initialValues: { ...inserted.initialValues },
        values: { ...inserted.values },
      });
    }
    for (const rowIndex of Object.keys(tableDraft.deleted)) {
      rows.push({
        type: "delete",
        tableIndex: parsed.tableIndex,
        tableName: parsed.tableName,
        rowIndex: Number(rowIndex),
      });
    }
  }
  return rows;
}

export function saveEditDraftEs2Values(draft: SaveEditDraft | undefined) {
  return normalizeSaveEditDraft(draft).es2;
}

export function saveEditDraftFieldValue(field: BgDatabaseField | undefined, rowIndex: number, draft: SaveEditDraft | undefined): BgDatabaseValue {
  if (!field) return null;
  const tableDraft = findSaveEditTableDraft(draft, field.tableIndex, field.table);
  return tableDraft?.updated[String(rowIndex)]?.[field.name] ?? field.values[rowIndex] ?? null;
}

export function saveEditDraftHasField(field: BgDatabaseField | undefined, rowIndex: number, draft: SaveEditDraft | undefined) {
  if (!field) return false;
  const tableDraft = findSaveEditTableDraft(draft, field.tableIndex, field.table);
  return Boolean(tableDraft?.updated[String(rowIndex)] && field.name in tableDraft.updated[String(rowIndex)]!);
}

export function selectSaveEditFieldView(
  field: BgDatabaseField | undefined,
  rowIndex: number,
  draft: SaveEditDraft | undefined,
): SaveEditFieldView {
  const initialValue = field?.values[rowIndex] ?? null;
  const value = saveEditDraftFieldValue(field, rowIndex, draft);
  return {
    field,
    rowIndex,
    initialValue,
    value,
    initialText: formatSaveValue(initialValue),
    text: formatSaveValue(value),
    dirty: saveEditDraftHasField(field, rowIndex, draft),
  };
}

export function selectSaveEditTableView(
  table: BgDatabaseTable,
  draft: SaveEditDraft,
): SaveEditTableView {
  return {
    table,
    draft,
    dirty: saveEditDraftTableDirty(draft, table.tableIndex),
    dirtyRows: saveEditDraftDirtyRows(draft, table.tableIndex),
    deletedRows: saveEditDraftDeletedRows(draft, table.tableIndex),
    insertedRows: selectSaveEditInsertedTableRows(table, draft),
  };
}

export function saveEditDraftRowDirty(draft: SaveEditDraft | undefined, tableIndex: number, rowIndex: number) {
  const tableDraft = findSaveEditTableDraftByIndex(draft, tableIndex);
  const key = String(rowIndex);
  return Boolean(tableDraft?.updated[key] && Object.keys(tableDraft.updated[key]).length) || Boolean(tableDraft?.deleted[key]);
}

export function saveEditDraftTableDirty(draft: SaveEditDraft | undefined, tableIndex: number) {
  const tableDraft = findSaveEditTableDraftByIndex(draft, tableIndex);
  return Boolean(tableDraft && tableDraftDirty(tableDraft));
}

export function saveEditDraftDirtyRows(draft: SaveEditDraft | undefined, tableIndex: number) {
  const result = new Set<number>();
  const tableDraft = findSaveEditTableDraftByIndex(draft, tableIndex);
  if (tableDraft) {
    for (const rowIndex of Object.keys(tableDraft.updated)) result.add(Number(rowIndex));
    for (const rowIndex of Object.keys(tableDraft.deleted)) result.add(Number(rowIndex));
  }
  return result;
}

export function saveEditDraftDeletedRows(draft: SaveEditDraft | undefined, tableIndex: number) {
  const tableDraft = findSaveEditTableDraftByIndex(draft, tableIndex);
  return new Set(Object.keys(tableDraft?.deleted || {}).map(Number));
}

export function resetSaveEditTableDraft(draft: SaveEditDraft | undefined, table: BgDatabaseTable) {
  const normalized = normalizeSaveEditDraft(draft);
  const tables = { ...normalized.tables };
  delete tables[saveEditTableDraftKey(table)];
  return { ...normalized, tables } satisfies SaveEditDraft;
}

export function resetSaveEditRowDraft(
  draft: SaveEditDraft | undefined,
  table: BgDatabaseTable,
  rowIndex: number,
) {
  const normalized = normalizeSaveEditDraft(draft);
  const tableKey = saveEditTableDraftKey(table);
  const { tables, tableDraft } = cloneDraftTable(normalized.tables, tableKey);
  if (tableDraft) {
    tableDraft.updated = { ...tableDraft.updated };
    tableDraft.deleted = { ...tableDraft.deleted };
    delete tableDraft.updated[String(rowIndex)];
    delete tableDraft.deleted[String(rowIndex)];
    if (!tableDraftDirty(tableDraft)) delete tables[tableKey];
  }
  return { ...normalized, tables } satisfies SaveEditDraft;
}

export function resetSaveEditDraftTarget(
  draft: SaveEditDraft | undefined,
  table: BgDatabaseTable,
  target: SaveEditDraftResetTarget,
) {
  if (target.type === "table") return resetSaveEditTableDraft(draft, table);
  if (target.type === "row") return resetSaveEditRowDraft(draft, table, target.rowIndex);
  if (target.type === "field") return resetSaveEditFieldDraft(draft, table, target.target, target.fieldName);
  return resetInsertedSaveEditRowDraft(draft, table, target.tempId);
}

export function resetInsertedSaveEditRowDraft(
  draft: SaveEditDraft | undefined,
  table: BgDatabaseTable,
  tempId: string,
) {
  const normalized = normalizeSaveEditDraft(draft);
  const tableKey = saveEditTableDraftKey(table);
  const { tables, tableDraft } = cloneDraftTable(normalized.tables, tableKey);
  const inserted = tableDraft?.inserted[tempId];
  if (tableDraft && inserted) {
    tableDraft.inserted = {
      ...tableDraft.inserted,
      [tempId]: { ...inserted, values: { ...inserted.initialValues } },
    };
  }
  return { ...normalized, tables } satisfies SaveEditDraft;
}

export function resetSaveEditFieldDraft(
  draft: SaveEditDraft | undefined,
  table: BgDatabaseTable,
  target: SaveEditRowDraftTarget,
  fieldName: string,
) {
  const normalized = normalizeSaveEditDraft(draft);
  const tableKey = saveEditTableDraftKey(table);
  const { tables, tableDraft } = cloneDraftTable(normalized.tables, tableKey);
  if (!tableDraft) return normalized;

  if (target.type === "row") {
    const rowKey = String(target.rowIndex);
    const rowDraft = tableDraft.updated[rowKey];
    if (rowDraft) {
      tableDraft.updated = { ...tableDraft.updated, [rowKey]: { ...rowDraft } };
      delete tableDraft.updated[rowKey]?.[fieldName];
      if (tableDraft.updated[rowKey] && !Object.keys(tableDraft.updated[rowKey]!).length) {
        delete tableDraft.updated[rowKey];
      }
    }
  } else {
    const inserted = tableDraft.inserted[target.tempId];
    if (inserted) {
      tableDraft.inserted = {
        ...tableDraft.inserted,
        [target.tempId]: {
          ...inserted,
          values: {
            ...inserted.values,
            [fieldName]: inserted.initialValues[fieldName] ?? "",
          },
        },
      };
    }
  }

  if (!tableDraftDirty(tableDraft)) delete tables[tableKey];
  return { ...normalized, tables } satisfies SaveEditDraft;
}

export function applySaveEditRowDraftOperation(
  draft: SaveEditDraft | undefined,
  table: BgDatabaseTable,
  operation: SaveEditRowDraftOperation,
) {
  if (operation.type === "insert") {
    return insertSaveEditRowDraft(draft, table, operation.values, operation.tempId, operation.initialValues);
  }

  if (operation.target.type === "insert") {
    if (operation.type === "update") {
      return updateInsertedSaveEditRowDraft(draft, table, operation.target.tempId, operation.values);
    }
    return removeInsertedSaveEditRowDraft(draft, table, operation.target.tempId);
  }

  if (operation.type === "update") {
    return updateSaveEditRowDraft(draft, table, operation.target.rowIndex, operation.values);
  }
  return deleteSaveEditRowDraft(draft, table, operation.target.rowIndex);
}

export function updateSaveEditCellDraft(
  draft: SaveEditDraft | undefined,
  field: BgDatabaseField,
  rowIndex: number,
  value: string,
) {
  const normalized = normalizeSaveEditDraft(draft);
  const initialValue = formatSaveValue(field.values[rowIndex]);
  const tableKey = saveEditTableDraftKey(fieldTableFromField(field));
  const { tables, tableDraft } = cloneDraftTable(normalized.tables, tableKey, true);
  if (!tableDraft) return normalized;
  const key = String(rowIndex);

  if (value === initialValue) {
    const rowDraft = tableDraft.updated[key];
    if (rowDraft) tableDraft.updated = { ...tableDraft.updated, [key]: { ...rowDraft } };
    delete tableDraft.updated[key]?.[field.name];
    if (tableDraft.updated[key] && !Object.keys(tableDraft.updated[key]).length) delete tableDraft.updated[key];
    if (!tableDraftDirty(tableDraft)) delete tables[tableKey];
    return { ...normalized, tables };
  }

  tableDraft.updated = {
    ...tableDraft.updated,
    [key]: { ...(tableDraft.updated[key] || {}), [field.name]: value },
  };
  return { ...normalized, tables };
}

export function insertSaveEditRowDraft(
  draft: SaveEditDraft | undefined,
  table: BgDatabaseTable,
  values: Record<string, string>,
  tempId: string,
  initialValues: Record<string, string> = values,
) {
  const normalized = normalizeSaveEditDraft(draft);
  const tableKey = saveEditTableDraftKey(table);
  const { tables, tableDraft } = cloneDraftTable(normalized.tables, tableKey, true);
  if (!tableDraft) return normalized;
  tableDraft.inserted = {
    ...tableDraft.inserted,
    [tempId]: {
      initialValues: cleanValuesForTable(table, initialValues),
      values: cleanValuesForTable(table, values),
    },
  };
  return { ...normalized, tables } satisfies SaveEditDraft;
}

export function removeInsertedSaveEditRowDraft(
  draft: SaveEditDraft | undefined,
  table: BgDatabaseTable,
  tempId: string,
) {
  const normalized = normalizeSaveEditDraft(draft);
  const tableKey = saveEditTableDraftKey(table);
  const { tables, tableDraft } = cloneDraftTable(normalized.tables, tableKey);
  if (tableDraft) {
    tableDraft.inserted = { ...tableDraft.inserted };
    delete tableDraft.inserted[tempId];
    if (!tableDraftDirty(tableDraft)) delete tables[tableKey];
  }
  return { ...normalized, tables } satisfies SaveEditDraft;
}

export function updateInsertedSaveEditRowDraft(
  draft: SaveEditDraft | undefined,
  table: BgDatabaseTable,
  tempId: string,
  values: Record<string, string>,
) {
  const normalized = normalizeSaveEditDraft(draft);
  const tableKey = saveEditTableDraftKey(table);
  const { tables, tableDraft } = cloneDraftTable(normalized.tables, tableKey);
  const inserted = tableDraft?.inserted[tempId];
  if (!inserted) return normalized;
  tableDraft.inserted = {
    ...tableDraft.inserted,
    [tempId]: {
      ...inserted,
      values: {
        ...inserted.values,
        ...cleanValuesForTable(table, values),
      },
    },
  };
  return { ...normalized, tables } satisfies SaveEditDraft;
}

export function updateSaveEditRowDraft(
  draft: SaveEditDraft | undefined,
  table: BgDatabaseTable,
  rowIndex: number,
  values: Record<string, string>,
) {
  let next = normalizeSaveEditDraft(draft);
  for (const [fieldName, value] of Object.entries(values)) {
    const field = table.fields[fieldName];
    if (!field) continue;
    next = updateSaveEditCellDraft(next, field, rowIndex, value);
  }
  return next;
}

export function deleteSaveEditRowDraft(
  draft: SaveEditDraft | undefined,
  table: BgDatabaseTable,
  rowIndex: number,
) {
  const normalized = normalizeSaveEditDraft(draft);
  const tableKey = saveEditTableDraftKey(table);
  const { tables, tableDraft } = cloneDraftTable(normalized.tables, tableKey, true);
  if (!tableDraft) return normalized;
  tableDraft.updated = { ...tableDraft.updated };
  tableDraft.deleted = { ...tableDraft.deleted };
  delete tableDraft.updated[String(rowIndex)];
  tableDraft.deleted[String(rowIndex)] = true;
  return { ...normalized, tables };
}

export function selectSaveEditTableRow(
  table: BgDatabaseTable,
  draft: SaveEditDraft | undefined,
  rowIndex: number,
): SaveEditTableRowView {
  const tableDraft = findSaveEditTableDraft(draft, table.tableIndex, table.name);
  const initialValues = tableRowValues(table, rowIndex);
  const updates = tableDraft?.updated[String(rowIndex)] || {};
  const values = { ...initialValues, ...updates };
  const deleted = Boolean(tableDraft?.deleted[String(rowIndex)]);
  const dirtyFields = dirtyFieldSet(initialValues, values);
  return {
    key: `row-${rowIndex}`,
    target: { type: "row", rowIndex },
    status: deleted ? "deleted" : dirtyFields.size ? "updated" : "clean",
    rowIndex,
    initialValues,
    values,
    dirtyFields,
    rowDirty: deleted || dirtyFields.size > 0,
  };
}

export function selectSaveEditInsertedTableRows(
  table: BgDatabaseTable,
  draft: SaveEditDraft | undefined,
): SaveEditTableRowView[] {
  const tableDraft = findSaveEditTableDraft(draft, table.tableIndex, table.name);
  return Object.entries(tableDraft?.inserted || {}).map(([tempId, inserted]) => {
    const initialValues = cleanValuesForTable(table, inserted.initialValues);
    const values = { ...initialValues, ...cleanValuesForTable(table, inserted.values) };
    const dirtyFields = dirtyFieldSet(initialValues, values);
    return {
      key: `insert-${tempId}`,
      target: { type: "insert" as const, tempId },
      status: "inserted" as const,
      rowIndex: null,
      initialValues,
      values,
      dirtyFields,
      rowDirty: true,
    };
  }).reverse();
}

export function saveEditTableDraftKey(table: Pick<BgDatabaseTable, "tableIndex" | "name">) {
  return `${table.tableIndex}:${table.name}`;
}

function fieldTableFromField(field: BgDatabaseField): Pick<BgDatabaseTable, "tableIndex" | "name"> {
  return { tableIndex: field.tableIndex, name: field.table };
}

function parseTableDraftKey(key: string) {
  const separator = key.indexOf(":");
  if (separator < 0) return null;
  const tableIndex = Number(key.slice(0, separator));
  const tableName = key.slice(separator + 1);
  if (!Number.isInteger(tableIndex) || !tableName) return null;
  return { tableIndex, tableName };
}

function emptyTableDraft(): SaveEditTableDraft {
  return { updated: {}, inserted: {}, deleted: {} };
}

function findSaveEditTableDraft(draft: SaveEditDraft | undefined, tableIndex: number, tableName: string) {
  return normalizeSaveEditDraft(draft).tables[`${tableIndex}:${tableName}`];
}

function findSaveEditTableDraftByIndex(draft: SaveEditDraft | undefined, tableIndex: number) {
  return Object.entries(normalizeSaveEditDraft(draft).tables)
    .find(([key]) => parseTableDraftKey(key)?.tableIndex === tableIndex)?.[1];
}

function cloneDraftTable(
  tables: Record<string, SaveEditTableDraft>,
  key: string,
  create = false,
) {
  const nextTables = { ...tables };
  const source = tables[key];
  const tableDraft = source ? { ...source } : create ? emptyTableDraft() : undefined;
  if (tableDraft) nextTables[key] = tableDraft;
  return { tables: nextTables, tableDraft };
}

function tableDraftDirty(tableDraft: SaveEditTableDraft) {
  return Object.values(tableDraft.updated).some((values) => Object.keys(values).length > 0) ||
    Object.keys(tableDraft.inserted).length > 0 ||
    Object.keys(tableDraft.deleted).length > 0;
}

function tableRowValues(table: BgDatabaseTable, rowIndex: number) {
  return Object.fromEntries(table.fieldNames.flatMap((fieldName) => {
    const field = table.fields[fieldName];
    if (!field?.parsed) return [];
    return [[fieldName, formatSaveValue(field.values[rowIndex])]];
  }));
}

function cleanValuesForTable(table: BgDatabaseTable, values: Record<string, string>) {
  return Object.fromEntries(Object.entries(values).filter(([fieldName]) => Boolean(table.fields[fieldName])));
}

function dirtyFieldSet(initialValues: Record<string, string>, values: Record<string, string>) {
  const result = new Set<string>();
  const keys = new Set([...Object.keys(initialValues), ...Object.keys(values)]);
  for (const key of keys) {
    if ((values[key] ?? "") !== (initialValues[key] ?? "")) result.add(key);
  }
  return result;
}
