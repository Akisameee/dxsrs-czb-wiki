<script setup lang="ts">
import type { ItemSummary } from "~/lib/wiki/item";
import GameImage from "~/components/wiki/GameImage.vue";
import WikiSummaryPanel from "~/components/wiki/SummaryPanel.vue";
import WikiText from "~/components/wiki/WikiText.vue";

defineProps<{
  summary: ItemSummary | null;
  pending?: boolean;
  error?: Error | null;
}>();
</script>

<template>
  <WikiSummaryPanel
    :summary="summary"
    :pending="pending"
    :error="error"
    empty-label="未找到道具"
    :title="summary?.name"
    :description="summary?.type"
    :badges="summary ? [{ label: summary.rarity, variant: 'outline' }] : []"
  >
    <template #avatar="{ summary: currentSummary }">
      <GameImage
        :id="currentSummary.imageId"
        :alt="currentSummary.name"
        :fallback="currentSummary.initial"
        :size="40"
      />
    </template>
    <template #default="{ summary: currentSummary }">
    <div class="grid gap-2 text-sm">
      <div class="flex justify-between gap-3">
        <span class="text-muted-foreground">材料</span>
        <span>{{ currentSummary.materialText }}</span>
      </div>
      <div class="flex justify-between gap-3">
        <span class="text-muted-foreground">用途</span>
        <span>{{ currentSummary.useType }}</span>
      </div>
      <div class="flex justify-between gap-3">
        <span class="text-muted-foreground">价值</span>
        <span class="tabular-nums">{{ currentSummary.cost }}</span>
      </div>
    </div>

    <div class="grid gap-2 border-t pt-3 text-sm">
      <div class="text-muted-foreground">说明</div>
      <div>
        <WikiText :parts="currentSummary.descriptionParts" />
      </div>
    </div>

    <div v-if="currentSummary.useText !== '无' || currentSummary.useValues.length" class="grid gap-2 border-t pt-3 text-sm">
      <div class="text-muted-foreground">使用</div>
      <div><WikiText :parts="currentSummary.useEffectParts" /></div>
    </div>
    </template>
  </WikiSummaryPanel>
</template>
