<script setup lang="ts">
import { Trash2Icon } from "@lucide/vue";
import type { HTMLAttributes } from "vue";
import { cn } from "~/lib/utils";

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(defineProps<{
  label?: string;
  class?: HTMLAttributes["class"];
}>(), {
  label: "删除",
});
</script>

<template>
  <AppButton
    v-bind="$attrs"
    type="button"
    variant="ghost"
    size="icon"
    :class="cn(
      'size-8 rounded-full border border-destructive/30 bg-background text-destructive shadow-sm hover:bg-destructive/10 hover:text-destructive md:size-8',
      props.class,
    )"
  >
    <Trash2Icon class="size-4" />
    <span class="sr-only">{{ label }}</span>
  </AppButton>
</template>
