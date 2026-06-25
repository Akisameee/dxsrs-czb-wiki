<script setup lang="ts">
import MissingSaveCard from "~/components/tools/save-edit/main/MissingSaveCard.vue";
import TrackingEditHeaderCard from "~/components/tools/save-edit/tracking/TrackingEditHeaderCard.vue";
import TrackingEditorCard from "~/components/tools/save-edit/tracking/TrackingEditorCard.vue";
import {
  createSaveEditEs2PageView,
  isSaveEditTrackingFile,
  saveEditTrackingValues,
  updateEs2StringListDraft,
  writeAnySaveEditFile,
} from "~/lib/save-edit";

useHead({ title: "埋点记录修改" });

const route = useRoute();
const { findAnyByFileName, updateItem, updateItemDraft } = useSaveEditWorkspace();

const editFileName = computed(() => String(route.query.edit || ""));
const item = computed(() => findAnyByFileName(editFileName.value));
const pageView = computed(() => (item.value ? createSaveEditEs2PageView(item.value, isSaveEditTrackingFile) : null));
const events = computed(() => saveEditTrackingValues(pageView.value?.currentSave));
const initialEvents = computed(() => saveEditTrackingValues(pageView.value?.save));

function updateEvents(values: string[]) {
  if (!item.value || !pageView.value) return;
  updateItemDraft(item.value.id, (draft) => updateEs2StringListDraft(pageView.value!.save, draft, values));
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
      :has-save="Boolean(pageView)"
      @download="downloadSave"
    />

    <MissingSaveCard v-if="!pageView" />

    <TrackingEditorCard
      v-else
      :events="events"
      :initial-events="initialEvents"
      @update-events="updateEvents"
      @reset="resetEvents"
    />
  </AppPageContainer>
</template>
