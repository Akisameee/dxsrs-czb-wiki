<script setup lang="ts">
import { rarityCardClass } from "~/lib/rarity";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

defineProps<{
  currentSeed: number | null;
  attributesValid: boolean;
  attributeTarget: number;
  summary: any | null;
  improveLimit: number | null;
  rarityId: number | string | null;
  rareLabel: string;
  effectLabel: string;
}>();

function formatNumber(value: number | string | null | undefined, digits = 2) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0";
  return number.toFixed(digits).replace(/\.?0+$/, "");
}
</script>

<template>
  <Card :class="summary ? rarityCardClass(rarityId) : undefined">
    <CardHeader>
      <div class="flex justify-between gap-3">
        <CardTitle>初始模拟结果</CardTitle>
        <Badge v-if="currentSeed !== null" variant="outline">seed {{ currentSeed }}</Badge>
      </div>
    </CardHeader>
    <CardContent v-if="!attributesValid" class="text-sm text-muted-foreground">
      四维总和必须为 {{ attributeTarget }} 后才能自创。
    </CardContent>
    <CardContent v-else-if="!summary" class="text-sm text-muted-foreground">
      暂无结果。
    </CardContent>
    <CardContent v-else class="grid gap-3">
      <div class="flex justify-between gap-3">
        <span class="text-muted-foreground">品阶</span>
        <span>{{ rareLabel }}</span>
      </div>
      <div class="flex justify-between gap-3">
        <span class="text-muted-foreground">风格</span>
        <span>{{ summary.style.name }}</span>
      </div>
      <div class="flex justify-between gap-3">
        <span class="text-muted-foreground">攻击范围</span>
        <span>{{ summary.area.name }}</span>
      </div>
      <div class="flex justify-between gap-3">
        <span class="text-muted-foreground">特殊效果</span>
        <span>{{ effectLabel }}</span>
      </div>
      <div class="flex justify-between gap-3">
        <span class="text-muted-foreground">招式威力</span>
        <span>{{ formatNumber(summary.power) }}</span>
      </div>
      <div class="flex justify-between gap-3">
        <span class="text-muted-foreground">消耗真气</span>
        <span>{{ summary.cost }}</span>
      </div>
      <div class="flex justify-between gap-3">
        <span class="text-muted-foreground">改良空间</span>
        <span>{{ improveLimit ?? summary.gailiangkongjian }}</span>
      </div>
    </CardContent>
  </Card>
</template>
