<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card";

const props = withDefaults(defineProps<{
  contentClass?: HTMLAttributes["class"];
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  openDelay?: number;
  closeDelay?: number;
  preventClickDefault?: boolean;
}>(), {
  contentClass: "",
  side: "bottom",
  align: "center",
  sideOffset: 4,
  openDelay: 200,
  closeDelay: 200,
  preventClickDefault: false,
});

const open = defineModel<boolean>("open", { default: false });
const route = useRoute();

watch(() => route.fullPath, () => {
  open.value = false;
});

function toggle(event: MouseEvent) {
  if (props.preventClickDefault) event.preventDefault();
  open.value = !open.value;
}
</script>

<template>
  <HoverCard
    v-model:open="open"
    :open-delay="openDelay"
    :close-delay="closeDelay"
  >
    <HoverCardTrigger as-child @click="toggle">
      <slot name="trigger" :open="open" />
    </HoverCardTrigger>
    <HoverCardContent
      :side="side"
      :align="align"
      :side-offset="sideOffset"
      :class="contentClass"
    >
      <slot :open="open" />
    </HoverCardContent>
  </HoverCard>
</template>
