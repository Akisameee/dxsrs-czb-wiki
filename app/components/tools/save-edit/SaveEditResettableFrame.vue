<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import SaveEditResetButton from "~/components/tools/save-edit/SaveEditResetButton.vue";
import { cn } from "~/lib/utils";

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(defineProps<{
  dirty?: boolean;
  invalid?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  hint?: string;
  error?: string;
  compact?: boolean;
  surface?: boolean;
  class?: HTMLAttributes["class"];
  resetClass?: HTMLAttributes["class"];
  resetLabel?: string;
}>(), {
  dirty: false,
  invalid: false,
  disabled: false,
  readonly: false,
  hint: "",
  error: "",
  compact: false,
  surface: true,
  class: undefined,
  resetClass: "-right-2 -top-2",
  resetLabel: "重置",
});

const emit = defineEmits<{
  reset: [];
}>();
</script>

<template>
  <div
    :class="cn(
      'relative w-full min-w-0',
      props.surface && 'rounded-md border border-transparent transition-[box-shadow,background-color,border-color]',
      props.surface && dirty && 'border-primary/30 bg-primary/5 ring-1 ring-primary/40',
      props.surface && invalid && 'border-destructive/50 bg-destructive/5 ring-1 ring-destructive/30',
      disabled && 'opacity-60',
      props.class,
    )"
  >
    <div class="min-w-0 h-full">
      <slot />
    </div>

    <SaveEditResetButton
      v-if="dirty && !readonly && !disabled"
      :class="cn('absolute z-10', props.resetClass)"
      :label="resetLabel"
      @click="emit('reset')"
    />

    <div v-if="error || hint" :class="cn('text-xs', error ? 'text-destructive' : 'text-muted-foreground')">
      {{ error || hint }}
    </div>
  </div>
</template>
