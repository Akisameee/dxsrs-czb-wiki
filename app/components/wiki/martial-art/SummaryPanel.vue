<script setup lang="ts">
import type { MartialArtSummary } from "~/lib/wiki/martial-art";
import { Badge } from "~/components/ui/badge";
import MartialArtIcon from "~/components/wiki/martial-art/MartialArtIcon.vue";
import WikiSummaryPanel from "~/components/wiki/SummaryPanel.vue";
import WikiText from "~/components/wiki/WikiText.vue";

defineProps<{
  summary: MartialArtSummary | null;
  pending?: boolean;
  error?: Error | null;
}>();
</script>

<template>
  <WikiSummaryPanel
    :summary="summary"
    :pending="pending"
    :error="error"
    empty-label="未找到武学"
    :title="summary?.name"
    :description="summary?.type"
    :badges="summary ? [{ label: summary.rarity, variant: 'outline' }] : []"
  >
    <template #avatar="{ summary: currentSummary }">
      <MartialArtIcon
        :name="currentSummary.name"
        :type-id="currentSummary.typeId"
        :rarity-id="currentSummary.rarityRawId"
        :size="40"
      />
    </template>
    <template #default="{ summary: currentSummary }">
    <div class="grid gap-2 text-sm">
      <div class="flex justify-between gap-3">
        <span class="text-muted-foreground">门派</span>
        <span class="tabular-nums">{{ currentSummary.sect }}</span>
      </div>
      <div class="flex justify-between gap-3">
        <span class="text-muted-foreground">风格</span>
        <div class="flex flex-wrap justify-end gap-2">
          <Badge
            v-for="style in currentSummary.styles"
            :key="style"
            variant="secondary"
          >
            {{ style }}
          </Badge>
        </div>
      </div>
    </div>

    <div class="grid gap-2 border-t pt-3 text-sm">
      <div class="flex justify-between gap-3">
        <span class="text-muted-foreground">获取</span>
        <span class="min-w-0 flex-1 text-right">
          <WikiText :parts="currentSummary.obtainMethodParts" />
        </span>
      </div>
    </div>

    <div v-if="currentSummary.effects.length" class="grid gap-2 border-t pt-3 text-sm">
      <div class="text-muted-foreground">效果</div>
      <div class="grid gap-1">
        <div
          v-for="effect in currentSummary.effects"
          :key="effect.id"
          class="rounded-md border px-3 py-2"
        >
          {{ effect.text }}
        </div>
      </div>
    </div>

    <div v-if="currentSummary.passives.length" class="grid gap-2 border-t pt-3 text-sm">
      <div class="text-muted-foreground">被动</div>
      <div class="grid gap-1">
        <div
          v-for="passive in currentSummary.passives"
          :key="passive"
          class="rounded-md border px-3 py-2"
        >
          {{ passive }}
        </div>
      </div>
    </div>
    </template>
  </WikiSummaryPanel>
</template>
