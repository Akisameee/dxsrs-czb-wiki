<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { CardHeader } from "~/components/ui/card";
import { cn } from "~/lib/utils";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <CardHeader v-bind="$attrs" :class="cn('px-4 md:px-6', props.class)">
    <slot />
  </CardHeader>
</template>
