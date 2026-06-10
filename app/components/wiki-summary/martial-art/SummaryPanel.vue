<script setup lang="ts">
import type { MartialArtSummary } from "~/lib/wiki/martial-art";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import WikiText from "~/components/wiki/WikiText.vue";

defineProps<{
  summary: MartialArtSummary | null;
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
        <div class="text-sm text-muted-foreground">{{ summary.type }}</div>
      </div>
      <Badge variant="outline">{{ summary.rarity }}</Badge>
    </div>

    <div class="grid gap-2 text-sm">
      <div class="flex justify-between gap-3">
        <span class="text-muted-foreground">门派</span>
        <span class="tabular-nums">{{ summary.sect }}</span>
      </div>
      <div class="flex justify-between gap-3">
        <span class="text-muted-foreground">风格</span>
        <div class="flex flex-wrap justify-end gap-2">
          <Badge
            v-for="style in summary.styles"
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
          <WikiText :parts="summary.obtainMethodParts" />
        </span>
      </div>
    </div>

    <div v-if="summary.effects.length" class="grid gap-2 border-t pt-3 text-sm">
      <div class="text-muted-foreground">效果</div>
      <div class="grid gap-1">
        <div
          v-for="effect in summary.effects"
          :key="effect.id"
          class="rounded-md border px-3 py-2"
        >
          {{ effect.text }}
        </div>
      </div>
    </div>

    <div v-if="summary.passives.length" class="grid gap-2 border-t pt-3 text-sm">
      <div class="text-muted-foreground">被动</div>
      <div class="grid gap-1">
        <div
          v-for="passive in summary.passives"
          :key="passive"
          class="rounded-md border px-3 py-2"
        >
          {{ passive }}
        </div>
      </div>
    </div>
  </div>
  <div v-else class="text-sm text-muted-foreground">
    未找到武学
  </div>
</template>
