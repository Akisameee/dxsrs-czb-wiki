<script setup lang="ts">
import EditableTableCardHeader from "./EditableTableCardHeader.vue";
import {
  fieldDraftKey,
  formatSaveValue,
  isEditableSaveValue,
  parseFieldDraftKey,
  saveEditEnumOptions,
  type SaveEditDraft,
} from "~/lib/save-edit";
import WikiEnumSelect from "~/components/wiki/WikiEnumSelect.vue";
import type { BgDatabaseField, BgDatabaseTable, BgDatabaseValue } from "~/lib/save-edit";
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

function fieldValue(field: BgDatabaseField): BgDatabaseValue {
  const key = fieldDraftKey(field, 0);
  return props.draft[key] ?? field.values[0] ?? null;
}

function initialFieldText(field: BgDatabaseField) {
  return formatSaveValue(field.values[0]);
}

const dirty = computed(() =>
  Object.keys(props.draft).some((key) => parseFieldDraftKey(key)?.tableIndex === props.table.tableIndex),
);

function resetTable() {
  for (const field of fields.value) {
    const initialValue = initialFieldText(field);
    if (fieldDraftKey(field, 0) in props.draft) emit("updateField", field, initialValue, 0);
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
      <div
        v-for="field in fields"
        :key="field.name"
        class="grid gap-1"
      >
        <Label class="text-muted-foreground">{{ field.name }}</Label>
        <WikiEnumSelect
          v-if="enumOptions(field.name).length"
          :model-value="formatSaveValue(fieldValue(field))"
          :options="enumOptions(field.name)"
          @update:model-value="emit('updateField', field, $event, 0)"
        />
        <AppInput
          v-else
          :model-value="formatSaveValue(fieldValue(field))"
          @update:model-value="emit('updateField', field, String($event), 0)"
        />
      </div>
    </AppCardContent>
  </AppCard>
</template>
