<script setup lang="ts">
import type { CharacterSummary } from "~/lib/wiki/character";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";

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
      <Avatar size="lg">
        <AvatarFallback>{{ summary.initial }}</AvatarFallback>
      </Avatar>
      <div class="min-w-0">
        <div class="font-medium">{{ summary.name }}</div>
        <div class="text-sm text-muted-foreground">{{ summary.location }}</div>
      </div>
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
        {{ quest.stage }}. {{ quest.text }}
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
