<script setup lang="ts">
import {
  CustomMartialArtSimulation,
  estimateCustomMartialArtStats,
  makeZiChuangSeed,
  searchCustomMartialArtInitials,
  summarizeFinalValueDistributions,
} from "~/lib/custom-martial-art";
import InitialInputCard from "~/components/tools/custom-martial-art/InitialInputCard.vue";
import InitialResultCard from "~/components/tools/custom-martial-art/InitialResultCard.vue";
import SearchControlsCard from "~/components/tools/custom-martial-art/SearchControlsCard.vue";
import SearchResultsCard from "~/components/tools/custom-martial-art/SearchResultsCard.vue";
import SimulationStatsCard from "~/components/tools/custom-martial-art/SimulationStatsCard.vue";
import { martialArtRarityToneId } from "~/lib/wiki/martial-art";

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
const DEFAULT_SEARCH_SORT_ORDER = SEARCH_SORT_FIELDS.map((field) => field.id);

const { data: context, pending, error } = useCustomMartialArtData();

const input = reactive({
  name: "自创武功",
  yi: "5",
  qi: "5",
  xing: "5",
  shen: "5",
  weaponType: "2",
});

const analysisTrials = ref("1024");
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
const searchTrials = ref("256");
const searchStatus = ref("");
const searchBusy = ref(false);
const searchResults = ref<any[]>([]);
const searchPage = ref(1);
const searchSort = ref("styleMatch");

const enums = computed(() => context.value?.enums || {});
const algorithmData = computed(() => context.value?.data || null);
const effectNames = computed(() => context.value?.effectNames || new Map<number, string>());
const styleNames = computed(() => context.value?.styleNames || {});
const errorMessage = computed(() => error.value?.message || "");

const weaponOptions = computed(() => WEAPON_TYPE_IDS.map((id) => ({
  id: String(id),
  label: enumName("BingQiType", id, ""),
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
const currentRareLabel = computed(() => currentSummary.value ? rareLabel(currentSummary.value.rare) : "");
const currentRarityId = computed(() => currentSummary.value ? martialArtRarityToneId(currentSummary.value.rare) : null);
const currentEffectLabel = computed(() => currentSummary.value ? effectText(currentSummary.value.effect) : "");

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
const searchSortLabel = computed(() => (
  SEARCH_SORT_FIELDS.find((field) => field.id === searchSort.value)?.label || "威力均值"
));

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
    const sortOrder = [
      primary,
      ...DEFAULT_SEARCH_SORT_ORDER.filter((key) => key !== primary),
    ];
    for (const key of sortOrder) {
      const comparison = comparisons[key] || 0;
      if (comparison !== 0) return comparison;
    }
    return Number(a.seed || 0) - Number(b.seed || 0);
  });
}

function cycleSearchSort() {
  const index = SEARCH_SORT_FIELDS.findIndex((field) => field.id === searchSort.value);
  searchSort.value = SEARCH_SORT_FIELDS[(index + 1) % SEARCH_SORT_FIELDS.length]?.id || "averagePower";
  searchPage.value = 1;
}

function updateInput(patch: Record<string, string>) {
  Object.assign(input, patch);
}

function updateSearchTarget(patch: Record<string, string>) {
  Object.assign(searchTarget, patch);
}

function updateSearchPage(page: number) {
  searchPage.value = Math.max(1, Math.min(page, searchPageCount.value));
}

async function applySearchResult(route: any) {
  const source = route?.input || {};
  updateInput({
    yi: String(numberValue(source.yi)),
    qi: String(numberValue(source.qi)),
    xing: String(numberValue(source.xing)),
    shen: String(numberValue(source.shen)),
    weaponType: String(numberValue(source.weaponType, numberValue(searchTarget.weaponType))),
  });
  await nextTick();
  await runAnalysis();
}
</script>

<template>
  <main class="container mx-auto grid items-start gap-6 p-6 xl:grid-cols-[minmax(0,1fr)_380px]">
    <section class="grid min-w-0 content-start gap-6">
      <SearchControlsCard
        :target="searchTarget"
        :weapon-options="weaponOptions"
        :style-options="styleOptions"
        :area-options="areaOptions"
        :effect-options="effectOptions"
        :empty-option="EMPTY_OPTION"
        :effect-max-level="selectedEffectMaxLevel"
        :trials="searchTrials"
        :status="searchStatus"
        :pending="pending"
        :busy="searchBusy"
        @update-target="updateSearchTarget"
        @update-trials="searchTrials = $event"
        @search="runSearch"
      />

      <SearchResultsCard
        :results="sortedSearchResults"
        :page="searchPage"
        :page-size="SEARCH_PAGE_SIZE"
        :sort-label="searchSortLabel"
        :effect-text="effectText"
        :weapon-type-text="(value) => enumName('BingQiType', value, '')"
        @sort="cycleSearchSort"
        @update-page="updateSearchPage"
        @apply="applySearchResult"
      />
    </section>

    <aside class="grid min-w-0 content-start gap-6">
      <InitialInputCard
        :input="input"
        :weapon-options="weaponOptions"
        :attribute-total="attributeTotal"
        :attribute-target="ATTRIBUTE_TOTAL"
        :attributes-valid="attributesValid"
        :trials="analysisTrials"
        :status="analysisStatus"
        :busy="analysisBusy"
        :can-run="Boolean(currentRoute)"
        :pending="pending"
        :error-message="errorMessage"
        @update-input="updateInput"
        @update-trials="analysisTrials = $event"
        @run="runAnalysis"
      />

      <InitialResultCard
        :current-seed="currentSeed"
        :attributes-valid="attributesValid"
        :attribute-target="ATTRIBUTE_TOTAL"
        :summary="currentSummary"
        :improve-limit="currentRoute?.initialImproveLimit ?? null"
        :rarity-id="currentRarityId"
        :rare-label="currentRareLabel"
        :effect-label="currentEffectLabel"
      />

      <SimulationStatsCard
        :analysis="analysis"
      />
    </aside>
  </main>
</template>
