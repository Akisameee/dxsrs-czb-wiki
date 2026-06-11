<script setup lang="ts">
import {
  CustomMartialArtSimulation,
  estimateCustomMartialArtStats,
  makeZiChuangSeed,
  searchCustomMartialArtInitials,
  summarizeFinalValueDistributions,
} from "~/lib/custom-martial-art";

useHead({ title: "自创武学" });

const ATTRIBUTE_TOTAL = 20;
const ATTRIBUTE_NAMES = ["yi", "qi", "xing", "shen"] as const;
const WEAPON_TYPE_IDS = [0, 1, 2, 3, 4, 5];
const SEARCH_PAGE_SIZE = 10;
const EMPTY_OPTION = "none";
const SEARCH_SORT_FIELDS = [
  { id: "styleMatch", label: "风格概率" },
  { id: "effectLevel", label: "效果概率" },
  { id: "averagePower", label: "威力均值" },
  { id: "maxPower", label: "最大威力" },
];

const { data: context, pending, error } = useCustomMartialArtData();

const input = reactive({
  name: "自创武功",
  yi: "6",
  qi: "1",
  xing: "6",
  shen: "7",
  weaponType: "2",
});

const analysisTrials = ref("256");
const analysisStatus = ref("");
const analysisBusy = ref(false);
const analysis = ref<any | null>(null);

const searchTarget = reactive({
  weaponType: "2",
  styleId: EMPTY_OPTION,
  areaName: EMPTY_OPTION,
  effectType: EMPTY_OPTION,
  effectLevel: "",
});
const searchTrials = ref("96");
const searchStatus = ref("");
const searchBusy = ref(false);
const searchResults = ref<any[]>([]);
const searchPage = ref(1);
const searchSort = ref("styleMatch");

const enums = computed(() => context.value?.enums || {});
const algorithmData = computed(() => context.value?.data || null);
const effectNames = computed(() => context.value?.effectNames || new Map<number, string>());
const styleNames = computed(() => context.value?.styleNames || {});

const weaponOptions = computed(() => WEAPON_TYPE_IDS.map((id) => ({
  id: String(id),
  label: enumName("BingQiType", id, `武器 ${id}`),
})));

const attributeTotal = computed(() => ATTRIBUTE_NAMES.reduce((sum, key) => sum + numberValue(input[key]), 0));
const attributesValid = computed(() => attributeTotal.value === ATTRIBUTE_TOTAL);
const currentInput = computed(() => ({
  name: input.name,
  yi: numberValue(input.yi),
  qi: numberValue(input.qi),
  xing: numberValue(input.xing),
  shen: numberValue(input.shen),
  weaponType: numberValue(input.weaponType),
}));

const currentRoute = computed(() => {
  if (!algorithmData.value || !attributesValid.value) return null;
  try {
    return new CustomMartialArtSimulation(currentInput.value, algorithmData.value).toRoute(styleNames.value);
  } catch {
    return null;
  }
});

const currentSummary = computed(() => currentRoute.value?.initial || null);
const currentSeed = computed(() => attributesValid.value ? makeZiChuangSeed(currentInput.value) : null);

const styleOptions = computed(() => uniqueSorted((algorithmData.value?.chainRows || [])
  .map((row: any) => Number(row.fengge))
  .filter((id: number) => id > 0))
  .map((id) => ({ id: String(id), label: enumName("LianSuo_FG", id, `风格 ${id}`) })));

const areaOptions = computed(() => areasForWeapon(searchTarget.weaponType));

const effectOptions = computed(() => {
  const available = new Set((algorithmData.value?.ziChuangBuffRows || []).map((row: any) => Number(row.bufftype)));
  available.add(99);
  return (context.value?.effects || [])
    .filter((effect: any) => available.has(Number(effect.id)))
    .map((effect: any) => ({ id: String(effect.id), label: effect.name }));
});

const selectedEffectMaxLevel = computed(() => {
  const effectType = numberOrNull(searchTarget.effectType);
  if (effectType === null || effectType === 99) return 0;
  return (algorithmData.value?.ziChuangBuffRows || [])
    .filter((row: any) => Number(row.bufftype) === effectType)
    .reduce((max: number, row: any) => Math.max(max, Number(row.value || 0)), 0);
});

