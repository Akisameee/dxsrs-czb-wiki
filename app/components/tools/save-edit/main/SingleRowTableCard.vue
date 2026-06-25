<script setup lang="ts">
import EditableTableCardHeader from "./EditableTableCardHeader.vue";
import {
  selectSaveEditFieldView,
  selectSaveEditTableView,
  isEditableSaveValue,
  saveEditEnumOptions,
  type SaveEditDraft,
} from "~/lib/save-edit";
import WikiEnumSelect from "~/components/wiki/WikiEnumSelect.vue";
import type { BgDatabaseField, BgDatabaseTable } from "~/lib/save-edit";
import type { WikiEnums } from "~/lib/wiki/text";

const props = defineProps<{
  table: BgDatabaseTable;
  draft: SaveEditDraft;
  enums: WikiEnums;
}>();

const emit = defineEmits<{
  updateField: [field: BgDatabaseField, value: string, rowIndex: number];
}>();

const fields = computed(() =>
  props.table.fieldNames
    .map((fieldName) => props.table.fields[fieldName])
    .filter((field): field is BgDatabaseField => Boolean(field?.parsed && isEditableSaveValue(field.values[0] ?? null))),
);
const tableView = computed(() => selectSaveEditTableView(props.table, props.draft));

function fieldText(field: BgDatabaseField) {
  return selectSaveEditFieldView(field, 0, props.draft).text;
}

const dirty = computed(() => tableView.value.dirty);

function resetTable() {
  for (const field of fields.value) {
    const fieldView = selectSaveEditFieldView(field, 0, props.draft);
    if (fieldView.dirty) emit("updateField", field, fieldView.initialText, 0);
  }
}

function enumOptions(fieldName: string) {
  return saveEditEnumOptions(props.enums, props.table.name, fieldName);
}
</script>

<template>
  <AppCard>
    <EditableTableCardHeader
      :title="table.name"
      description="单行表，适合直接编辑"
      :dirty="dirty"
      @reset="resetTable"
    />
    <AppCardContent class="grid auto-rows-min gap-3 grid-cols-2">
      <AppFieldStack
        v-for="field in fields"
        :key="field.name"
        :label="field.name"
      >
        <WikiEnumSelect
          v-if="enumOptions(field.name).length"
          :model-value="fieldText(field)"
          :options="enumOptions(field.name)"
          @update:model-value="emit('updateField', field, $event, 0)"
        />
        <AppInput
          v-else
          :model-value="fieldText(field)"
          @update:model-value="emit('updateField', field, String($event), 0)"
        />
      </AppFieldStack>
    </AppCardContent>
  </AppCard>
</template>
