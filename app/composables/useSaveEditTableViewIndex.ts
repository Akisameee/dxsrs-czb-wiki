import { computed, type Ref } from "vue";
import {
  formatSaveValue,
  saveEditTableDraftKey,
  type BgDatabaseField,
  type BgDatabaseTable,
  type BgDatabaseValue,
  type SaveEditDraft,
  type SaveEditFieldView,
  type SaveEditTableDraft,
  type SaveEditTableRowView,
  type SaveEditTableView,
} from "~/lib/save-edit";

type InitialRowCacheEntry = {
  table: BgDatabaseTable;
  rowIndex: number;
  values: Record<string, string>;
};

type RowViewCacheEntry = {
  table: BgDatabaseTable;
  rowIndex: number;
  updates: Record<string, string> | undefined;
  deleted: boolean;
  view: SaveEditTableRowView;
};

type FieldIndexCacheEntry = {
  table: BgDatabaseTable;
  field: BgDatabaseField | undefined;
  rowsByValue: Map<string, number[]>;
};

type InsertedRowsCacheEntry = {
  table: BgDatabaseTable;
  inserted: SaveEditTableDraft["inserted"] | undefined;
  rows: SaveEditTableRowView[];
};

type DirtyRowsCacheEntry = {
  updated: SaveEditTableDraft["updated"] | undefined;
  deleted: SaveEditTableDraft["deleted"] | undefined;
  rows: Set<number>;
};

type DeletedRowsCacheEntry = {
  deleted: SaveEditTableDraft["deleted"] | undefined;
  rows: Set<number>;
};

