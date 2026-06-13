<script setup lang="ts">
import GameImage from "~/components/wiki/GameImage.vue";
import WikiSummaryPanel from "~/components/wiki/SummaryPanel.vue";
import WikiText from "~/components/wiki/WikiText.vue";
import type { ChainSummaryDescription } from "~/composables/useChainSummaryData";

export type SectChainSummary = {
  label: string;
  typeLabel: string;
  icon?: string | null;
  descriptions?: ChainSummaryDescription[];
};

defineProps<{
  summary: SectChainSummary | null;
}>();
</script>

<template>
  <WikiSummaryPanel
    :summary="summary"
    empty-label="未找到门派"
    :title="summary?.label"
    :description="summary?.typeLabel"
  >
    <template #avatar="{ summary: currentSummary }">
      <GameImage
        :name="currentSummary.icon"
        :alt="currentSummary.label"
        :fallback="currentSummary.label.slice(0, 1)"
        :size="32"
      />
    </template>

    <template #default="{ summary: currentSummary }">
      <div v-if="currentSummary.descriptions?.length" class="grid gap-1 border-t pt-3 text-sm">
        <div class="text-muted-foreground">连锁说明</div>
        <div
          v-for="(description, index) in currentSummary.descriptions"
          :key="index"
          class="flex justify-between items-start gap-2 rounded-md border px-3 py-2"
        >
          <span class="text-muted-foreground tabular-nums">{{ description.count }}</span>
          <WikiText :parts="description.parts" />
        </div>
      </div>
      <div v-else class="text-sm text-muted-foreground">
        暂无连锁说明
      </div>
    </template>
  </WikiSummaryPanel>
</template>
