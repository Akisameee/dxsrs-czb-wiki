<script setup lang="ts">
import EditableFieldFrame from "./EditableFieldFrame.vue";

const props = withDefaults(defineProps<{
  initialValue: string;
  modelValue: string;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  hint?: string;
  error?: string;
  compact?: boolean;
  dirty?: boolean;
  resetValue?: string;
}>(), {
  placeholder: "",
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
</script>

<template>
  <EditableFieldFrame
    :dirty="dirty"
    :disabled="disabled"
    :readonly="readonly"
    :hint="hint"
    :error="error"
    :compact="compact"
    @reset="emit('update', resetValue)"
  >
    <AppInput
      :model-value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      @update:model-value="emit('update', String($event))"
    />
  </EditableFieldFrame>
</template>
