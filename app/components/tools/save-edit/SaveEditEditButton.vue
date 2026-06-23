<script setup lang="ts">
import { PencilIcon } from "@lucide/vue";
import SaveEditActionButton from "./SaveEditActionButton.vue";

const props = withDefaults(defineProps<{
  label?: string;
}>(), {
  label: "编辑",
});
</script>

<template>
  <SaveEditActionButton
    v-bind="$attrs"
    class="text-muted-foreground hover:text-foreground"
  >
    <PencilIcon class="size-4" />
    <span class="sr-only">{{ label }}</span>
  </SaveEditActionButton>
</template>
