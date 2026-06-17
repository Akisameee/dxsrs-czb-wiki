<script setup lang="ts">
import type { SelectContentProps } from "reka-ui";
import type { HTMLAttributes } from "vue";
import { SelectContent } from "~/components/ui/select";
import { cn } from "~/lib/utils";

const props = withDefaults(
  defineProps<SelectContentProps & { class?: HTMLAttributes["class"] }>(),
  {
    position: "popper",
    align: "center",
  },
);

const delegatedProps = computed(() => {
  const { class: _class, ...rest } = props;
  return rest;
});
</script>

<template>
  <SelectContent
    v-bind="{ ...$attrs, ...delegatedProps }"
    :class="cn('!min-w-0 max-w-[calc(100vw-1rem)] overflow-x-hidden', props.class)"
  >
    <slot />
  </SelectContent>
</template>
