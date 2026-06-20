<script setup lang="ts">
import WikiText from "~/components/wiki/WikiText.vue";
import type { ItemSummary } from "~/lib/wiki/item";

defineProps<{
  summary: ItemSummary;
}>();
</script>

<template>
  <AppCard v-if="summary.descriptionParts.length">
    <AppCardHeader>
      <CardTitle>说明</CardTitle>
    </AppCardHeader>
    <AppCardContent class="text-sm leading-7">
      <WikiText :parts="summary.descriptionParts" />
    </AppCardContent>
  </AppCard>
</template>
