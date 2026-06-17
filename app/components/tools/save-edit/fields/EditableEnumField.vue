<script setup lang="ts">
import {
  Select,
  SelectItem,
  SelectValue,
} from "~/components/ui/select";
import EditableFieldFrame from "./EditableFieldFrame.vue";

export type EditableEnumOption = {
  value: string;
  label: string;
};

const props = withDefaults(defineProps<{
  initialValue: string;
  modelValue: string;
  options: EditableEnumOption[];
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  hint?: string;
  compact?: boolean;
}>(), {
  placeholder: "",
  disabled: false,
  readonly: false,
  hint: "",
  compact: false,
});

const emit = defineEmits<{
  update: [value: string];
}>();

const dirty = computed(() => props.modelValue !== props.initialValue);
const selectedLabel = computed(() => props.options.find((option) => option.value === props.modelValue)?.label || "");
</script>

<template>
  <EditableFieldFrame
    :dirty="dirty"
    :disabled="disabled"
    :readonly="readonly"
    :hint="hint"
    :compact="compact"
    @reset="emit('update', initialValue)"
  >
    <Select
      :model-value="modelValue"
      :disabled="disabled || readonly"
      @update:model-value="emit('update', String($event))"
    >
      <AppSelectTrigger
        class="w-full min-w-0"
      >
        <SelectValue :placeholder="placeholder">
          {{ selectedLabel || placeholder }}
        </SelectValue>
      </AppSelectTrigger>
      <AppSelectContent>
        <SelectItem v-for="option in options" :key="option.value" :value="option.value">
          {{ option.label }}
        </SelectItem>
      </AppSelectContent>
    </Select>
  </EditableFieldFrame>
</template>
