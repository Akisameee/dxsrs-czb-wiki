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

const dirty = computed(() => props.modelValue !== props.initialValue);
</script>

<template>
  <EditableFieldFrame
    :dirty="dirty"
    :disabled="disabled"
    :readonly="readonly"
    :hint="hint"
    :error="error"
    :compact="compact"
    @reset="emit('update', initialValue)"
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
