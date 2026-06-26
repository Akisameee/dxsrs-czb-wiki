<script setup lang="ts">
import EditableTableCardHeader from "./EditableTableCardHeader.vue";
import {
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

const index = useSaveEditTableViewIndex(toRef(props, "table"), toRef(props, "draft"));

const fields = computed(() =>
  props.table.fieldNames
    .map((fieldName) => props.table.fields[fieldName])
    .filter((field): field is BgDatabaseField => Boolean(field?.parsed && isEditableSaveValue(field.values[0] ?? null))),
);
const dirty = computed(() => index.dirty.value);

function resetTable() {
  for (const f of fields.value) {
    const fv = index.field(f, 0);
    if (fv.dirty) emit("updateField", f, fv.initialText, 0);
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
        v-for="f in fields"
        :key="f.name"
        :label="f.name"
      >
        <WikiEnumSelect
          v-if="enumOptions(f.name).length"
          :model-value="index.text(f, 0)"
          :options="enumOptions(f.name)"
          @update:model-value="emit('updateField', f, $event, 0)"
        />
        <AppInput
          v-else
          :model-value="index.text(f, 0)"
          @update:model-value="emit('updateField', f, String($event), 0)"
        />
      </AppFieldStack>
    </AppCardContent>
  </AppCard>
</template>
