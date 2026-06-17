<script setup lang="ts">
import type { HTMLAttributes } from "vue";

withDefaults(defineProps<{
  contentClass?: HTMLAttributes["class"];
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  preventClickDefault?: boolean;
}>(), {
  contentClass: "",
  side: "top",
  align: "center",
  sideOffset: 4,
  preventClickDefault: false,
});

const open = defineModel<boolean>("open", { default: false });
</script>

<template>
  <AppHoverCard
    v-model:open="open"
    :side="side"
    :align="align"
    :side-offset="sideOffset"
    :prevent-click-default="preventClickDefault"
    :open-delay="0"
    :content-class="[
      'inline-flex w-fit max-w-xs items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs text-background shadow-md ring-0',
      contentClass,
    ]"
  >
    <template #trigger>
      <slot name="trigger" :open="open" />
    </template>
    <slot :open="open" />
  </AppHoverCard>
</template>
