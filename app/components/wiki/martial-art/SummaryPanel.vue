<script setup lang="ts">
import type { MartialArtSummary } from "~/lib/wiki/martial-art";
import { Badge } from "~/components/ui/badge";
import MartialArtIcon from "~/components/wiki/martial-art/MartialArtIcon.vue";
import WikiSummaryPanel from "~/components/wiki/WikiSummaryPanel.vue";
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
      <div class="grid grid-cols-2 gap-2 text-sm">
        <AppInfoRow label="门派" :value="currentSummary.sect" />
        <AppInfoRow label="风格">
          <div class="flex flex-wrap justify-end gap-2">
            <Badge
              v-for="style in currentSummary.styles"
              :key="style"
              variant="secondary"
            >
              {{ style }}
            </Badge>
          </div>
        </AppInfoRow>
      </div>

      <div class="grid gap-2 border-t pt-3 text-sm">
        <AppInfoRow label="获取" value-class="min-w-0 flex-1">
          <WikiText :parts="currentSummary.obtainMethodParts" />
        </AppInfoRow>
      </div>

      <div v-if="currentSummary.effects.length" class="grid gap-2 border-t pt-3 text-sm">
        <div class="text-muted-foreground">效果</div>
        <div class="grid gap-2">
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
        <div class="grid gap-2">
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
