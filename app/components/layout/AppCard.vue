<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { Card } from "~/components/ui/card";
import { cn } from "~/lib/utils";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <Card v-bind="$attrs" :class="cn('gap-4 py-4 md:gap-6 md:py-6', props.class)">
    <slot />
  </Card>
</template>
