<script setup lang="ts">
import EditableFieldFrame from "./EditableFieldFrame.vue";

const props = withDefaults(defineProps<{
  initialValue: string;
  modelValue: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  readonly?: boolean;
  hint?: string;
  compact?: boolean;
  dirty?: boolean;
  resetValue?: string;
}>(), {
  step: 1,
  disabled: false,
  readonly: false,
  hint: "",
  compact: false,
});

const emit = defineEmits<{
  update: [value: string];
}>();

const dirty = computed(() => props.dirty ?? props.modelValue !== props.initialValue);
const resetValue = computed(() => props.resetValue ?? props.initialValue);
const numberValue = computed(() => props.modelValue === "" ? null : Number(props.modelValue));
const error = computed(() => {
  if (numberValue.value === null) return "";
  if (!Number.isFinite(numberValue.value)) return "请输入数字";
  if (props.min !== undefined && numberValue.value < props.min) return `不能小于 ${props.min}`;
  if (props.max !== undefined && numberValue.value > props.max) return `不能大于 ${props.max}`;
  return "";
});
</script>

<template>
  <EditableFieldFrame
    :dirty="dirty"
    :invalid="Boolean(error)"
    :disabled="disabled"
    :readonly="readonly"
    :hint="hint"
    :error="error"
    :compact="compact"
    @reset="emit('update', resetValue)"
  >
    <AppInput
      type="number"
      :model-value="modelValue"
      :min="min"
      :max="max"
      :step="step"
      :disabled="disabled"
      :readonly="readonly"
      @update:model-value="emit('update', String($event))"
    />
  </EditableFieldFrame>
</template>
