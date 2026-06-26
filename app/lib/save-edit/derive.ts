import type { BgDatabaseField, BgDatabaseTable } from "../bgdatabase";
import { formatSaveValue } from "./format";
import type {
  SaveEditDraft,
  SaveEditFieldView,
  SaveEditTableDraft,
  SaveEditTableRowView,
  SaveEditTableView,
} from "./draft";
import { saveEditTableDraftKey } from "./draft";

export function deriveInitialRowValues(table: BgDatabaseTable, rowIndex: number): Record<string, string> {
  return Object.fromEntries(table.fieldNames.flatMap((fieldName) => {
    const field = table.fields[fieldName];
    if (!field?.parsed) return [];
    return [[fieldName, formatSaveValue(field.values[rowIndex])]];
  }));
}

export function deriveRowView(
  table: BgDatabaseTable,
  rowIndex: number,
  updates: Record<string, string> | undefined,
  deleted: boolean,
): SaveEditTableRowView {
  const initialValues = deriveInitialRowValues(table, rowIndex);
  const values = updates ? { ...initialValues, ...updates } : initialValues;
  const dirtyFields = deriveDirtyFieldSet(initialValues, values);
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

export function deriveFieldView(
  field: BgDatabaseField | undefined,
  rowIndex: number,
  tableDraft: SaveEditTableDraft | undefined,
): SaveEditFieldView {
  const initialValue = field?.values[rowIndex] ?? null;
  const initialText = formatSaveValue(initialValue);
  if (!field) {
    return { field, rowIndex, initialValue, value: null, initialText, text: "", dirty: false };
  }
  const updates = tableDraft?.updated[String(rowIndex)];
  const dirty = Boolean(updates && field.name in updates);
  const text = dirty ? updates![field.name]! : initialText;
  return { field, rowIndex, initialValue, value: text, initialText, text, dirty };
}

export function deriveDirtyRows(
  updated: SaveEditTableDraft["updated"] | undefined,
  deleted: SaveEditTableDraft["deleted"] | undefined,
): Set<number> {
  const rows = new Set<number>();
  for (const k of Object.keys(updated || {})) rows.add(Number(k));
  for (const k of Object.keys(deleted || {})) rows.add(Number(k));
  return rows;
}

export function deriveDeletedRows(deleted: SaveEditTableDraft["deleted"] | undefined): Set<number> {
  return new Set(Object.keys(deleted || {}).map(Number));
}

export function deriveInsertedRows(
  table: BgDatabaseTable,
  inserted: SaveEditTableDraft["inserted"] | undefined,
): SaveEditTableRowView[] {
  return Object.entries(inserted || {}).map(([tempId, row]) => {
    const initialValues = cleanValuesForTable(table, row.initialValues);
    const values = { ...initialValues, ...cleanValuesForTable(table, row.values) };
    const dirtyFields = deriveDirtyFieldSet(initialValues, values);
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

export function deriveTableDirty(tableDraft: SaveEditTableDraft | undefined): boolean {
  if (!tableDraft) return false;
  return Object.values(tableDraft.updated).some((v) => Object.keys(v).length > 0) ||
    Object.keys(tableDraft.inserted).length > 0 ||
    Object.keys(tableDraft.deleted).length > 0;
}

export function deriveTableView(
  table: BgDatabaseTable,
  draft: SaveEditDraft,
  tableDraft: SaveEditTableDraft | undefined,
): SaveEditTableView {
  return {
    table,
    draft,
    dirty: deriveTableDirty(tableDraft),
    dirtyRows: deriveDirtyRows(tableDraft?.updated, tableDraft?.deleted),
    deletedRows: deriveDeletedRows(tableDraft?.deleted),
    insertedRows: deriveInsertedRows(table, tableDraft?.inserted),
  };
}

export function deriveFieldIndex(
  table: BgDatabaseTable,
  field: BgDatabaseField | undefined,
): Map<string, number[]> {
  const rowsByValue = new Map<string, number[]>();
  if (field?.parsed) {
    for (let i = 0; i < table.rowCount; i++) {
      const key = formatSaveValue(field.values[i]);
      const rows = rowsByValue.get(key) || [];
      rows.push(i);
      rowsByValue.set(key, rows);
    }
  }
  return rowsByValue;
}

export function tableDraftFromDraft(
  draft: SaveEditDraft,
  table: BgDatabaseTable,
): SaveEditTableDraft | undefined {
  return draft.tables[saveEditTableDraftKey(table)];
}

export function cleanValuesForTable(
  table: BgDatabaseTable,
  values: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(Object.entries(values).filter(([k]) => Boolean(table.fields[k])));
}

export function deriveDirtyFieldSet(
  initialValues: Record<string, string>,
  values: Record<string, string>,
): Set<string> {
  const result = new Set<string>();
  const keys = new Set([...Object.keys(initialValues), ...Object.keys(values)]);
  for (const key of keys) {
    if ((values[key] ?? "") !== (initialValues[key] ?? "")) result.add(key);
  }
  return result;
}
