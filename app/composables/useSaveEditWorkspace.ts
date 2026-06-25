import {
  type SaveEditDraft,
  keepSaveEditWorkspaceDrafts,
  removeSaveEditWorkspaceDraft,
  resetSaveEditWorkspaceDraft,
  saveEditWorkspaceDraft,
  updateSaveEditWorkspaceDraft,
  withSaveEditWorkspaceDraft,
  type SaveEditWorkspaceItem,
  type SaveEditWorkspaceItemView,
} from "~/lib/save-edit";

export function useSaveEditWorkspace() {
  const files = useState<SaveEditWorkspaceItem[]>("save-edit-files", () => []);
  const drafts = useState<Record<number, SaveEditDraft>>("save-edit-drafts", () => ({}));
  const nextId = useState("save-edit-next-id", () => 1);
  const fileViews = computed(() => files.value.map((item) => withItemDraft(item)));

  function allocateId() {
    const id = nextId.value;
    nextId.value += 1;
    return id;
  }

  function updateItem(id: number, patch: Partial<SaveEditWorkspaceItem>) {
    files.value = files.value.map((item) => (item.id === id ? { ...item, ...patch } : item));
  }

  function getItemDraft(id: number) {
    return saveEditWorkspaceDraft(drafts.value, id);
  }

  function updateItemDraft(id: number, updater: (draft: SaveEditDraft) => SaveEditDraft) {
    drafts.value = updateSaveEditWorkspaceDraft(drafts.value, id, updater);
  }

  function withItemDraft(item: SaveEditWorkspaceItem): SaveEditWorkspaceItemView {
    return withSaveEditWorkspaceDraft(item, drafts.value);
  }

  function removeItem(id: number) {
    files.value = files.value.filter((item) => item.id !== id);
    drafts.value = removeSaveEditWorkspaceDraft(drafts.value, id);
  }

  function setFiles(items: SaveEditWorkspaceItem[]) {
    files.value = items;
    drafts.value = keepSaveEditWorkspaceDrafts(drafts.value, items);
  }

  function resetItem(id: number) {
    drafts.value = resetSaveEditWorkspaceDraft(drafts.value, id);
  }

  function findByFileName(fileName: string): SaveEditWorkspaceItemView | null {
    const item = files.value.find((candidate) => candidate.fileName === fileName && candidate.save?.kind === "bgdatabase");
    return item ? withItemDraft(item) : null;
  }

  function findAnyByFileName(fileName: string): SaveEditWorkspaceItemView | null {
    const item = files.value.find((candidate) => candidate.fileName === fileName && candidate.save);
    return item ? withItemDraft(item) : null;
  }

  return {
    files,
    fileViews,
    allocateId,
    updateItem,
    updateItemDraft,
    removeItem,
    setFiles,
    resetItem,
    findByFileName,
    findAnyByFileName,
  };
}
