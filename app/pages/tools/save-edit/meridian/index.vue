<script setup lang="ts">
import MeridianEditHeaderCard from "~/components/tools/save-edit/meridian/MeridianEditHeaderCard.vue";
import MeridianEditorCard from "~/components/tools/save-edit/meridian/MeridianEditorCard.vue";
import MissingSaveCard from "~/components/tools/save-edit/character/MissingSaveCard.vue";
import {
  SAVE_EDIT_MERIDIAN_GROUPS,
  SAVE_EDIT_MERIDIAN_POINTS,
  applyEs2Draft,
  isSaveEditMeridianFile,
  saveEditMeridianValues,
  updateEs2StringListDraft,
  writeAnySaveEditFile,
} from "~/lib/save-edit";

useHead({ title: "经脉存档修改" });

const route = useRoute();
const { findAnyByFileName, updateItem } = useSaveEditWorkspace();

const editFileName = computed(() => String(route.query.edit || ""));
const item = computed(() => findAnyByFileName(editFileName.value));
const save = computed(() => item.value?.save || null);
const meridianSave = computed(() => {
  if (!isSaveEditMeridianFile(save.value, editFileName.value) || save.value?.kind !== "es2") return null;
  return save.value;
});
const currentMeridianSave = computed(() =>
  meridianSave.value && item.value ? applyEs2Draft(meridianSave.value, item.value.draft) : null,
);
const selected = computed(() => saveEditMeridianValues(currentMeridianSave.value));
const initialSelected = computed(() => saveEditMeridianValues(meridianSave.value));

function updateSelected(values: string[]) {
  if (!item.value || !meridianSave.value) return;
  updateItem(item.value.id, { draft: updateEs2StringListDraft(meridianSave.value, item.value.draft, values) });
}

function resetSelected() {
  updateSelected(initialSelected.value);
}

function downloadSave() {
  if (!item.value?.save || !import.meta.client) return;
  try {
    const output = writeAnySaveEditFile(item.value.save, item.value.draft);
    const arrayBuffer = new ArrayBuffer(output.byteLength);
    new Uint8Array(arrayBuffer).set(output);
    const blob = new Blob([arrayBuffer], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = item.value.fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    if (item.value) updateItem(item.value.id, { errorMessage: error instanceof Error ? error.message : String(error) });
  }
}
</script>

<template>
  <AppPageContainer>
    <MeridianEditHeaderCard
      :file-name="item?.fileName || editFileName"
      :selected-count="selected.length"
      :total-count="SAVE_EDIT_MERIDIAN_POINTS.length"
      :has-save="Boolean(meridianSave)"
      @download="downloadSave"
    />

    <MissingSaveCard v-if="!meridianSave" />

    <MeridianEditorCard
      v-else
      :groups="SAVE_EDIT_MERIDIAN_GROUPS"
      :selected="selected"
      :initial-selected="initialSelected"
      @update-selected="updateSelected"
      @reset="resetSelected"
    />
  </AppPageContainer>
</template>
