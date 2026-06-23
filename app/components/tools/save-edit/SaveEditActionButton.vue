<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import type { ButtonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(defineProps<{
  class?: HTMLAttributes["class"];
  variant?: ButtonVariants["variant"];
  size?: ButtonVariants["size"];
}>(), {
  class: undefined,
  variant: "ghost",
  size: "icon-sm",
});
</script>

<template>
  <AppButton
    v-bind="$attrs"
    type="button"
    :variant="props.variant"
    :size="props.size"
    :class="cn(props.class)"
  >
    <slot />
  </AppButton>
</template>
