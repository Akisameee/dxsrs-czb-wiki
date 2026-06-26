import type { Ref } from "vue";
import { memoByRef } from "~/lib/save-edit/memo";
import { saveEditTableDraftKey, createEmptySaveEditDraft, type SaveEditDraft } from "~/lib/save-edit/draft";
import type { BgDatabaseTable } from "~/lib/bgdatabase";

export function useSaveEditViewStore(draft: Ref<SaveEditDraft>) {
  const emptyDraft = createEmptySaveEditDraft();
  // one memo function per unique table-key combination
  const memos = new Map<string, (...sources: Array<unknown>) => SaveEditDraft>();

  function tablesDraft(tables: Array<BgDatabaseTable | null | undefined>): SaveEditDraft {
    const targets = tables.filter((t): t is BgDatabaseTable => Boolean(t));
    if (!targets.length) return emptyDraft;

    const keys = targets.map(saveEditTableDraftKey);
    const cacheKey = keys.join("|");

    let memo = memos.get(cacheKey);
    if (!memo) {
      memo = memoByRef((...sources) => {
        const tables: SaveEditDraft["tables"] = {};
        for (let i = 0; i < keys.length; i++) {
          if (sources[i] !== undefined) tables[keys[i]!] = sources[i] as SaveEditDraft["tables"][string];
        }
        return { tables, es2: {} };
      });
      memos.set(cacheKey, memo);
    }

    const sources = keys.map((key) => draft.value.tables[key]);
    return memo(...sources);
  }

  function tableDraft(table: BgDatabaseTable | null | undefined): SaveEditDraft {
    return tablesDraft(table ? [table] : []);
  }

  return { tableDraft, tablesDraft };
}
