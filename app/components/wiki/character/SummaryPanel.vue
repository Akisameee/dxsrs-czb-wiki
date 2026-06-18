<script setup lang="ts">
import type { CharacterSummary } from "~/lib/wiki/character";
import CharacterPortrait from "~/components/wiki/character/CharacterPortrait.vue";
import WikiSummaryPanel from "~/components/wiki/WikiSummaryPanel.vue";
import WikiText from "~/components/wiki/WikiText.vue";

defineProps<{
  summary: CharacterSummary | null;
  pending?: boolean;
  error?: Error | null;
}>();
</script>

<template>
  <WikiSummaryPanel
    :summary="summary"
    :pending="pending"
    :error="error"
    empty-label="未找到人物"
    :title="summary?.name"
    :description="summary?.location"
    :badges="summary ? [{ label: summary.rarity, variant: 'outline' }] : []"
  >
    <template #avatar="{ summary: currentSummary }">
      <CharacterPortrait
        :ids="{ characterId: currentSummary.id, portrait: currentSummary.portrait }"
        :fallback="currentSummary.initial"
        :size="48"
      />
    </template>
    <template #default="{ summary: currentSummary }">
    <div class="grid gap-2 text-sm">
      <div class="flex justify-between gap-3">
        <span class="text-muted-foreground">门派</span>
        <span>{{ currentSummary.sect }}</span>
      </div>
    </div>
    <div class="grid gap-2 text-sm">
      <div class="flex justify-between gap-3">
        <span class="text-muted-foreground">资质</span>
        <span>{{ currentSummary.rarity }}</span>
      </div>
    </div>
    <div class="grid gap-2 text-sm">
      <div class="flex justify-between gap-3">
        <span class="text-muted-foreground">武器类型</span>
        <span>{{ currentSummary.weaponType }}</span>
      </div>
    </div>

    <div v-if="currentSummary.invitationRequirements.length" class="grid gap-2 border-t pt-3 text-sm">
      <div class="text-muted-foreground">邀请条件</div>
      <div
        v-for="requirement in currentSummary.invitationRequirements"
        :key="requirement.slot"
      >
        <span class="text-muted-foreground">条件 {{ requirement.slot + 1 }}：</span>
        <WikiText :parts="requirement.parts" />
      </div>
    </div>
    <div v-else class="border-t pt-3 text-sm text-muted-foreground">
      无邀请条件
    </div>

    <div v-if="currentSummary.quests.length" class="grid gap-2 border-t pt-3 text-sm">
      <div class="text-muted-foreground">心愿任务</div>
      <div
        v-for="quest in currentSummary.quests"
        :key="quest.id"
      >
        <span class="text-muted-foreground">阶段 {{ quest.stage }}：</span>
        <WikiText :parts="quest.parts" />
      </div>
    </div>
    <div v-else class="border-t pt-3 text-sm text-muted-foreground">
      无心愿任务
    </div>
    </template>
  </WikiSummaryPanel>
</template>