export function useSaveEditTableViewIndex(
  table: Ref<BgDatabaseTable>,
  draft: Ref<SaveEditDraft>,
) {
  const initialRowCache = new Map<number, InitialRowCacheEntry>();
  const rowViewCache = new Map<number, RowViewCacheEntry>();
  const fieldIndexCache = new Map<string, FieldIndexCacheEntry>();
  let insertedRowsCache: InsertedRowsCacheEntry | null = null;
  let dirtyRowsCache: DirtyRowsCacheEntry | null = null;
  let deletedRowsCache: DeletedRowsCacheEntry | null = null;

  const tableDraft = computed(() => draft.value.tables[saveEditTableDraftKey(table.value)]);
  const dirtyRows = computed(() => selectDirtyRows());
  const deletedRows = computed(() => selectDeletedRows());
  const insertedRows = computed(() => selectInsertedRows());
  const dirty = computed(() =>
    Object.values(tableDraft.value?.updated || {}).some((values) => Object.keys(values).length > 0) ||
    Object.keys(tableDraft.value?.inserted || {}).length > 0 ||
    Object.keys(tableDraft.value?.deleted || {}).length > 0);
  const tableView = computed<SaveEditTableView>(() => ({
    table: table.value,
    draft: draft.value,
    dirty: dirty.value,
    dirtyRows: dirtyRows.value,
    deletedRows: deletedRows.value,
    insertedRows: insertedRows.value,
  }));

  function row(rowIndex: number): SaveEditTableRowView {
    const currentTable = table.value;
    const currentDraft = tableDraft.value;
    const updates = currentDraft?.updated[String(rowIndex)];
    const deleted = Boolean(currentDraft?.deleted[String(rowIndex)]);
    const cached = rowViewCache.get(rowIndex);
    if (
      cached &&
      cached.table === currentTable &&
      cached.rowIndex === rowIndex &&
      cached.updates === updates &&
      cached.deleted === deleted
    ) {
      return cached.view;
    }

    const initialValues = initialRowValues(rowIndex);
    const values = updates ? { ...initialValues, ...updates } : initialValues;
    const dirtyFields = dirtyFieldSet(initialValues, values);
    const view: SaveEditTableRowView = {
      key: `row-${rowIndex}`,
      target: { type: "row", rowIndex },
      status: deleted ? "deleted" : dirtyFields.size ? "updated" : "clean",
      rowIndex,
      initialValues,
      values,
      dirtyFields,
      rowDirty: deleted || dirtyFields.size > 0,
    };
    rowViewCache.set(rowIndex, { table: currentTable, rowIndex, updates, deleted, view });
    return view;
  }

  function field(
    target: BgDatabaseField | undefined,
    rowIndex: number,
  ): SaveEditFieldView {
    const initialValue = target?.values[rowIndex] ?? null;
    const view = target ? row(rowIndex) : null;
    const text = target ? view?.values[target.name] ?? "" : "";
    return {
      field: target,
      rowIndex,
      initialValue,
      value: text,
      initialText: formatSaveValue(initialValue),
      text,
      dirty: Boolean(target && view?.dirtyFields.has(target.name)),
    };
  }

  function value(target: BgDatabaseField | undefined, rowIndex: number): BgDatabaseValue {
    if (!target) return null;
    return row(rowIndex).values[target.name] ?? null;
  }

  function text(target: BgDatabaseField | undefined, rowIndex: number) {
    return formatSaveValue(value(target, rowIndex));
  }

  function initialText(target: BgDatabaseField | undefined, rowIndex: number) {
    if (!target) return "";
    return initialRowValues(rowIndex)[target.name] ?? "";
  }

  function rowIndexesByInitialField(fieldName: string, fieldValue: string) {
    const cache = fieldIndex(fieldName);
    return cache.rowsByValue.get(fieldValue) || [];
  }

  function initialFieldRows(fieldName: string) {
    return fieldIndex(fieldName).rowsByValue;
  }

  return {
    tableView,
    dirty,
    dirtyRows,
    deletedRows,
    insertedRows,
    row,
    field,
    value,
    text,
    initialText,
    initialFieldRows,
    rowIndexesByInitialField,
  };

  function initialRowValues(rowIndex: number) {
    const currentTable = table.value;
    const cached = initialRowCache.get(rowIndex);
    if (cached?.table === currentTable && cached.rowIndex === rowIndex) return cached.values;

    const values = Object.fromEntries(currentTable.fieldNames.flatMap((fieldName) => {
      const target = currentTable.fields[fieldName];
      if (!target?.parsed) return [];
      return [[fieldName, formatSaveValue(target.values[rowIndex])]];
    }));
    initialRowCache.set(rowIndex, { table: currentTable, rowIndex, values });
    return values;
  }

  function fieldIndex(fieldName: string) {
    const currentTable = table.value;
    const target = currentTable.fields[fieldName];
    const cached = fieldIndexCache.get(fieldName);
    if (cached?.table === currentTable && cached.field === target) return cached;

    const rowsByValue = new Map<string, number[]>();
    if (target?.parsed) {
      for (let rowIndex = 0; rowIndex < currentTable.rowCount; rowIndex += 1) {
        const key = formatSaveValue(target.values[rowIndex]);
        const rows = rowsByValue.get(key) || [];
        rows.push(rowIndex);
        rowsByValue.set(key, rows);
      }
    }
    const next = { table: currentTable, field: target, rowsByValue };
    fieldIndexCache.set(fieldName, next);
    return next;
  }

  function selectInsertedRows() {
    const currentTable = table.value;
    const inserted = tableDraft.value?.inserted;
    if (insertedRowsCache?.table === currentTable && insertedRowsCache.inserted === inserted) {
      return insertedRowsCache.rows;
    }

    const rows = Object.entries(inserted || {}).map(([tempId, insertedRow]) => {
      const initialValues = cleanValuesForTable(currentTable, insertedRow.initialValues);
      const values = { ...initialValues, ...cleanValuesForTable(currentTable, insertedRow.values) };
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
    insertedRowsCache = { table: currentTable, inserted, rows };
    return rows;
  }

  function selectDirtyRows() {
    const updated = tableDraft.value?.updated;
    const deleted = tableDraft.value?.deleted;
    const cached = dirtyRowsCache;
    if (cached && cached.updated === updated && cached.deleted === deleted) return cached.rows;

    const rows = new Set<number>();
    for (const rowIndex of Object.keys(updated || {})) rows.add(Number(rowIndex));
    for (const rowIndex of Object.keys(deleted || {})) rows.add(Number(rowIndex));
    dirtyRowsCache = { updated, deleted, rows };
    return rows;
  }

  function selectDeletedRows() {
    const deleted = tableDraft.value?.deleted;
    const cached = deletedRowsCache;
    if (cached && cached.deleted === deleted) return cached.rows;

    const rows = new Set(Object.keys(deleted || {}).map(Number));
    deletedRowsCache = { deleted, rows };
    return rows;
  }
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
