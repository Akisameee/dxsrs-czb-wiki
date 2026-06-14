<script setup lang="ts">
import EditableFieldFrame from "./EditableFieldFrame.vue";

const props = withDefaults(defineProps<{
  initialValue: string;
  modelValue: string;
  trueValue?: string;
  falseValue?: string;
  disabled?: boolean;
  readonly?: boolean;
  hint?: string;
  compact?: boolean;
}>(), {
  trueValue: "true",
  falseValue: "false",
  disabled: false,
  readonly: false,
  hint: "",
  compact: false,
});

const emit = defineEmits<{
  update: [value: string];
}>();

const dirty = computed(() => props.modelValue !== props.initialValue);
const checked = computed(() => props.modelValue === props.trueValue || props.modelValue === "1");

function updateChecked(value: boolean | "indeterminate") {
  if (props.readonly || props.disabled || value === "indeterminate") return;
  emit("update", value ? props.trueValue : props.falseValue);
}
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
    <div class="flex h-9 items-center gap-2 rounded-md border px-3">
      <Checkbox
        :checked="checked"
        :disabled="disabled || readonly"
        @update:checked="updateChecked"
      />
      <span class="text-sm text-muted-foreground">{{ checked ? "是" : "否" }}</span>
    </div>
  </EditableFieldFrame>
</template>
