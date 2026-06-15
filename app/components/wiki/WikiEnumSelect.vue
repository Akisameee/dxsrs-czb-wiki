<script setup lang="ts">
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
} from "~/components/ui/select";

export type WikiEnumOption = {
  id: string;
  label: string;
};

const props = withDefaults(defineProps<{
  id?: string;
  modelValue: string;
  options: WikiEnumOption[];
  placeholder?: string;
  disabled?: boolean;
}>(), {
  placeholder: "",
  disabled: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const selectedLabel = computed(() => (
  props.options.find((option) => option.id === props.modelValue)?.label || ""
));

function onWheel(event: WheelEvent) {
  if (props.disabled || props.options.length === 0) return;

  event.preventDefault();
  const currentIndex = props.options.findIndex((option) => option.id === props.modelValue);
  const fallbackIndex = event.deltaY > 0 ? -1 : props.options.length;
  const index = currentIndex >= 0 ? currentIndex : fallbackIndex;
  const nextIndex = Math.min(
    props.options.length - 1,
    Math.max(0, index + (event.deltaY > 0 ? 1 : -1)),
  );
  emit("update:modelValue", props.options[nextIndex]?.id || props.modelValue);
}
</script>

<template>
  <Select
    :model-value="modelValue"
    :disabled="disabled"
    @update:model-value="emit('update:modelValue', String($event))"
  >
    <AppSelectTrigger :id="id" @wheel="onWheel">
      <SelectValue :placeholder="placeholder">
        {{ selectedLabel || placeholder }}
      </SelectValue>
    </AppSelectTrigger>
    <SelectContent>
      <SelectItem v-for="option in options" :key="option.id" :value="option.id">
        {{ option.label }}
      </SelectItem>
    </SelectContent>
  </Select>
</template>
