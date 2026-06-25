import { shallowRef, watch, type Ref, type ShallowRef } from "vue";
import {
  createEmptySaveEditDraft,
  saveEditTableDraftKey,
  type SaveEditDraft,
  type SaveEditTableDraft,
  type BgDatabaseTable,
} from "~/lib/save-edit";

type ScopedDraftCacheEntry = {
  sources: Array<SaveEditTableDraft | undefined>;
  draft: SaveEditDraft;
};

export function useSaveEditViewStore(draft: Ref<SaveEditDraft>) {
  const emptyDraft = createEmptySaveEditDraft();
  const scopedDraftCache = new Map<string, ScopedDraftCacheEntry>();
  const tableDraftRefs = new Map<string, ShallowRef<SaveEditTableDraft | undefined>>();
  let currentTables = draft.value.tables;

  watch(
    () => draft.value.tables,
    (tables) => {
      currentTables = tables;
      for (const [key, tableDraftRef] of tableDraftRefs) {
        tableDraftRef.value = tables[key];
      }
    },
    { immediate: true },
  );

  function tableDraft(table: BgDatabaseTable | null | undefined) {
    return tablesDraft(table ? [table] : []);
  }

  function tablesDraft(tables: Array<BgDatabaseTable | null | undefined>) {
    const targets = tables.filter((table): table is BgDatabaseTable => Boolean(table));
    if (!targets.length) return emptyDraft;

    const keys = targets.map(saveEditTableDraftKey);
    const sources = keys.map((key) => tableDraftRef(key).value);
    const cacheKey = keys.join("|");
    const cached = scopedDraftCache.get(cacheKey);

    if (cached && sameSources(cached.sources, sources)) return cached.draft;

    const scopedDraft: SaveEditDraft = {
      tables: Object.fromEntries(
        keys.flatMap((key, index) => sources[index] ? [[key, sources[index]!]] : []),
      ),
      es2: {},
    };
    scopedDraftCache.set(cacheKey, { sources, draft: scopedDraft });
    return scopedDraft;
  }

  return {
    tableDraft,
    tablesDraft,
  };

  function tableDraftRef(key: string) {
    let tableDraftRef = tableDraftRefs.get(key);
    if (!tableDraftRef) {
      tableDraftRef = shallowRef(currentTables[key]);
      tableDraftRefs.set(key, tableDraftRef);
    }
    return tableDraftRef;
  }
}

function sameSources(
  left: Array<SaveEditTableDraft | undefined>,
  right: Array<SaveEditTableDraft | undefined>,
) {
  return left.length === right.length && left.every((source, index) => source === right[index]);
}
