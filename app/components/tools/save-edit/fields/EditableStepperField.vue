<script setup lang="ts">
import { ChevronLeftIcon, ChevronRightIcon } from "@lucide/vue";
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
  error?: string;
  compact?: boolean;
  dirty?: boolean;
  resetValue?: string;
}>(), {
  step: 1,
  disabled: false,
  readonly: false,
  hint: "",
  error: "",
  compact: false,
});

const emit = defineEmits<{
  update: [value: string];
}>();

const dirty = computed(() => props.dirty ?? props.modelValue !== props.initialValue);
const resetValue = computed(() => props.resetValue ?? props.initialValue);
const numericValue = computed(() => {
  const value = Number(props.modelValue);
  return Number.isFinite(value) ? value : props.min ?? 0;
});
const displayValue = computed(() => Number.isFinite(Number(props.modelValue)) ? props.modelValue : "-");

function bounded(value: number) {
  let next = value;
  if (props.min !== undefined) next = Math.max(props.min, next);
  if (props.max !== undefined) next = Math.min(props.max, next);
  return next;
}

function stepBy(offset: number) {
  if (props.disabled || props.readonly) return;
  emit("update", String(bounded(numericValue.value + offset * props.step)));
}
</script>

<template>
  <EditableFieldFrame
    :dirty="dirty"
    :disabled="disabled"
    :readonly="readonly"
    :hint="hint"
    :error="error"
    :invalid="Boolean(error)"
    :compact="compact"
    @reset="emit('update', resetValue)"
  >
    <div class="grid grid-cols-[2.25rem_1fr_2.25rem] items-center gap-2 rounded-md border bg-background px-2">
      <AppButton
        type="button"
        variant="ghost"
        size="icon"
        class="size-8"
        :disabled="disabled || readonly || (min !== undefined && numericValue <= min)"
        @click="stepBy(-1)"
      >
        <ChevronLeftIcon class="size-4" />
      </AppButton>
      <div class="text-center">
        {{ displayValue }}
      </div>
      <AppButton
        type="button"
        variant="ghost"
        size="icon"
        class="size-8"
        :disabled="disabled || readonly || (max !== undefined && numericValue >= max)"
        @click="stepBy(1)"
      >
        <ChevronRightIcon class="size-4" />
      </AppButton>
    </div>
  </EditableFieldFrame>
</template>
