import type { AnySaveEditFile, SaveEditDraft } from "./model";
import { applyEs2Draft } from "./es2";
import { createEmptySaveEditDraft } from "./draft";

export type SaveEditWorkspaceItem = {
  id: number;
  fileName: string;
  fileSize: string;
  fileType: string;
  save: AnySaveEditFile | null;
  selectedTableIndex: number;
  errorMessage: string;
};

export type SaveEditWorkspaceItemView = SaveEditWorkspaceItem & {
  draft: SaveEditDraft;
  currentSave: AnySaveEditFile | null;
};

export function createSaveEditWorkspaceItemView(
  item: SaveEditWorkspaceItem,
  draft: SaveEditDraft,
): SaveEditWorkspaceItemView {
  return {
    ...item,
    draft,
    currentSave: item.save?.kind === "es2" ? applyEs2Draft(item.save, draft) : item.save,
  };
}

export function saveEditWorkspaceDraft(
  drafts: Record<number, SaveEditDraft>,
  id: number,
) {
  return drafts[id] || createEmptySaveEditDraft();
}

export function withSaveEditWorkspaceDraft(
  item: SaveEditWorkspaceItem,
  drafts: Record<number, SaveEditDraft>,
) {
  return createSaveEditWorkspaceItemView(item, saveEditWorkspaceDraft(drafts, item.id));
}

export function setSaveEditWorkspaceDraft(
  drafts: Record<number, SaveEditDraft>,
  id: number,
  draft: SaveEditDraft,
) {
  return {
    ...drafts,
    [id]: draft,
  };
}

export function updateSaveEditWorkspaceDraft(
  drafts: Record<number, SaveEditDraft>,
  id: number,
  updater: (draft: SaveEditDraft) => SaveEditDraft,
) {
  return setSaveEditWorkspaceDraft(drafts, id, updater(saveEditWorkspaceDraft(drafts, id)));
}

export function resetSaveEditWorkspaceDraft(
  drafts: Record<number, SaveEditDraft>,
  id: number,
) {
  return setSaveEditWorkspaceDraft(drafts, id, createEmptySaveEditDraft());
}

export function removeSaveEditWorkspaceDraft(
  drafts: Record<number, SaveEditDraft>,
  id: number,
) {
  const { [id]: _removed, ...rest } = drafts;
  return rest;
}

export function keepSaveEditWorkspaceDrafts(
  drafts: Record<number, SaveEditDraft>,
  items: SaveEditWorkspaceItem[],
) {
  const validIds = new Set(items.map((item) => item.id));
  return Object.fromEntries(
    Object.entries(drafts).filter(([id]) => validIds.has(Number(id))),
  );
}
