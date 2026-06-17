<script setup lang="ts">
import { Download, Pencil, UserRound } from "@lucide/vue";
import EditableBooleanField from "~/components/tools/save-edit/fields/EditableBooleanField.vue";
import EditableEnumField, { type EditableEnumOption } from "~/components/tools/save-edit/fields/EditableEnumField.vue";
import EditableNumberField from "~/components/tools/save-edit/fields/EditableNumberField.vue";
import EditableStringListField from "~/components/tools/save-edit/fields/EditableStringListField.vue";
import EditableTextField from "~/components/tools/save-edit/fields/EditableTextField.vue";
import { Separator } from "~/components/ui/separator";
import type { ImportedSaveItem } from "~/composables/useSaveEditWorkspace";
import {
  applyEs2Draft,
  decodeSaveEditEs2FileName,
  isSaveEditCharacterSlotsFile,
  isSaveEditNewestCharacterSlotFile,
  isSaveEditMeridianFile,
  isSaveEditStringListFile,
  isSaveEditTrackingFile,
  saveEditCharacterName,
  saveEditStringListValues,
  type AnySaveEditFile,
} from "~/lib/save-edit";
import SaveFileCard from "./SaveFileCard.vue";

type SaveFileCategoryId = "character" | "meridian" | "progress" | "settings" | "backup" | "other";
type EnumRow = {
  id: number;
  label: string | null;
};

const props = defineProps<{
  files: ImportedSaveItem[];
}>();

const emit = defineEmits<{
  edit: [item: ImportedSaveItem];
  editCharacterSlots: [item: ImportedSaveItem];
  editMeridian: [item: ImportedSaveItem];
  editTracking: [item: ImportedSaveItem];
  download: [item: ImportedSaveItem];
  remove: [id: number];
  reset: [item: ImportedSaveItem];
  updateScalar: [item: ImportedSaveItem, value: string | number | boolean];
  updateStringList: [item: ImportedSaveItem, value: string[]];
}>();

const categoryOrder: Array<{ id: SaveFileCategoryId; label: string }> = [
  { id: "character", label: "人物" },
  { id: "meridian", label: "经脉" },
  { id: "progress", label: "进度" },
  { id: "settings", label: "设置" },
  { id: "backup", label: "备份" },
  { id: "other", label: "其他" },
];

const characterKeys = new Set([
  "CunDangs",
  "NewestCunDang",
]);

const meridianKeys = new Set([
  "JingMaiPoint",
  "经脉",
]);

const progressKeys = new Set([
  "难度",
  "IsClear",
  "XKMUnlock",
  "XKMClear",
  "DS人生剧",
  "DS侠客传",
  "RenShengDesc",
  "XiaKeDesc",
  "DS埋点",
]);

const settingsKeys = new Set([
  "BGM",
  "SE",
  "HandBattle",
  "LastNanDu",
]);

const backupKeys = new Set([
  "SavePath",
  "BackUpPath",
  "XKMSavePath",
  "BackUpInfo",
]);

const difficultyKeys = new Set([
  "难度",
  "LastNanDu",
]);

const { queryRows } = useWikiDb();
const { data: difficultyRows } = await useAsyncData(
  "save-edit-file-card-difficulty-options",
  () => queryRows<EnumRow>(
    `SELECT id, label
     FROM enums
     WHERE type = 'Difficult'
     ORDER BY id`,
  ),
  { server: false },
);

