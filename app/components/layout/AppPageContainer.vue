<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "~/lib/utils";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <main :class="cn('container mx-auto grid gap-4 p-3 md:gap-6 md:p-6', props.class)">
    <slot />
  </main>
</template>
