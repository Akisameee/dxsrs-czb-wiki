<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "~/lib/utils";

const props = defineProps<{
  label?: string;
  value?: string | number | null;
  class?: HTMLAttributes["class"];
  labelClass?: HTMLAttributes["class"];
  valueClass?: HTMLAttributes["class"];
}>();
</script>

<template>
  <div :class="cn('flex min-w-0 items-start justify-between gap-3', props.class)">
    <span :class="cn('text-muted-foreground', props.labelClass)">
      <slot name="label">
        {{ label }}
      </slot>
    </span>
    <span :class="cn('min-w-0 text-right', props.valueClass)">
      <slot>{{ value }}</slot>
    </span>
  </div>
</template>