const sections = computed(() =>
  categoryOrder
    .map((category) => ({
      ...category,
      files: props.files.filter((item) => categoryOf(item) === category.id),
    }))
    .filter((section) => section.files.length),
);
const difficultyOptions = computed<EditableEnumOption[]>(() =>
  (difficultyRows.value || []).map((row) => ({
    value: String(row.id),
    label: row.label || String(row.id),
  })),
);
const { characterSlotsState, isItemDirty } = useSaveEditWorkspace();
const characterSlotsItem = computed(() =>
  props.files.find((item) => isSaveEditCharacterSlotsFile(item.save, item.fileName)) || null,
);
const newestCharacterSlotOptions = computed<EditableEnumOption[]>(() => {
  const slots = characterSlotsState(characterSlotsItem.value).slots;
  return slots
    .filter((slot) => slot.uid && (slot.player || slot.savepath))
    .map((slot) => ({
      value: slot.uid,
      label: [
        slot.isNormalMode ? "人生剧" : "侠客传",
        `槽 ${slot.slotid + 1}`,
        slot.player || slot.savepath || slot.uid,
      ].join(" · "),
    }));
});

function categoryOf(item: ImportedSaveItem): SaveFileCategoryId {
  if (item.save?.kind === "bgdatabase") return "character";

  const key = decodeSaveEditEs2FileName(item.fileName)?.key || "";
  if (characterKeys.has(key)) return "character";
  if (meridianKeys.has(key)) return "meridian";
  if (progressKeys.has(key)) return "progress";
  if (settingsKeys.has(key)) return "settings";
  if (backupKeys.has(key)) return "backup";
  return "other";
}

function saveFileIcon(item: ImportedSaveItem) {
  if (item.save?.kind === "bgdatabase") return UserRound;
  return decodeSaveEditEs2FileName(item.fileName)?.icon;
}

function isInlineEditableSave(item: ImportedSaveItem) {
  const save = item.save;
  if (save?.kind !== "es2") return false;
  const type = save.es2.value.type;
  if (type === "list") {
    if (isSaveEditCharacterSlotsFile(save, item.fileName)) return false;
    if (isSaveEditTrackingFile(save, item.fileName)) return false;
    return isSaveEditStringListFile(save) && !isSaveEditMeridianFile(save, item.fileName);
  }
  return type === "int" || type === "bool" || type === "string";
}

function isDifficultySave(item: ImportedSaveItem) {
  return difficultyKeys.has(decodeSaveEditEs2FileName(item.fileName)?.key || "");
}

function isNewestCharacterSlotSave(item: ImportedSaveItem) {
  return isSaveEditNewestCharacterSlotFile(item.save, item.fileName);
}

function scalarValue(save: AnySaveEditFile | null) {
  if (save?.kind !== "es2") return "";
  const value = save.es2.value;
  if (value.type === "int" || value.type === "string") return value.value;
  if (value.type === "bool") return value.value;
  return "";
}

