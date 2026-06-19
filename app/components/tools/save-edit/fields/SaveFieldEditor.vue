<script setup lang="ts">
import {
  formatSaveValue,
  saveEditDraftFieldValue,
  saveEditDraftHasField,
  type SaveEditDraft,
} from "~/lib/save-edit";
import type { BgDatabaseField, BgDatabaseValue } from "~/lib/save-edit";
import EditableBooleanField from "./EditableBooleanField.vue";
import EditableEnumField from "./EditableEnumField.vue";
import EditableJsonField from "./EditableJsonField.vue";
import EditableNumberField from "./EditableNumberField.vue";
import EditableReadonlyField from "./EditableReadonlyField.vue";
import EditableTextField from "./EditableTextField.vue";

type EditableEnumOption = {
  value: string;
  label: string;
};

const props = withDefaults(defineProps<{
  field?: BgDatabaseField;
  rowIndex?: number;
  draft: SaveEditDraft;
  input?: "text" | "number" | "select" | "boolean" | "json" | "readonly";
  enumOptions?: Array<{ id: string; label: string }> | EditableEnumOption[];
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
  compact?: boolean;
}>(), {
  rowIndex: 0,
  input: "text",
  enumOptions: () => [],
  hint: "",
  compact: false,
});

const emit = defineEmits<{
  update: [field: BgDatabaseField, value: string, rowIndex: number];
}>();

const initialValue = computed(() => formatSaveValue(props.field?.values[props.rowIndex] as BgDatabaseValue | undefined));
const modelValue = computed(() => {
  if (!props.field) return "";
  return formatSaveValue(saveEditDraftFieldValue(props.field, props.rowIndex, props.draft));
});
const dirty = computed(() => saveEditDraftHasField(props.field, props.rowIndex, props.draft));
const resetValue = computed(() => initialValue.value);
const normalizedOptions = computed<EditableEnumOption[]>(() =>
  props.enumOptions.map((option) => ({
    value: "value" in option ? option.value : option.id,
    label: option.label,
  })),
);
const resolvedInput = computed(() => {
  if (!props.field) return "readonly";
  if (normalizedOptions.value.length) return "select";
  if (props.input === "boolean") return "boolean";
  if (props.input === "json") return "json";
  if (props.input === "readonly") return "readonly";
  if (props.input === "number") return "number";
  const value = props.field.values[props.rowIndex];
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  if (Array.isArray(value) || (value !== null && typeof value === "object")) return "json";
  return "text";
});

function update(value: string) {
  if (!props.field) return;
  emit("update", props.field, value, props.rowIndex);
}
</script>

<template>
  <div class="min-w-0 flex-1">
    <EditableReadonlyField
      v-if="!field || resolvedInput === 'readonly'"
      :initial-value="initialValue"
      :model-value="modelValue"
      :dirty="dirty"
      :hint="hint"
      :compact="compact"
    />
    <EditableEnumField
      v-else-if="resolvedInput === 'select'"
      :initial-value="initialValue"
      :model-value="modelValue"
      :dirty="dirty"
      :reset-value="resetValue"
      :options="normalizedOptions"
      :hint="hint"
      :compact="compact"
      @update="update"
    />
    <EditableBooleanField
      v-else-if="resolvedInput === 'boolean'"
      :initial-value="initialValue"
      :model-value="modelValue"
      :dirty="dirty"
      :reset-value="resetValue"
      true-value="true"
      false-value="false"
      :hint="hint"
      :compact="compact"
      @update="update"
    />
    <EditableNumberField
      v-else-if="resolvedInput === 'number'"
      :initial-value="initialValue"
      :model-value="modelValue"
      :dirty="dirty"
      :reset-value="resetValue"
      :min="min"
      :max="max"
      :step="step"
      :hint="hint"
      :compact="compact"
      @update="update"
    />
    <EditableJsonField
      v-else-if="resolvedInput === 'json'"
      :initial-value="initialValue"
      :model-value="modelValue"
      :dirty="dirty"
      :reset-value="resetValue"
      :hint="hint"
      :compact="compact"
      @update="update"
    />
    <EditableTextField
      v-else
      :initial-value="initialValue"
      :model-value="modelValue"
      :dirty="dirty"
      :reset-value="resetValue"
      :hint="hint"
      :compact="compact"
      @update="update"
    />
  </div>
</template>
