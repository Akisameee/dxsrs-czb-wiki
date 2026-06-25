<script setup lang="ts">
import MissingSaveCard from "~/components/tools/save-edit/main/MissingSaveCard.vue";
import CharacterSlotsEditHeaderCard from "~/components/tools/save-edit/character-slots/CharacterSlotsEditHeaderCard.vue";
import CharacterSlotsEditorCard from "~/components/tools/save-edit/character-slots/CharacterSlotsEditorCard.vue";
import {
  createSaveEditEs2PageView,
  hasSaveEditDraft,
  isSaveEditCharacterSlotsFile,
  saveEditCharacterSlotsValues,
  updateEs2CunDangsDraft,
  writeAnySaveEditFile,
} from "~/lib/save-edit";
import type { Es2CunDang } from "~/lib/es2";

useHead({ title: "存档槽修改" });

const route = useRoute();
const {
  findAnyByFileName,
  updateItem,
  resetItem,
  updateItemDraft,
} = useSaveEditWorkspace();

const editFileName = computed(() => String(route.query.edit || ""));
const item = computed(() => findAnyByFileName(editFileName.value));
const pageView = computed(() => (item.value ? createSaveEditEs2PageView(item.value, isSaveEditCharacterSlotsFile) : null));
const slots = computed(() => saveEditCharacterSlotsValues(pageView.value?.currentSave));
const initialSlots = computed(() => saveEditCharacterSlotsValues(pageView.value?.save));
const activeSlots = computed(() => slots.value.filter((slot) => slot.player || slot.savepath));
const dirty = computed(() => hasSaveEditDraft(pageView.value?.draft));

function updateSlots(values: Es2CunDang[]) {
  if (!item.value || !pageView.value) return;
  updateItemDraft(item.value.id, (draft) => updateEs2CunDangsDraft(pageView.value!.save, draft, values));
}

function resetSlots() {
  if (!item.value || !pageView.value) return;
  resetItem(item.value.id);
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
    <CharacterSlotsEditHeaderCard
      :file-name="item?.fileName || editFileName"
      :slot-count="slots.length"
      :active-count="activeSlots.length"
      :has-save="Boolean(pageView)"
      @download="downloadSave"
    />

    <MissingSaveCard v-if="!pageView" />

    <CharacterSlotsEditorCard
      v-else
      :slots="slots"
      :initial-slots="initialSlots"
      :dirty="dirty"
      @update-slots="updateSlots"
      @reset="resetSlots"
    />
  </AppPageContainer>
</template>