function scalarModelValue(item: ImportedSaveItem) {
  const value = scalarValue(currentSave(item));
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

function initialScalarModelValue(item: ImportedSaveItem) {
  const value = scalarValue(item.save);
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

function stringListValue(item: ImportedSaveItem) {
  const save = currentSave(item);
  return isSaveEditStringListFile(save) ? saveEditStringListValues(save) : [];
}

function initialStringListValue(item: ImportedSaveItem) {
  return isSaveEditStringListFile(item.save) ? saveEditStringListValues(item.save) : [];
}

function currentSave(item: ImportedSaveItem): AnySaveEditFile | null {
  return item.save?.kind === "es2" ? applyEs2Draft(item.save, item.draft) : item.save;
}
</script>

<template>
  <div class="grid gap-5">
    <section
      v-for="(section, sectionIndex) in sections"
      :key="section.id"
      class="grid gap-3"
    >
      <Separator v-if="sectionIndex > 0" />

      <div class="flex items-center gap-2">
        <h2 class="text-sm font-medium">{{ section.label }}</h2>
        <span class="text-xs text-muted-foreground">{{ section.files.length }}</span>
      </div>

      <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <SaveFileCard
          v-for="item in section.files"
          :key="item.id"
          :file-name="item.fileName"
          :file-size="item.fileSize"
          :file-type="item.fileType"
          :file-icon="saveFileIcon(item)"
          :character-name="item.save?.kind === 'bgdatabase' ? saveEditCharacterName(item.save, item.draft) : undefined"
          :can-edit="false"
          :dirty="isItemDirty(item)"
          :error-message="item.errorMessage"
          @edit="emit('edit', item)"
          @download="emit('download', item)"
          @remove="emit('remove', item.id)"
          @reset="emit('reset', item)"
        >
          <template #actions>
            <div v-if="isInlineEditableSave(item)" class="grid gap-2 grid-cols-[minmax(0,1fr)_auto]">
              <EditableEnumField
                v-if="isNewestCharacterSlotSave(item)"
                :initial-value="initialScalarModelValue(item)"
                :model-value="scalarModelValue(item)"
                :options="newestCharacterSlotOptions"
                placeholder="需要先导入存档槽索引"
                :disabled="!newestCharacterSlotOptions.length"
                @update="emit('updateScalar', item, $event)"
              />
              <EditableBooleanField
                v-else-if="item.save?.kind === 'es2' && item.save.es2.value.type === 'bool'"
                true-label="已开启"
                false-label="已关闭"
                :initial-value="initialScalarModelValue(item)"
                :model-value="scalarModelValue(item)"
                @update="emit('updateScalar', item, $event)"
              />
              <EditableEnumField
                v-else-if="item.save?.kind === 'es2' && item.save.es2.value.type === 'int' && isDifficultySave(item)"
                :initial-value="initialScalarModelValue(item)"
                :model-value="scalarModelValue(item)"
                :options="difficultyOptions"
                @update="emit('updateScalar', item, $event)"
              />
              <EditableNumberField
                v-else-if="item.save?.kind === 'es2' && item.save.es2.value.type === 'int'"
                :initial-value="initialScalarModelValue(item)"
                :model-value="scalarModelValue(item)"
                @update="emit('updateScalar', item, $event)"
              />
              <EditableStringListField
                v-else-if="isSaveEditStringListFile(item.save)"
                :initial-value="initialStringListValue(item)"
                :model-value="stringListValue(item)"
                @update="emit('updateStringList', item, $event)"
              />
              <EditableTextField
                v-else
                :initial-value="initialScalarModelValue(item)"
                :model-value="scalarModelValue(item)"
                @update="emit('updateScalar', item, $event)"
              />
              <div class="flex flex-wrap gap-2">
                <AppButton type="button" variant="outline" @click="emit('download', item)">
                  <Download class="size-4" />
                  下载
                </AppButton>
              </div>
            </div>
            <div v-else-if="item.save?.kind === 'bgdatabase'" class="flex flex-wrap gap-2">
              <AppButton type="button" @click="emit('edit', item)">
                <Pencil class="size-4" />
                修改
              </AppButton>
              <AppButton type="button" variant="outline" @click="emit('download', item)">
                <Download class="size-4" />
                下载
              </AppButton>
            </div>
            <div v-else-if="isSaveEditCharacterSlotsFile(item.save, item.fileName)" class="flex flex-wrap gap-2">
              <AppButton type="button" @click="emit('editCharacterSlots', item)">
                <Pencil class="size-4" />
                修改
              </AppButton>
              <AppButton type="button" variant="outline" @click="emit('download', item)">
                <Download class="size-4" />
                下载
              </AppButton>
            </div>
            <div v-else-if="isSaveEditMeridianFile(item.save, item.fileName)" class="flex flex-wrap gap-2">
              <AppButton type="button" @click="emit('editMeridian', item)">
                <Pencil class="size-4" />
                修改
              </AppButton>
              <AppButton type="button" variant="outline" @click="emit('download', item)">
                <Download class="size-4" />
                下载
              </AppButton>
            </div>
            <div v-else-if="isSaveEditTrackingFile(item.save, item.fileName)" class="flex flex-wrap gap-2">
              <AppButton type="button" @click="emit('editTracking', item)">
                <Pencil class="size-4" />
                修改
              </AppButton>
              <AppButton type="button" variant="outline" @click="emit('download', item)">
                <Download class="size-4" />
                下载
              </AppButton>
            </div>
          </template>
        </SaveFileCard>
      </div>
    </section>
  </div>
</template>
