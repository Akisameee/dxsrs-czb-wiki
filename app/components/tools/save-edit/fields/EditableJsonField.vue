<script setup lang="ts">
import EditableFieldFrame from "./EditableFieldFrame.vue";

const props = withDefaults(defineProps<{
  initialValue: string;
  modelValue: string;
  disabled?: boolean;
  readonly?: boolean;
  hint?: string;
  compact?: boolean;
}>(), {
  disabled: false,
  readonly: false,
  hint: "",
  compact: false,
});

const emit = defineEmits<{
  update: [value: string];
}>();

const dirty = computed(() => props.modelValue !== props.initialValue);
const error = computed(() => {
  if (!props.modelValue.trim()) return "";
  try {
    JSON.parse(props.modelValue);
    return "";
  } catch {
    return "JSON 格式不正确";
  }
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
    @reset="emit('update', initialValue)"
  >
    <textarea
      :value="modelValue"
      :disabled="disabled"
      :readonly="readonly"
      class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-24 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
      @input="emit('update', ($event.target as HTMLTextAreaElement).value)"
    />
  </EditableFieldFrame>
</template>
