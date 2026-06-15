<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { CardContent } from "~/components/ui/card";
import { cn } from "~/lib/utils";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <CardContent v-bind="$attrs" :class="cn('px-4 md:px-6', props.class)">
    <slot />
  </CardContent>
</template>
