<script setup lang="ts">
import WikiText from "~/components/wiki/WikiText.vue";
import type { ItemSummary } from "~/lib/wiki/item";

const props = defineProps<{
  summary: ItemSummary;
}>();

const hasUseEffect = computed(() =>
  props.summary.useEffectText !== "无" || props.summary.useValues.length > 0,
);
</script>

<template>
  <AppCard v-if="hasUseEffect">
    <AppCardHeader>
      <CardTitle>使用效果</CardTitle>
    </AppCardHeader>
    <AppCardContent class="grid gap-4 text-sm">
      <div><WikiText :parts="summary.useEffectParts" /></div>
    </AppCardContent>
  </AppCard>
</template>
