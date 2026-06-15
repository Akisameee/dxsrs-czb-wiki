<script setup lang="ts">
const props = withDefaults(defineProps<{
  id?: string;
  modelValue: string | number;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  disabled?: boolean;
}>(), {
  step: 1,
  disabled: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

function numberValue(value: string | number | undefined, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function decimalPlaces(value: string | number | undefined) {
  const text = String(value ?? "");
  return text.includes(".") ? text.split(".")[1]?.length || 0 : 0;
}

function formatNumber(value: number) {
  const places = decimalPlaces(props.step);
  return places > 0 ? value.toFixed(places).replace(/\.?0+$/, "") : String(Math.round(value));
}

function clamp(value: number) {
  const min = props.min === undefined ? -Infinity : numberValue(props.min, -Infinity);
  const max = props.max === undefined ? Infinity : numberValue(props.max, Infinity);
  return Math.min(max, Math.max(min, value));
}

function onWheel(event: WheelEvent) {
  if (props.disabled) return;

  event.preventDefault();
  const step = Math.abs(numberValue(props.step, 1)) || 1;
  const current = numberValue(props.modelValue, numberValue(props.min, 0));
  const direction = event.deltaY < 0 ? 1 : -1;
  emit("update:modelValue", formatNumber(clamp(current + direction * step)));
}
</script>

<template>
  <AppInput
    :id="id"
    :model-value="modelValue"
    type="number"
    :min="min"
    :max="max"
    :step="step"
    :disabled="disabled"
    @wheel="onWheel"
    @update:model-value="emit('update:modelValue', String($event))"
  />
</template>
