<script setup lang="ts">
import type { ItemSummary } from "~/lib/wiki/item";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";

defineProps<{
  summary: ItemSummary | null;
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
        <span class="text-muted-foreground">材料</span>
        <span>{{ summary.materialText }}</span>
      </div>
      <div class="flex justify-between gap-3">
        <span class="text-muted-foreground">用途</span>
        <span>{{ summary.useType }}</span>
      </div>
      <div class="flex justify-between gap-3">
        <span class="text-muted-foreground">价值</span>
        <span class="tabular-nums">{{ summary.cost }}</span>
      </div>
    </div>

    <div class="grid gap-2 border-t pt-3 text-sm">
      <div class="text-muted-foreground">说明</div>
      <div>{{ summary.description }}</div>
    </div>

    <div v-if="summary.useText !== '无' || summary.useValues.length" class="grid gap-2 border-t pt-3 text-sm">
      <div class="text-muted-foreground">使用</div>
      <div>{{ summary.useText }}</div>
      <div v-if="summary.useValues.length" class="flex flex-wrap gap-2">
        <Badge
          v-for="value in summary.useValues"
          :key="value"
          variant="secondary"
        >
          {{ value }}
        </Badge>
      </div>
    </div>
  </div>
  <div v-else class="text-sm text-muted-foreground">
    未找到道具
  </div>
</template>
