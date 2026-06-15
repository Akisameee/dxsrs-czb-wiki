<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { SelectTrigger } from "~/components/ui/select";
import { cn } from "~/lib/utils";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <SelectTrigger
    v-bind="$attrs"
    :class="cn('min-w-0 w-full px-2 text-sm data-[size=default]:h-8 md:px-2.5 md:data-[size=default]:h-9 [&_[data-slot=select-value]]:min-w-0 [&_[data-slot=select-value]]:truncate', props.class)"
  >
    <slot />
  </SelectTrigger>
</template>