const searchTargetPayload = computed(() => ({
  weaponType: numberValue(searchTarget.weaponType),
  styleId: numberOrNull(searchTarget.styleId),
  areaName: searchTarget.areaName === EMPTY_OPTION ? null : searchTarget.areaName,
  effectType: numberOrNull(searchTarget.effectType),
  minEffectValue: selectedEffectMaxLevel.value > 0 ? numberOrNull(searchTarget.effectLevel) : null,
}));

const sortedSearchResults = computed(() => sortSearchResults(searchResults.value, searchSort.value));
const searchPageCount = computed(() => Math.max(1, Math.ceil(sortedSearchResults.value.length / SEARCH_PAGE_SIZE)));
const visibleSearchResults = computed(() => {
  const start = (searchPage.value - 1) * SEARCH_PAGE_SIZE;
  return sortedSearchResults.value.slice(start, start + SEARCH_PAGE_SIZE);
});

watch(() => input, () => {
  analysis.value = null;
  analysisStatus.value = "";
}, { deep: true });

watch(() => searchTarget.weaponType, () => {
  if (!areaOptions.value.some((option) => option.id === searchTarget.areaName)) {
    searchTarget.areaName = EMPTY_OPTION;
  }
});

watch(() => searchTarget.effectType, () => {
  if (selectedEffectMaxLevel.value > 0) {
    searchTarget.effectLevel = String(selectedEffectMaxLevel.value);
  } else {
    searchTarget.effectLevel = "";
  }
});

