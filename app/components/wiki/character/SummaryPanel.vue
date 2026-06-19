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
      <div class="grid grid-cols-2 gap-2 text-sm">
        <AppInfoRow label="门派" :value="currentSummary.sect" />
        <AppInfoRow label="地位" :value="currentSummary.position" />
        <AppInfoRow label="资历" :value="currentSummary.rank" />
        <AppInfoRow label="武器类型" :value="currentSummary.weaponType" />
      </div>

      <div v-if="currentSummary.invitationRequirements.length" class="grid gap-2 border-t pt-3 text-sm">
        <div class="text-muted-foreground">邀请条件</div>
        <div
          v-for="requirement in currentSummary.invitationRequirements"
          :key="requirement.slot"
          class="rounded-md border px-3 py-2"
        >
          <span class="text-muted-foreground">条件 {{ requirement.slot + 1 }}：</span>
          <WikiText :parts="requirement.parts" />
        </div>
      </div>

      <div v-if="currentSummary.quests.length" class="grid gap-2 border-t pt-3 text-sm">
        <div class="text-muted-foreground">心愿任务</div>
        <div
          v-for="quest in currentSummary.quests"
          :key="quest.id"
          class="rounded-md border px-3 py-2"
        >
          <span class="text-muted-foreground">阶段 {{ quest.stage }}：</span>
          <WikiText :parts="quest.parts" />
        </div>
      </div>
    </template>
  </WikiSummaryPanel>
</template>
