<script setup lang="ts">
import { CheckIcon, XIcon } from "@lucide/vue";
import { cn } from "~/lib/utils";
import EditableFieldFrame from "./EditableFieldFrame.vue";

const props = withDefaults(defineProps<{
  initialValue: string;
  modelValue: string;
  trueValue?: string;
  falseValue?: string;
  trueLabel?: string;
  falseLabel?: string;
  disabled?: boolean;
  readonly?: boolean;
  hint?: string;
  compact?: boolean;
}>(), {
  trueValue: "true",
  falseValue: "false",
  trueLabel: "是",
  falseLabel: "否",
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

function toggle() {
  if (props.readonly || props.disabled) return;
  emit("update", checked.value ? props.falseValue : props.trueValue);
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
    <AppButton
      type="button"
      variant="outline"
      size="default"
      :aria-pressed="checked"
      :disabled="disabled || readonly"
      :class="cn(
        'w-full justify-start gap-2 font-normal',
        checked ? 'border-primary/50 bg-primary/10 text-foreground' : 'text-muted-foreground',
      )"
      @click="toggle"
    >
      <CheckIcon v-if="checked" class="size-4 shrink-0" />
      <XIcon v-else class="size-4 shrink-0" />
      <span class="text-sm text-muted-foreground">{{ checked ? trueLabel : falseLabel }}</span>
    </AppButton>
  </EditableFieldFrame>
</template>
