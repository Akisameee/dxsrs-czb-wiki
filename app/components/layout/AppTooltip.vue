<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";

const props = withDefaults(defineProps<{
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
  <TooltipProvider>
    <Tooltip v-model:open="open">
      <TooltipTrigger as-child @click="toggle">
        <slot name="trigger" :open="open" />
      </TooltipTrigger>
      <TooltipContent
        :side="side"
        :align="align"
        :side-offset="sideOffset"
        :class="contentClass"
      >
        <slot :open="open" />
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>