function numberValue(value: number | string | null | undefined, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function numberOrNull(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "" || value === EMPTY_OPTION) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function uniqueSorted<T>(items: T[]) {
  return [...new Set(items.filter((item) => item !== null && item !== undefined && item !== ""))]
    .sort((a, b) => String(a).localeCompare(String(b), "zh-Hans-CN"));
}

function enumName(type: string, id: number | string | null | undefined, fallback = "未知") {
  if (id === null || id === undefined || Number.isNaN(Number(id))) return fallback;
  return enums.value?.[type]?.[String(id)] || fallback;
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

function rareLabel(rare: number | string | null | undefined) {
  return enumName("WuGongRare", rare, `稀有度 ${rare}`);
}

function effectText(effect: any) {
  if (!effect || Number(effect.bufftype) === 99) return "无特殊效果";
  const name = effectNames.value.get(Number(effect.bufftype)) || `效果 ${effect.bufftype}`;
  return `${name} ${effect.value}`;
}

function areasForWeapon(weaponType: number | string) {
  return uniqueSorted((algorithmData.value?.wugongRows || [])
    .filter((row: any) => (
      Number(row.type) === Number(weaponType) &&
      !row.iszichuang &&
      row.attackareaname &&
      row.attackareaname !== "无"
    ))
    .map((row: any) => row.attackareaname))
    .map((name) => ({ id: String(name), label: String(name) }));
}

function effectMaxTargets() {
  const maxByType = new Map<number, number>();
  for (const row of algorithmData.value?.ziChuangBuffRows || []) {
    const type = Number(row.bufftype);
    const level = Number(row.value || 0);
    if (!Number.isFinite(type) || type === 99 || level <= 0) continue;
    maxByType.set(type, Math.max(maxByType.get(type) || 0, level));
  }
  return [...maxByType.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([id, maxLevel]) => ({
      id,
      maxLevel,
      label: effectNames.value.get(id) || `效果 ${id}`,
    }));
}

function waitForPaint() {
  return new Promise<void>((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }
    window.requestAnimationFrame(() => setTimeout(resolve, 0));
  });
}

async function runAnalysis() {
  if (!algorithmData.value || !currentRoute.value) return;

  analysisBusy.value = true;
  analysisStatus.value = "模拟中...";
  const trials = Math.max(1, Math.trunc(Number(analysisTrials.value) || 1));

  try {
    const simulation = new CustomMartialArtSimulation(currentInput.value, algorithmData.value);
    const styles: any[] = [];
    const areas: any[] = [];
    const effects: any[] = [];
    const powerSamples: number[] = [];

    const styleTargets = styleOptions.value.map((style) => ({ id: Number(style.id), label: style.label }));
    for (let index = 0; index < styleTargets.length; index += 1) {
      const style = styleTargets[index];
      analysisStatus.value = `模拟风格 ${index + 1} / ${styleTargets.length}`;
      const stats = await estimateCustomMartialArtStats(simulation, { styleId: style.id }, {
        trials,
        styleNames: styleNames.value,
        includeSamples: true,
        yieldEvery: 32,
        yieldToMain: waitForPaint,
      });
      powerSamples.push(...(stats.samples?.power || []));
      styles.push({ label: style.label, value: stats.styleProbability });
      await waitForPaint();
    }

    const areaTargets = areasForWeapon(input.weaponType);
    for (let index = 0; index < areaTargets.length; index += 1) {
      const area = areaTargets[index];
      analysisStatus.value = `模拟攻击范围 ${index + 1} / ${areaTargets.length}`;
      const stats = await estimateCustomMartialArtStats(simulation, { areaName: area.id }, {
        trials,
        styleNames: styleNames.value,
        yieldEvery: 32,
        yieldToMain: waitForPaint,
      });
      areas.push({ label: area.label, value: stats.areaProbability });
      await waitForPaint();
    }

    const effectTargets = effectMaxTargets();
    for (let index = 0; index < effectTargets.length; index += 1) {
      const effect = effectTargets[index];
      analysisStatus.value = `模拟效果 ${index + 1} / ${effectTargets.length}`;
      const stats = await estimateCustomMartialArtStats(simulation, {
        effectType: effect.id,
        minEffectValue: effect.maxLevel,
      }, {
        trials,
        styleNames: styleNames.value,
        includeSamples: true,
        yieldEvery: 32,
        yieldToMain: waitForPaint,
      });
      powerSamples.push(...(stats.samples?.power || []));
      effects.push({ label: `${effect.label} ${effect.maxLevel}`, value: stats.effectProbability });
      await waitForPaint();
    }

    analysis.value = {
      trials,
      styles: styles.sort((a, b) => b.value - a.value),
      areas: areas.sort((a, b) => b.value - a.value),
      effects: effects.sort((a, b) => b.value - a.value),
      finalValues: summarizeFinalValueDistributions(powerSamples, []),
    };
    analysisStatus.value = "";
  } catch (err: any) {
    analysisStatus.value = `模拟失败：${err?.message || err}`;
  } finally {
    analysisBusy.value = false;
  }
}

async function runSearch() {
  if (!algorithmData.value) return;

  searchBusy.value = true;
  searchStatus.value = "搜索中...";
  const trials = Math.max(1, Math.trunc(Number(searchTrials.value) || 1));

  try {
    searchResults.value = await searchCustomMartialArtInitials(searchTargetPayload.value, algorithmData.value, {
      styleNames: styleNames.value,
      trials,
      comboYieldEvery: 4,
      yieldToMain: waitForPaint,
      onProgress({ current, total }: { current: number; total: number }) {
        searchStatus.value = `搜索中...${current} / ${total}`;
      },
    });
    searchPage.value = 1;
    searchStatus.value = "";
  } catch (err: any) {
    searchStatus.value = `搜索失败：${err?.message || err}`;
  } finally {
    searchBusy.value = false;
  }
}

function resultAttributes(route: any) {
  return ATTRIBUTE_NAMES.map((name) => route.input?.[name]).join(" / ");
}

function resultStats(route: any) {
  return route.stats || {};
}

function sortSearchResults(results: any[], primary: string) {
  return [...results].sort((a, b) => {
    const statsA = resultStats(a);
    const statsB = resultStats(b);
    const comparisons: Record<string, number> = {
      styleMatch: Number(statsB.styleProbability || 0) - Number(statsA.styleProbability || 0),
      effectLevel: Number(statsB.effectProbability || 0) - Number(statsA.effectProbability || 0),
      averagePower: Number(statsB.averagePower || 0) - Number(statsA.averagePower || 0),
      maxPower: Number(statsB.maxPower || 0) - Number(statsA.maxPower || 0),
    };
    return comparisons[primary] || comparisons.averagePower || Number(a.seed || 0) - Number(b.seed || 0);
  });
}

function cycleSearchSort() {
  const index = SEARCH_SORT_FIELDS.findIndex((field) => field.id === searchSort.value);
  searchSort.value = SEARCH_SORT_FIELDS[(index + 1) % SEARCH_SORT_FIELDS.length]?.id || "averagePower";
  searchPage.value = 1;
}

function sortLabel() {
  return SEARCH_SORT_FIELDS.find((field) => field.id === searchSort.value)?.label || "威力均值";
}
</script>

<template>
  <main class="container mx-auto grid items-start gap-6 p-6 xl:grid-cols-[minmax(0,1fr)_420px]">
    <section class="grid min-w-0 content-start gap-6">
      <Card>
        <CardHeader>
          <CardTitle>自创武学模拟</CardTitle>
          <CardDescription>
            输入初始四维和武器类型，查看种子、初始结果和贪心锁定后的概率分布。
          </CardDescription>
        </CardHeader>
        <CardContent v-if="pending" class="text-sm text-muted-foreground">读取 sqlite 数据中...</CardContent>
        <CardContent v-else-if="error" class="text-sm text-destructive">{{ error.message }}</CardContent>
        <CardContent v-else class="grid gap-4">
          <div class="grid gap-3 sm:grid-cols-5">
            <div class="grid gap-2">
              <Label class="text-muted-foreground" for="custom-yi">意念</Label>
              <Input id="custom-yi" v-model="input.yi" type="number" min="0" max="10" />
            </div>
            <div class="grid gap-2">
              <Label class="text-muted-foreground" for="custom-qi">气劲</Label>
              <Input id="custom-qi" v-model="input.qi" type="number" min="0" max="10" />
            </div>
            <div class="grid gap-2">
              <Label class="text-muted-foreground" for="custom-xing">形态</Label>
              <Input id="custom-xing" v-model="input.xing" type="number" min="0" max="10" />
            </div>
            <div class="grid gap-2">
              <Label class="text-muted-foreground" for="custom-shen">神韵</Label>
              <Input id="custom-shen" v-model="input.shen" type="number" min="0" max="10" />
            </div>
            <div class="grid gap-2">
              <Label class="text-muted-foreground" for="custom-weapon">武器</Label>
              <Select v-model="input.weaponType">
                <SelectTrigger id="custom-weapon" class="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="option in weaponOptions" :key="option.id" :value="option.id">
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <Badge :variant="attributesValid ? 'outline' : 'destructive'">
              四维 {{ attributeTotal }} / {{ ATTRIBUTE_TOTAL }}
            </Badge>
            <Badge v-if="currentSeed !== null" variant="outline">seed {{ currentSeed }}</Badge>
            <Badge v-if="currentRoute" variant="outline">改良空间 {{ currentRoute.initialImproveLimit }}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>当前结果</CardTitle>
          <CardDescription>
            初始生成时的风格、范围、效果、威力和真气。
          </CardDescription>
        </CardHeader>
        <CardContent v-if="!attributesValid" class="text-sm text-muted-foreground">
          四维总和必须为 {{ ATTRIBUTE_TOTAL }} 后才能自创。
        </CardContent>
        <CardContent v-else-if="!currentSummary" class="text-sm text-muted-foreground">
          暂无结果。
        </CardContent>
        <CardContent v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div class="flex justify-between gap-3 rounded-md border px-3 py-2">
            <span class="text-muted-foreground">品阶</span>
            <span>{{ rareLabel(currentSummary.rare) }}</span>
          </div>
          <div class="flex justify-between gap-3 rounded-md border px-3 py-2">
            <span class="text-muted-foreground">风格</span>
            <span>{{ currentSummary.style.name }}</span>
          </div>
          <div class="flex justify-between gap-3 rounded-md border px-3 py-2">
            <span class="text-muted-foreground">攻击范围</span>
            <span>{{ currentSummary.area.name }}</span>
          </div>
          <div class="flex justify-between gap-3 rounded-md border px-3 py-2">
            <span class="text-muted-foreground">特殊效果</span>
            <span>{{ effectText(currentSummary.effect) }}</span>
          </div>
          <div class="flex justify-between gap-3 rounded-md border px-3 py-2">
            <span class="text-muted-foreground">招式威力</span>
            <span>{{ formatNumber(currentSummary.power) }}</span>
          </div>
          <div class="flex justify-between gap-3 rounded-md border px-3 py-2">
            <span class="text-muted-foreground">消耗真气</span>
            <span>{{ currentSummary.cost }}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>概率分布</CardTitle>
            <CardDescription>
              分别估算锁定每个目标后的命中概率。
              <span v-if="analysisStatus" class="text-foreground">{{ analysisStatus }}</span>
            </CardDescription>
          </div>
          <Button :disabled="!currentRoute || analysisBusy" @click="runAnalysis">
            {{ analysisBusy ? "模拟中" : "模拟" }}
          </Button>
        </CardHeader>
        <CardContent class="grid gap-4">
          <div class="grid max-w-xs gap-2">
            <Label class="text-muted-foreground" for="analysis-trials">每项目模拟次数</Label>
            <Input id="analysis-trials" v-model="analysisTrials" type="number" min="1" max="10000" step="32" />
          </div>

          <div v-if="!analysis" class="py-8 text-center text-sm text-muted-foreground">
            点击模拟查看当前初始输入的分布。
          </div>
          <div v-else class="grid gap-5">
            <div class="grid gap-2">
              <div class="text-sm text-muted-foreground">风格命中概率</div>
              <div class="grid gap-2">
                <div v-for="row in analysis.styles.slice(0, 8)" :key="row.label" class="grid grid-cols-[80px_minmax(0,1fr)_56px] items-center gap-3 text-sm">
                  <span class="truncate">{{ row.label }}</span>
                  <div class="h-2 rounded-full bg-muted">
                    <div class="h-2 rounded-full bg-primary" :style="{ width: `${Math.max(2, row.value * 100)}%` }" />
                  </div>
                  <span class="text-right tabular-nums">{{ formatPercent(row.value) }}</span>
                </div>
              </div>
            </div>

            <div class="grid gap-2">
              <div class="text-sm text-muted-foreground">攻击范围命中概率</div>
              <div class="flex flex-wrap gap-2">
                <Badge v-for="row in analysis.areas.slice(0, 12)" :key="row.label" variant="outline">
                  {{ row.label }} {{ formatPercent(row.value) }}
                </Badge>
              </div>
            </div>

            <div class="grid gap-2">
              <div class="text-sm text-muted-foreground">最高等级特殊效果命中概率</div>
              <div class="flex flex-wrap gap-2">
                <Badge v-for="row in analysis.effects.slice(0, 12)" :key="row.label" variant="outline">
                  {{ row.label }} {{ formatPercent(row.value) }}
                </Badge>
              </div>
            </div>

            <div class="grid gap-2">
              <div class="text-sm text-muted-foreground">最终威力</div>
              <div class="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                <Badge variant="outline">最小 {{ formatNumber(analysis.finalValues.powerSummary.min) }}</Badge>
                <Badge variant="outline">Q1 {{ formatNumber(analysis.finalValues.powerSummary.q1) }}</Badge>
                <Badge variant="outline">中位 {{ formatNumber(analysis.finalValues.powerSummary.median) }}</Badge>
                <Badge variant="outline">Q3 {{ formatNumber(analysis.finalValues.powerSummary.q3) }}</Badge>
                <Badge variant="outline">最大 {{ formatNumber(analysis.finalValues.powerSummary.max) }}</Badge>
                <Badge variant="outline">均值 {{ formatNumber(analysis.finalValues.powerSummary.mean) }}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>

    <aside class="grid min-w-0 content-start gap-6">
      <Card>
        <CardHeader>
          <CardTitle>初始搜索</CardTitle>
          <CardDescription>
            选择目标词条后，枚举四维组合并估算贪心锁定命中概率。
            <span v-if="searchStatus" class="text-foreground">{{ searchStatus }}</span>
          </CardDescription>
        </CardHeader>
        <CardContent class="grid gap-4">
          <div class="grid gap-2">
            <Label class="text-muted-foreground" for="search-weapon">武器</Label>
            <Select v-model="searchTarget.weaponType">
              <SelectTrigger id="search-weapon" class="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="option in weaponOptions" :key="option.id" :value="option.id">
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="grid gap-2">
            <Label class="text-muted-foreground" for="search-style">目标风格</Label>
            <Select v-model="searchTarget.styleId">
              <SelectTrigger id="search-style" class="w-full">
                <SelectValue placeholder="不指定" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem :value="EMPTY_OPTION">不指定</SelectItem>
                <SelectItem v-for="option in styleOptions" :key="option.id" :value="option.id">
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="grid gap-2">
            <Label class="text-muted-foreground" for="search-area">攻击范围</Label>
            <Select v-model="searchTarget.areaName">
              <SelectTrigger id="search-area" class="w-full">
                <SelectValue placeholder="不指定" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem :value="EMPTY_OPTION">不指定</SelectItem>
                <SelectItem v-for="option in areaOptions" :key="option.id" :value="option.id">
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="grid gap-2">
            <Label class="text-muted-foreground" for="search-effect">特殊效果</Label>
            <Select v-model="searchTarget.effectType">
              <SelectTrigger id="search-effect" class="w-full">
                <SelectValue placeholder="不指定" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem :value="EMPTY_OPTION">不指定</SelectItem>
                <SelectItem v-for="option in effectOptions" :key="option.id" :value="option.id">
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="grid gap-2">
            <Label class="text-muted-foreground" for="search-effect-level">效果等级</Label>
            <Input
              id="search-effect-level"
              v-model="searchTarget.effectLevel"
              type="number"
              min="1"
              :max="selectedEffectMaxLevel || undefined"
              :disabled="selectedEffectMaxLevel <= 0"
            />
          </div>

          <div class="grid gap-2">
            <Label class="text-muted-foreground" for="search-trials">每组合模拟次数</Label>
            <Input id="search-trials" v-model="searchTrials" type="number" min="1" max="10000" step="16" />
          </div>

          <Button :disabled="pending || searchBusy" @click="runSearch">
            {{ searchBusy ? "搜索中" : "搜索" }}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>搜索结果</CardTitle>
            <CardDescription>
              {{ searchResults.length ? `共 ${searchResults.length} 个组合，第 ${searchPage} / ${searchPageCount} 页` : "还没有搜索结果。" }}
            </CardDescription>
          </div>
          <Button v-if="searchResults.length" variant="outline" size="sm" @click="cycleSearchSort">
            排序：{{ sortLabel() }}
          </Button>
        </CardHeader>
        <CardContent>
          <div v-if="!searchResults.length" class="py-10 text-center text-sm text-muted-foreground">
            选择目标后点击搜索。
          </div>
          <div v-else class="grid gap-3">
            <Card v-for="route in visibleSearchResults" :key="`${route.seed}-${resultAttributes(route)}`">
              <CardHeader>
                <CardTitle class="text-base">四维 {{ resultAttributes(route) }}</CardTitle>
                <CardDescription>seed {{ route.seed }}，模拟 {{ resultStats(route).trials || 0 }} 次</CardDescription>
              </CardHeader>
              <CardContent class="grid gap-3">
                <div class="flex flex-wrap gap-2">
                  <Badge variant="secondary">风格 {{ route.initial.style.name }}</Badge>
                  <Badge variant="secondary">范围 {{ route.initial.area.name }}</Badge>
                  <Badge variant="secondary">{{ effectText(route.initial.effect) }}</Badge>
                  <Badge variant="secondary">改良 {{ route.initial.gailiangkongjian }}</Badge>
                </div>
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
              </CardContent>
            </Card>

            <div class="flex justify-end gap-2">
              <Button variant="outline" size="sm" :disabled="searchPage <= 1" @click="searchPage -= 1">上一页</Button>
              <Button variant="outline" size="sm" :disabled="searchPage >= searchPageCount" @click="searchPage += 1">下一页</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </aside>
  </main>
</template>
