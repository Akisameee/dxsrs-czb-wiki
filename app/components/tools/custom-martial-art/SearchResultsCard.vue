<script setup lang="ts">
import type { CustomMartialEffect, SearchResultRoute, SearchResultStats } from "~/components/tools/custom-martial-art/types";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";

const props = defineProps<{
  results: SearchResultRoute[];
  page: number;
  pageSize: number;
  sortLabel: string;
  isSimulating: boolean;
  effectText: (effect: CustomMartialEffect | null) => string;
  effectTypeText: (value: number | string | null | undefined) => string;
  styleText: (value: number | string | null | undefined) => string;
  weaponTypeText: (value: number | string | null | undefined) => string;
}>();

const emit = defineEmits<{
  sort: [];
  updatePage: [page: number];
  apply: [route: SearchResultRoute];
}>();

const ATTRIBUTE_NAMES = ["yi", "qi", "xing", "shen"] as const;

const pageCount = computed(() => Math.max(1, Math.ceil(props.results.length / props.pageSize)));
const visibleResults = computed(() => {
  const start = (props.page - 1) * props.pageSize;
  return props.results.slice(start, start + props.pageSize);
});

function resultAttributes(route: SearchResultRoute) {
  return ATTRIBUTE_NAMES.map((name) => route.input[name]).join(" / ");
}

function resultStats(route: SearchResultRoute): SearchResultStats {
  return route.stats || {};
}

function formatPercent(value: number | string | null | undefined) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0.0%";
  return `${(number * 100).toFixed(1)}%`;
}

function formatNumber(value: number | string | null | undefined, digits = 2) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0";
  return number.toFixed(digits).replace(/\.?0+$/, "");
}

function targetAreaText(value: string | null | undefined) {
  return value || "";
}

function targetEffectText(stats: SearchResultStats) {
  const name = props.effectTypeText(stats.target?.effectType);
  const level = Number(stats.target?.minEffectValue);
  return Number.isFinite(level) && level > 0 ? `${name} ${formatNumber(level, 0)}` : name;
}

function hasTargetValue(value: unknown) {
  return value !== null && value !== undefined && value !== "";
}

function hasSuccessfulPowerStats(stats: SearchResultStats) {
  return Number(stats.success || 0) > 0;
}

</script>

<template>
  <AppCard>
    <AppCardHeader class="grid gap-3">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <CardTitle>搜索结果</CardTitle>
        <AppButton v-if="results.length" variant="outline" size="sm" @click="emit('sort')">
          排序：{{ sortLabel }}
        </AppButton>
      </div>

      <div v-if="results.length" class="overflow-x-auto">
        <Pagination
          class="mx-0 w-full justify-center"
          :page="page"
          :items-per-page="pageSize"
          :sibling-count="0"
          :total="results.length"
          show-edges
          @update:page="emit('updatePage', $event)"
        >
          <PaginationContent v-slot="{ items }" class="min-w-max">
            <PaginationFirst class="max-sm:hidden" />
            <PaginationPrevious />
            <template v-for="(item, index) in items" :key="index">
              <PaginationItem
                v-if="item.type === 'page'"
                :is-active="item.value === page"
                :value="item.value"
                size="sm"
              >
                {{ item.value }}
              </PaginationItem>
              <PaginationEllipsis v-else />
            </template>
            <PaginationNext />
            <PaginationLast class="max-sm:hidden" />
          </PaginationContent>
        </Pagination>
      </div>
    </AppCardHeader>
    <AppCardContent>
      <div v-if="!results.length" class="py-10 text-center text-sm text-muted-foreground">
        选择目标后点击搜索
      </div>
      <div v-else class="grid gap-3">
        <AppCard v-for="route in visibleResults" :key="`${route.seed}-${resultAttributes(route)}`">
          <AppCardContent>
            <div class="grid gap-3">
              <div class="flex items-start justify-between gap-3">
                <div class="grid grid-cols-5 gap-x-3 gap-y-2">
                  <div class="grid min-w-10 justify-items-center gap-0.5">
                    <span class="text-xs text-muted-foreground">武器</span>
                    <span class="text-sm">{{ weaponTypeText(route.input.weaponType) }}</span>
                  </div>
                  <div class="grid min-w-10 justify-items-center gap-0.5">
                    <span class="text-xs text-muted-foreground">意念</span>
                    <span class="text-sm tabular-nums">{{ route.input.yi }}</span>
                  </div>
                  <div class="grid min-w-10 justify-items-center gap-0.5">
                    <span class="text-xs text-muted-foreground">气劲</span>
                    <span class="text-sm tabular-nums">{{ route.input.qi }}</span>
                  </div>
                  <div class="grid min-w-10 justify-items-center gap-0.5">
                    <span class="text-xs text-muted-foreground">形态</span>
                    <span class="text-sm tabular-nums">{{ route.input.xing }}</span>
                  </div>
                  <div class="grid min-w-10 justify-items-center gap-0.5">
                    <span class="text-xs text-muted-foreground">神韵</span>
                    <span class="text-sm tabular-nums">{{ route.input.shen }}</span>
                  </div>
                </div>
                <Badge variant="outline">seed {{ route.seed }}</Badge>
              </div>

              <div class="flex flex-wrap gap-2">
                <Badge variant="outline">风格 {{ route.initial.style.name }}</Badge>
                <Badge variant="outline">范围 {{ route.initial.area.name }}</Badge>
                <Badge variant="outline">{{ effectText(route.initial.effect) }}</Badge>
                <Badge variant="outline">改良空间 {{ route.initial.gailiangkongjian }}</Badge>
              </div>
            
              <div class="grid gap-2 grid-cols-[minmax(0,7fr)_minmax(0,1fr)]">
                <div class="flex flex-wrap gap-2">
                  <Badge v-if="hasTargetValue(resultStats(route).target?.styleId)" variant="secondary">
                    <span class="font-semibold">
                      {{ styleText(resultStats(route).target?.styleId) }}
                    </span>
                    {{ formatPercent(resultStats(route).styleProbability) }}
                  </Badge>
                  <Badge v-if="hasTargetValue(resultStats(route).target?.areaName)" variant="secondary">
                    <span class="font-semibold">
                      {{ targetAreaText(resultStats(route).target?.areaName) }}
                    </span>
                    {{ formatPercent(resultStats(route).areaProbability) }}
                  </Badge>
                  <Badge v-if="hasTargetValue(resultStats(route).target?.effectType)" variant="secondary">
                    <span class="font-semibold">
                      {{ targetEffectText(resultStats(route)) }}
                    </span>
                    {{ formatPercent(resultStats(route).effectProbability) }}
                  </Badge>
                  <Badge variant="secondary">平均成长 {{ formatNumber(resultStats(route).averageFinalPercent) }}</Badge>
                  <Badge variant="secondary">最大成长 {{ formatNumber(resultStats(route).maxFinalPercent) }}</Badge>
                  <template v-if="hasSuccessfulPowerStats(resultStats(route))">
                    <Badge variant="secondary">中位威力 {{ formatNumber(resultStats(route).medianPower) }}</Badge>
                    <Badge variant="secondary">最大威力 {{ formatNumber(resultStats(route).maxPower) }}</Badge>
                  </template>
                </div>
                
                <AppButton
                  variant="outline"
                  size="sm"
                  class="ml-auto"
                  :disabled="isSimulating"
                  @click="emit('apply', route)"
                >
                  模拟
                </AppButton>
              </div>
            </div>
          </AppCardContent>
        </AppCard>
      </div>
    </AppCardContent>
  </AppCard>
</template>
