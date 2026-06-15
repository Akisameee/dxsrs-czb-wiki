<script setup lang="ts">
import type { PrimitiveProps } from "reka-ui";
import type { HTMLAttributes } from "vue";
import { Button, type ButtonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";

interface Props extends PrimitiveProps {
  variant?: ButtonVariants["variant"];
  size?: ButtonVariants["size"];
  class?: HTMLAttributes["class"];
}

const props = withDefaults(defineProps<Props>(), {
  as: "button",
});

const compactClass = computed(() => {
  switch (props.size || "default") {
    case "default":
      return "h-8 px-2 text-sm md:h-9 md:px-2.5";
    case "sm":
      return "h-7 px-2 text-xs md:h-8 md:px-2.5 md:text-sm";
    case "lg":
      return "h-9 px-2.5 text-sm md:h-10";
    case "icon":
      return "size-8 md:size-9";
    case "icon-sm":
      return "size-7 md:size-8";
    case "icon-lg":
      return "size-9 md:size-10";
    default:
      return "";
  }
});
</script>

<template>
  <Button
    v-bind="$attrs"
    :as="as"
    :as-child="asChild"
    :variant="variant"
    :size="size"
    :class="cn(compactClass, props.class)"
  >
    <slot />
  </Button>
</template>
