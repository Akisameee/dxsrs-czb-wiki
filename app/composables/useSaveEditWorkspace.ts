import {
  applyEs2Draft,
  createEmptySaveEditDraft,
  hasSaveEditDraft,
  isSaveEditCharacterSlotsFile,
  saveEditCharacterSlotsValues,
  updateEs2CunDangsDraft,
  type AnySaveEditFile,
  type SaveEditDraft,
  type SaveEditFile,
} from "~/lib/save-edit";
import type { Es2CunDang } from "~/lib/es2";

export type ImportedSaveItem = {
  id: number;
  fileName: string;
  fileSize: string;
  fileType: string;
  save: AnySaveEditFile | null;
  draft: SaveEditDraft;
  selectedTableIndex: number;
  errorMessage: string;
};

export function useSaveEditWorkspace() {
  const files = useState<ImportedSaveItem[]>("save-edit-files", () => []);
  const nextId = useState("save-edit-next-id", () => 1);

  function allocateId() {
    const id = nextId.value;
    nextId.value += 1;
    return id;
  }

  function updateItem(id: number, patch: Partial<ImportedSaveItem>) {
    files.value = files.value.map((item) => (item.id === id ? { ...item, ...patch } : item));
  }

  function removeItem(id: number) {
    files.value = files.value.filter((item) => item.id !== id);
  }

  function setFiles(items: ImportedSaveItem[]) {
    files.value = items;
  }

  function resetItem(id: number) {
    updateItem(id, { draft: createEmptySaveEditDraft() });
  }

  function findByFileName(fileName: string) {
    const item = files.value.find((candidate) => candidate.fileName === fileName && candidate.save?.kind === "bgdatabase");
    return item ? { ...item, save: item.save as SaveEditFile } : null;
  }

  function findAnyByFileName(fileName: string) {
    return files.value.find((item) => item.fileName === fileName && item.save) || null;
  }

  function characterSlotsState(item: ImportedSaveItem | null | undefined) {
    const save = item?.save;
    if (!item || !isSaveEditCharacterSlotsFile(save, item.fileName) || save.kind !== "es2") {
      return {
        slots: [] as Es2CunDang[],
        initialSlots: [] as Es2CunDang[],
      };
    }

    const slots = saveEditCharacterSlotsValues(applyEs2Draft(save, item.draft));
    const initialSlots = saveEditCharacterSlotsValues(save);

    return { slots, initialSlots };
  }

  function updateCharacterSlots(itemId: number, values: Es2CunDang[]) {
    files.value = files.value.map((item) => {
      if (item.id === itemId && isSaveEditCharacterSlotsFile(item.save, item.fileName) && item.save.kind === "es2") {
        return { ...item, draft: updateEs2CunDangsDraft(item.save, item.draft, values) ?? createEmptySaveEditDraft() };
      }

      return item;
    });
  }

  function isItemDirty(item: ImportedSaveItem) {
    return hasSaveEditDraft(item.draft);
  }

  return {
    files,
    allocateId,
    updateItem,
    removeItem,
    setFiles,
    resetItem,
    findByFileName,
    findAnyByFileName,
    characterSlotsState,
    updateCharacterSlots,
    isItemDirty,
  };
}
