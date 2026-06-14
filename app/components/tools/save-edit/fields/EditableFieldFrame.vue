<script setup lang="ts">
import { RotateCcwIcon } from "@lucide/vue";
import { cn } from "~/lib/utils";

const props = withDefaults(defineProps<{
  dirty?: boolean;
  invalid?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  hint?: string;
  error?: string;
  compact?: boolean;
  class?: string;
}>(), {
  dirty: false,
  invalid: false,
  disabled: false,
  readonly: false,
  hint: "",
  error: "",
  compact: false,
});

const emit = defineEmits<{
  reset: [];
}>();
</script>

<template>
  <div
    :class="cn(
      'relative w-full min-w-0 rounded-md border border-transparent transition-[box-shadow,background-color,border-color]',
      dirty && 'border-primary/30 bg-primary/5 ring-1 ring-primary/40',
      invalid && 'border-destructive/50 bg-destructive/5 ring-1 ring-destructive/30',
      disabled && 'opacity-60',
      props.class,
    )"
  >
    <div class="min-w-0">
      <slot />
    </div>

    <Button
      v-if="dirty && !readonly && !disabled"
      type="button"
      variant="ghost"
      size="icon"
      class="absolute -right-2 -top-2 z-10 size-6 rounded-full border bg-background text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground"
      @click="emit('reset')"
    >
      <RotateCcwIcon class="size-3.5" />
    </Button>

    <div v-if="error || hint" :class="cn('text-xs', error ? 'text-destructive' : 'text-muted-foreground')">
      {{ error || hint }}
    </div>
  </div>
</template>
