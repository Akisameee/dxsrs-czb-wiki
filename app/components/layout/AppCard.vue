<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { Card } from "~/components/ui/card";
import { cn } from "~/lib/utils";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <Card v-bind="$attrs" :class="cn('gap-2 py-2 sm:gap-3 sm:py-3 md:gap-4 md:py-4 lg:gap-5 lg:py-5', props.class)">
    <slot />
  </Card>
</template>
