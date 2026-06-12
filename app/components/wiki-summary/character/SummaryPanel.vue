<script setup lang="ts">
import type { CharacterSummary } from "~/lib/wiki/character";
import { Badge } from "~/components/ui/badge";
import CharacterPortrait from "~/components/wiki/CharacterPortrait.vue";
import WikiText from "~/components/wiki/WikiText.vue";

defineProps<{
  summary: CharacterSummary | null;
  pending?: boolean;
  error?: Error | null;
}>();
</script>

<template>
  <div v-if="pending" class="text-sm text-muted-foreground">
    读取中...
  </div>
  <div v-else-if="error" class="text-sm text-destructive">
    {{ error.message }}
  </div>
  <div v-else-if="summary" class="grid gap-3">
    <div class="flex items-start gap-3">
      <CharacterPortrait
        :ids="{ characterId: summary.id, portrait: summary.portrait }"
        :fallback="summary.initial"
        :size="48"
      />
      <div class="min-w-0">
        <div class="font-medium">{{ summary.name }}</div>
        <div class="text-sm text-muted-foreground">{{ summary.location }}</div>
      </div>
      <Badge variant="outline">{{ summary.rarity }}</Badge>
    </div>

    <div class="grid gap-2 text-sm">
      <div class="flex justify-between gap-3">
        <span class="text-muted-foreground">门派</span>
        <span>{{ summary.sect }}</span>
      </div>
    </div>
    <div class="grid gap-2 text-sm">
      <div class="flex justify-between gap-3">
        <span class="text-muted-foreground">资质</span>
        <span>{{ summary.rarity }}</span>
      </div>
    </div>
    <div class="grid gap-2 text-sm">
      <div class="flex justify-between gap-3">
        <span class="text-muted-foreground">武器类型</span>
        <span>{{ summary.weaponType }}</span>
      </div>
    </div>

    <div v-if="summary.quests.length" class="grid gap-2 border-t pt-3 text-sm">
      <div class="text-muted-foreground">心愿任务</div>
      <div
        v-for="quest in summary.quests"
        :key="quest.id"
      >
        <span class="text-muted-foreground">阶段 {{ quest.stage }}：</span>
        <WikiText :parts="quest.parts" />
      </div>
    </div>
    <div v-else class="border-t pt-3 text-sm text-muted-foreground">
      无心愿任务
    </div>
  </div>
  <div v-else class="text-sm text-muted-foreground">
    未找到人物
  </div>
</template>
