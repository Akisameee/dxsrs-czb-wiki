<script setup lang="ts">
import { rarityCardClass } from "~/lib/rarity";
import {
  formatItemNumber,
} from "~/lib/wiki/item";
import { useItemData } from "~/composables/useItemData";
import GameImage from "~/components/wiki/GameImage.vue";
import WikiText from "~/components/wiki/WikiText.vue";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";

useHead({ title: "道具详情" });

const route = useRoute();
const { loadItemDetail } = useItemData();

const itemId = computed(() => Number(route.query.id));

const { data, pending, error } = await useAsyncData(
  () => `items-detail-${route.query.id || "empty"}`,
  async () => {
    const id = Number(route.query.id);
    if (!Number.isFinite(id)) return { item: null, summary: null, enums: {} };

    return loadItemDetail(id);
  },
  { server: false, watch: [itemId] },
);

const item = computed(() => data.value?.item || null);
const summary = computed(() => data.value?.summary || null);
const useValuesText = computed(() => summary.value?.useValues.join(" / ") || "-");
const rawValueRows = computed(() => {
  const value = item.value;
  if (!value) return [];
  return [
    { label: "参数 1", value: value.use_value },
    { label: "参数 2", value: value.use_value2 },
    { label: "参数 3", value: value.use_value3 },
  ]
    .map((row) => ({ ...row, numberValue: Number(row.value) }))
    .filter((row) => Number.isFinite(row.numberValue) && row.numberValue !== 0)
    .map((row) => ({
      label: row.label,
      value: formatItemNumber(row.numberValue),
    }));
});
</script>

<template>
  <main class="container mx-auto grid gap-6 p-6">
    <Card v-if="error">
      <CardContent class="text-destructive">{{ error.message }}</CardContent>
    </Card>

    <Card v-else-if="pending">
      <CardHeader>
        <CardTitle>道具详情</CardTitle>
        <CardDescription>读取中...</CardDescription>
      </CardHeader>
    </Card>

    <Card v-else-if="!summary">
      <CardHeader>
        <CardTitle>道具详情</CardTitle>
        <CardDescription>没有找到 id: {{ route.query.id || "-" }}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button as-child variant="outline">
          <NuxtLink to="/items/">返回道具</NuxtLink>
        </Button>
      </CardFooter>
    </Card>

    <template v-else>
      <Card :class="rarityCardClass(summary.rarityId)">
        <CardHeader>
          <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div class="grid gap-2">
              <div>
                <CardTitle class="text-2xl">{{ summary.name }}</CardTitle>
                <CardDescription>{{ summary.type }}</CardDescription>
              </div>
            </div>

            <Button as-child variant="outline">
              <NuxtLink to="/items/">返回道具</NuxtLink>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div class="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>基础信息</CardTitle>
          </CardHeader>
          <CardContent class="grid gap-6 text-sm md:grid-cols-[auto_1fr]">
            <div class="flex w-32 items-center justify-center rounded-md">
              <GameImage
                :name="summary.icon"
                :alt="summary.name"
                :fallback="summary.initial"
                class="w-full text-2xl"
              />
            </div>
            <div class="grid content-start items-start gap-3 text-sm sm:grid-cols-2">
              <div class="flex items-start justify-between gap-3">
                <span class="text-muted-foreground">类型</span>
                <span>{{ summary.type }}</span>
              </div>
              <div class="flex items-start justify-between gap-3">
                <span class="text-muted-foreground">稀有度</span>
                <span>{{ summary.rarity }}</span>
              </div>
              <div class="flex items-start justify-between gap-3">
                <span class="text-muted-foreground">材料</span>
                <span>{{ summary.materialText }}</span>
              </div>
              <div class="flex items-start justify-between gap-3">
                <span class="text-muted-foreground">价值</span>
                <span class="tabular-nums">{{ summary.cost }}</span>
              </div>
              <div class="flex items-start justify-between gap-3">
                <span class="text-muted-foreground">使用类型</span>
                <span>{{ summary.useType }}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>需求</CardTitle>
          </CardHeader>
          <CardContent class="grid gap-2 text-sm">
            <div v-if="summary.requirements.length" class="grid gap-2">
              <div
                v-for="requirement in summary.requirements"
                :key="requirement.key"
                class="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <span class="text-muted-foreground">{{ requirement.label }}</span>
                <span class="tabular-nums">{{ requirement.value }}</span>
              </div>
            </div>
            <span v-else class="text-muted-foreground">无需求</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>说明</CardTitle>
        </CardHeader>
        <CardContent class="text-sm leading-7">
          <WikiText :parts="summary.descriptionParts" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>使用效果</CardTitle>
        </CardHeader>
        <CardContent class="grid gap-4 text-sm">
          <div><WikiText :parts="summary.useEffectParts" /></div>
          <template v-if="rawValueRows.length">
          </template>
        </CardContent>
      </Card>
    </template>
  </main>
</template>
