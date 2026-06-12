<script setup lang="ts">
import type { CustomMartialEffect, SearchResultRoute, SearchResultStats } from "~/components/tools/custom-martial-art/types";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
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
  effectText: (effect: CustomMartialEffect | null) => string;
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

</script>

<template>
  <Card>
    <CardHeader class="flex flex-row flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-2">
        <CardTitle>搜索结果</CardTitle>
        <span v-if="results.length" class="text-sm text-muted-foreground">
          共 {{ results.length }} 个，第 {{ page }} / {{ pageCount }} 页
        </span>
      </div>
      <div v-if="results.length" class="flex flex-wrap items-center justify-end gap-2">
        <Pagination
          class="mx-0 w-auto"
          :page="page"
          :items-per-page="pageSize"
          :sibling-count="1"
          :total="results.length"
          show-edges
          @update:page="emit('updatePage', $event)"
        >
          <PaginationContent v-slot="{ items }">
            <PaginationFirst />
            <PaginationPrevious />
            <template v-for="(item, index) in items" :key="index">
              <PaginationItem
                v-if="item.type === 'page'"
                :is-active="item.value === page"
                :value="item.value"
              >
                {{ item.value }}
              </PaginationItem>
              <PaginationEllipsis v-else />
            </template>
            <PaginationNext />
            <PaginationLast />
          </PaginationContent>
        </Pagination>
        <Button variant="outline" size="sm" @click="emit('sort')">
          排序：{{ sortLabel }}
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      <div v-if="!results.length" class="py-10 text-center text-sm text-muted-foreground">
        选择目标后点击搜索。
      </div>
      <div v-else class="grid gap-3">
        <Card v-for="route in visibleResults" :key="`${route.seed}-${resultAttributes(route)}`">
          <CardHeader>
            <div class="flex justify-between gap-3">
              <div class="flex flex-wrap gap-2">
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
                <Badge variant="secondary">风格 {{ route.initial.style.name }}</Badge>
                <Badge variant="secondary">范围 {{ route.initial.area.name }}</Badge>
                <Badge variant="secondary">{{ effectText(route.initial.effect) }}</Badge>
                <Badge variant="secondary">改良 {{ route.initial.gailiangkongjian }}</Badge>
              </div>
              <Badge variant="outline">seed {{ route.seed }}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex flex-wrap gap-2">
                <Badge v-if="resultStats(route).target?.styleId !== null" variant="outline">
                  风格 {{ formatPercent(resultStats(route).styleProbability) }}
                </Badge>
                <Badge v-if="resultStats(route).target?.areaName !== null" variant="outline">
                  范围 {{ formatPercent(resultStats(route).areaProbability) }}
                </Badge>
                <Badge v-if="resultStats(route).target?.effectType !== null" variant="outline">
                  效果 {{ formatPercent(resultStats(route).effectProbability) }}
                </Badge>
                <Badge variant="outline">威力均值 {{ formatNumber(resultStats(route).averagePower) }}</Badge>
                <Badge variant="outline">最大威力 {{ formatNumber(resultStats(route).maxPower) }}</Badge>
              </div>
              <Button variant="outline" size="sm" @click="emit('apply', route)">
                模拟
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </CardContent>
  </Card>
</template>
