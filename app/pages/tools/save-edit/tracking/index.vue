<script setup lang="ts">
import MissingSaveCard from "~/components/tools/save-edit/main/MissingSaveCard.vue";
import TrackingEditHeaderCard from "~/components/tools/save-edit/tracking/TrackingEditHeaderCard.vue";
import TrackingEditorCard from "~/components/tools/save-edit/tracking/TrackingEditorCard.vue";
import {
  applyEs2Draft,
  isSaveEditTrackingFile,
  saveEditTrackingValues,
  updateEs2StringListDraft,
  writeAnySaveEditFile,
} from "~/lib/save-edit";

useHead({ title: "埋点记录修改" });

const route = useRoute();
const { findAnyByFileName, updateItem } = useSaveEditWorkspace();

const editFileName = computed(() => String(route.query.edit || ""));
const item = computed(() => findAnyByFileName(editFileName.value));
const save = computed(() => item.value?.save || null);
const trackingSave = computed(() => {
  if (!isSaveEditTrackingFile(save.value, editFileName.value) || save.value?.kind !== "es2") return null;
  return save.value;
});
const currentTrackingSave = computed(() =>
  trackingSave.value && item.value ? applyEs2Draft(trackingSave.value, item.value.draft) : null,
);
const events = computed(() => saveEditTrackingValues(currentTrackingSave.value));
const initialEvents = computed(() => saveEditTrackingValues(trackingSave.value));

function updateEvents(values: string[]) {
  if (!item.value || !trackingSave.value) return;
  updateItem(item.value.id, { draft: updateEs2StringListDraft(trackingSave.value, item.value.draft, values) });
}

function resetEvents() {
  updateEvents(initialEvents.value);
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
    <TrackingEditHeaderCard
      :file-name="item?.fileName || editFileName"
      :event-count="events.length"
      :has-save="Boolean(trackingSave)"
      @download="downloadSave"
    />

    <MissingSaveCard v-if="!trackingSave" />

    <TrackingEditorCard
      v-else
      :events="events"
      :initial-events="initialEvents"
      @update-events="updateEvents"
      @reset="resetEvents"
    />
  </AppPageContainer>
</template>
