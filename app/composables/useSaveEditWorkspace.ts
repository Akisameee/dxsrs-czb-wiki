import type { SaveEditDraft, SaveEditFile } from "~/components/tools/save-edit/model";

export type ImportedSaveItem = {
  id: number;
  fileName: string;
  fileSize: string;
  save: SaveEditFile | null;
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

  function findByFileName(fileName: string) {
    return files.value.find((item) => item.fileName === fileName && item.save) || null;
  }

  return {
    files,
    allocateId,
    updateItem,
    removeItem,
    findByFileName,
  };
}
