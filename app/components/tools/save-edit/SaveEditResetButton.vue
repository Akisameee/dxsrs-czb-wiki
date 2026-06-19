<script setup lang="ts">
import { RotateCcwIcon } from "@lucide/vue";
import type { HTMLAttributes } from "vue";
import { cn } from "~/lib/utils";

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(defineProps<{
  label?: string;
  class?: HTMLAttributes["class"];
}>(), {
  label: "重置所有修改",
});
</script>

<template>
  <AppButton
    v-bind="$attrs"
    type="button"
    variant="ghost"
    size="icon"
    :class="cn(
      'size-6 rounded-full border bg-background text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground md:size-6',
      props.class,
    )"
  >
    <RotateCcwIcon class="size-3.5" />
    <span class="sr-only">{{ label }}</span>
  </AppButton>
</template>
