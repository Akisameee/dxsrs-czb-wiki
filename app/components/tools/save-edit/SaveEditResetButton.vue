<script setup lang="ts">
import { RotateCcwIcon } from "@lucide/vue";
import SaveEditActionButton from "./SaveEditActionButton.vue";
import type { ButtonVariants } from "~/components/ui/button";

const props = withDefaults(defineProps<{
  label?: string;
  size?: "sm" | "md" | "lg";
}>(), {
  label: "重置所有修改",
  size: "sm",
});

const sizeClass = computed<ButtonVariants["size"]>(() => {
  if (props.size === "lg") return "icon-lg";
  if (props.size === "md") return "icon-sm";
  return "icon-xs";
});
</script>

<template>
  <SaveEditActionButton
    v-bind="$attrs"
    variant="outline"
    :size="sizeClass"
    class="rounded-full border-border bg-background text-muted-foreground shadow-xs hover:text-foreground"
  >
    <RotateCcwIcon class="size-4" />
    <span class="sr-only">{{ label }}</span>
  </SaveEditActionButton>
</template>
