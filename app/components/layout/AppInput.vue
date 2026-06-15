<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <Input
    v-bind="$attrs"
    :class="cn('h-8 min-w-0 px-2 text-sm md:h-9 md:px-2.5', props.class)"
  />
</template>
