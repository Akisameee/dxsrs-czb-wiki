<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";

const props = defineProps<{
  label?: string;
  labelFor?: string;
  class?: HTMLAttributes["class"];
  labelClass?: HTMLAttributes["class"];
}>();
</script>

<template>
  <div :class="cn('grid min-w-0 gap-1.5', props.class)">
    <Label :for="labelFor" :class="cn('text-muted-foreground', props.labelClass)">
      <slot name="label">
        {{ label }}
      </slot>
    </Label>
    <slot />
  </div>
</template>
