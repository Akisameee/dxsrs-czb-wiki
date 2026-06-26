import { computed, type Ref } from "vue";
import { saveEditTableDraftKey, type SaveEditDraft, type SaveEditFieldView, type SaveEditTableRowView, type SaveEditTableView } from "~/lib/save-edit/draft";
import {
  deriveDeletedRows,
  deriveDirtyRows,
  deriveFieldIndex,
  deriveFieldView,
  deriveInitialRowValues,
  deriveInsertedRows,
  deriveRowView,
  deriveTableDirty,
} from "~/lib/save-edit/derive";
import { memoByRef } from "~/lib/save-edit/memo";
import { formatSaveValue } from "~/lib/save-edit/format";
import type { BgDatabaseField, BgDatabaseTable, BgDatabaseValue } from "~/lib/bgdatabase";

export function useSaveEditTableViewIndex(
  table: Ref<BgDatabaseTable>,
  draft: Ref<SaveEditDraft>,
) {
  const tableDraft = computed(() => draft.value.tables[saveEditTableDraftKey(table.value)]);

  // per-row memos keyed by rowIndex
  const memoInitialRow = new Map<number, ReturnType<typeof memoByRef<[BgDatabaseTable, number], Record<string, string>>>>();
  const memoRow = new Map<number, ReturnType<typeof memoByRef<[BgDatabaseTable, number, Record<string, string> | undefined, boolean], SaveEditTableRowView>>>();
  const memoFieldIdx = new Map<string, ReturnType<typeof memoByRef<[BgDatabaseTable, BgDatabaseField | undefined], Map<string, number[]>>>>();

  const memoDirtyRows = memoByRef(deriveDirtyRows);
  const memoDeletedRows = memoByRef(deriveDeletedRows);
  const memoInsertedRows = memoByRef(deriveInsertedRows);

  const dirty = computed(() => deriveTableDirty(tableDraft.value));
  const dirtyRows = computed(() => memoDirtyRows(tableDraft.value?.updated, tableDraft.value?.deleted));
  const deletedRows = computed(() => memoDeletedRows(tableDraft.value?.deleted));
  const insertedRows = computed(() => memoInsertedRows(table.value, tableDraft.value?.inserted));

  const tableView = computed<SaveEditTableView>(() => ({
    table: table.value,
    draft: draft.value,
    dirty: dirty.value,
    dirtyRows: dirtyRows.value,
    deletedRows: deletedRows.value,
    insertedRows: insertedRows.value,
  }));

  function row(rowIndex: number): SaveEditTableRowView {
    let memo = memoRow.get(rowIndex);
    if (!memo) {
      memo = memoByRef(deriveRowView);
      memoRow.set(rowIndex, memo);
    }
    const td = tableDraft.value;
    return memo(table.value, rowIndex, td?.updated[String(rowIndex)], Boolean(td?.deleted[String(rowIndex)]));
  }

  function initialRowValues(rowIndex: number): Record<string, string> {
    let memo = memoInitialRow.get(rowIndex);
    if (!memo) {
      memo = memoByRef(deriveInitialRowValues);
      memoInitialRow.set(rowIndex, memo);
    }
    return memo(table.value, rowIndex);
  }

  function field(target: BgDatabaseField | undefined, rowIndex: number): SaveEditFieldView {
    return deriveFieldView(target, rowIndex, tableDraft.value);
  }

  function value(target: BgDatabaseField | undefined, rowIndex: number): BgDatabaseValue {
    return field(target, rowIndex).value;
  }

  function text(target: BgDatabaseField | undefined, rowIndex: number): string {
    return field(target, rowIndex).text;
  }

  function initialText(target: BgDatabaseField | undefined, rowIndex: number): string {
    if (!target) return "";
    return initialRowValues(rowIndex)[target.name] ?? "";
  }

  function fieldIndex(fieldName: string) {
    let memo = memoFieldIdx.get(fieldName);
    if (!memo) {
      memo = memoByRef(deriveFieldIndex);
      memoFieldIdx.set(fieldName, memo);
    }
    return memo(table.value, table.value.fields[fieldName]);
  }

  function rowIndexesByInitialField(fieldName: string, fieldValue: string): number[] {
    return fieldIndex(fieldName).get(fieldValue) || [];
  }

  function initialFieldRows(fieldName: string): Map<string, number[]> {
    return fieldIndex(fieldName);
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
}
