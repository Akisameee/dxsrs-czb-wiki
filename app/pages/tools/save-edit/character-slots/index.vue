<script setup lang="ts">
import MissingSaveCard from "~/components/tools/save-edit/character/MissingSaveCard.vue";
import CharacterSlotsEditHeaderCard from "~/components/tools/save-edit/character-slots/CharacterSlotsEditHeaderCard.vue";
import CharacterSlotsEditorCard from "~/components/tools/save-edit/character-slots/CharacterSlotsEditorCard.vue";
import {
  applyEs2Draft,
  isSaveEditCharacterSlotsFile,
  isSaveEditNewestCharacterSlotFile,
  saveEditCharacterSlotsValues,
  updateEs2CunDangsDraft,
  updateEs2ScalarDraft,
  writeAnySaveEditFile,
} from "~/lib/save-edit";
import type { Es2CunDang } from "~/lib/es2";

useHead({ title: "存档槽修改" });

const route = useRoute();
const { files, findAnyByFileName, updateItem } = useSaveEditWorkspace();

const editFileName = computed(() => String(route.query.edit || ""));
const item = computed(() => findAnyByFileName(editFileName.value));
const save = computed(() => item.value?.save || null);
const slotsSave = computed(() => {
  if (!isSaveEditCharacterSlotsFile(save.value, editFileName.value) || save.value?.kind !== "es2") return null;
  return save.value;
});
const newestSlotItem = computed(() =>
  files.value.find((candidate) => isSaveEditNewestCharacterSlotFile(candidate.save, candidate.fileName)) || null,
);
const currentSlotsSave = computed(() =>
  slotsSave.value && item.value ? applyEs2Draft(slotsSave.value, item.value.draft) : null,
);
const slots = computed(() => saveEditCharacterSlotsValues(currentSlotsSave.value));
const initialSlots = computed(() => cloneSlots(saveEditCharacterSlotsValues(slotsSave.value)));
const activeSlots = computed(() => slots.value.filter((slot) => slot.player || slot.savepath));

function updateSlots(values: Es2CunDang[]) {
  if (!item.value || !slotsSave.value) return;
  updateItem(item.value.id, { draft: updateEs2CunDangsDraft(slotsSave.value, item.value.draft, values) });

  const currentUid = values.find((slot) => slot.isplaying)?.uid || "";
  if (newestSlotItem.value?.save?.kind === "es2") {
    updateItem(newestSlotItem.value.id, {
      draft: updateEs2ScalarDraft(newestSlotItem.value.save, newestSlotItem.value.draft, currentUid),
    });
  }
}

function resetSlots() {
  updateSlots(cloneSlots(initialSlots.value));
}

function cloneSlots(values: Es2CunDang[]) {
  return values.map((slot) => ({ ...slot }));
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
      :has-save="Boolean(slotsSave)"
      @download="downloadSave"
    />

    <MissingSaveCard v-if="!slotsSave" />

    <CharacterSlotsEditorCard
      v-else
      :slots="slots"
      :initial-slots="initialSlots"
      @update-slots="updateSlots"
      @reset="resetSlots"
    />
  </AppPageContainer>
</template>
