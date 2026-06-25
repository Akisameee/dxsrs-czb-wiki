<script setup lang="ts">
import SaveEditHeaderCard from "~/components/tools/save-edit/SaveEditHeaderCard.vue";
import SaveFileCardGrid from "~/components/tools/save-edit/SaveFileCardGrid.vue";
import {
  formatSaveFileSize,
  isSaveEditCharacterSlotsFile,
  isSaveEditMeridianFile,
  isSaveEditStringListFile,
  isSaveEditTrackingFile,
  parseAnySaveEditFile,
  saveEditFileTypeLabel,
  updateEs2ScalarDraft,
  updateEs2StringListDraft,
  writeAnySaveEditFile,
  type SaveEditWorkspaceItem,
  type SaveEditWorkspaceItemView,
} from "~/lib/save-edit";

useHead({ title: "存档修改" });

const router = useRouter();
const { files, fileViews, allocateId, updateItem, removeItem, setFiles, resetItem, updateItemDraft } = useSaveEditWorkspace();

async function uploadSaves(uploadedFiles: File[]) {
  const items = await Promise.all(uploadedFiles.map(readSaveFile));
  const remainingItems = [...items];
  const replacedFiles: SaveEditWorkspaceItem[] = files.value.map((currentItem) => {
    const replacementIndex = remainingItems.findIndex((item) => item.fileName === currentItem.fileName);
    if (replacementIndex === -1) return currentItem;

    const replacement = remainingItems.splice(replacementIndex, 1)[0];
    if (!replacement) return currentItem;
    return { ...replacement, id: currentItem.id };
  });

  setFiles([...remainingItems, ...replacedFiles]);
}

async function readSaveFile(file: File): Promise<SaveEditWorkspaceItem> {
  const id = allocateId();
  const base = {
    id,
    fileName: file.name,
    fileSize: formatSaveFileSize(file.size),
    fileType: "未知",
    selectedTableIndex: 0,
  };

  try {
    const bytes = await file.arrayBuffer();
    const save = parseAnySaveEditFile(bytes);
    return { ...base, save, fileType: saveEditFileTypeLabel(save, file.name), errorMessage: "" };
  } catch (error) {
    return {
      ...base,
      save: null,
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
}

function editSave(item: SaveEditWorkspaceItem) {
  if (item.save?.kind !== "bgdatabase") return;
  void router.push({ path: "/tools/save-edit/character", query: { edit: item.fileName } });
}

function editCharacterSlotsSave(item: SaveEditWorkspaceItem) {
  if (!isSaveEditCharacterSlotsFile(item.save, item.fileName)) return;
  void router.push({ path: "/tools/save-edit/character-slots", query: { edit: item.fileName } });
}

function editMeridianSave(item: SaveEditWorkspaceItem) {
  if (!isSaveEditMeridianFile(item.save, item.fileName)) return;
  void router.push({ path: "/tools/save-edit/meridian", query: { edit: item.fileName } });
}

function editTrackingSave(item: SaveEditWorkspaceItem) {
  if (!isSaveEditTrackingFile(item.save, item.fileName)) return;
  void router.push({ path: "/tools/save-edit/tracking", query: { edit: item.fileName } });
}

function removeSave(id: number) {
  removeItem(id);
}

function removeAllSaves() {
  setFiles([]);
}

function downloadSave(item: SaveEditWorkspaceItemView) {
  if (!item.save || !import.meta.client) return;
  try {
    const output = writeAnySaveEditFile(item.save, item.draft);
    const arrayBuffer = new ArrayBuffer(output.byteLength);
    new Uint8Array(arrayBuffer).set(output);
    const blob = new Blob([arrayBuffer], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = item.fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    updateItem(item.id, { errorMessage: error instanceof Error ? error.message : String(error) });
  }
}

function downloadAllSaves() {
  for (const item of fileViews.value) {
    if (item.save) downloadSave(item);
  }
}

function updateScalarSave(item: SaveEditWorkspaceItemView, nextValue: string | number | boolean) {
  const save = item.save;
  if (save?.kind !== "es2") return;
  updateItemDraft(item.id, (draft) => updateEs2ScalarDraft(save, draft, nextValue));
}

function updateStringListSave(item: SaveEditWorkspaceItemView, values: string[]) {
  const save = item.save;
  if (!isSaveEditStringListFile(save)) return;
  updateItemDraft(item.id, (draft) => updateEs2StringListDraft(save, draft, values));
}

function resetSave(item: SaveEditWorkspaceItem) {
  resetItem(item.id);
}

</script>

<template>
  <AppPageContainer>
    <SaveEditHeaderCard
      :has-files="files.length > 0"
      :can-download="files.some((item) => item.save)"
      @upload="uploadSaves"
      @remove-all="removeAllSaves"
      @download-all="downloadAllSaves"
    />

    <SaveFileCardGrid
      v-if="files.length"
      :files="fileViews"
      @edit="editSave"
      @edit-character-slots="editCharacterSlotsSave"
      @edit-meridian="editMeridianSave"
      @edit-tracking="editTrackingSave"
      @download="downloadSave"
      @remove="removeSave"
      @reset="resetSave"
      @update-scalar="updateScalarSave"
      @update-string-list="updateStringListSave"
    />
  </AppPageContainer>
</template>
