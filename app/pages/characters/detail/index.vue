<script setup lang="ts">
import { enumLabel } from "~/lib/utils";
import { rarityCardClass } from "~/lib/rarity";
import CharacterPortrait from "~/components/wiki/character/CharacterPortrait.vue";
import LifeSkillRankImages from "~/components/wiki/character/LifeSkillRankImages.vue";
import SectHoverLink from "~/components/wiki/sect/HoverLink.vue";
import WikiText from "~/components/wiki/WikiText.vue";
import {
  formatQuestParts,
  type CharacterQuestRow,
  type CharacterQuestTargetRow,
} from "~/lib/wiki/character";
import {
  useCharacterData,
  type CharacterDetailRow,
} from "~/composables/useCharacterData";
import type { LifeSkillType } from "~/lib/wiki/life-skills";

useHead({ title: "人物详情" });

const route = useRoute();
const { loadCharacterDetail } = useCharacterData();

const characterId = computed(() => Number(route.query.id));

const { data, pending, error } = useLazyAsyncData(
  () => `characters-detail-${route.query.id || "empty"}`,
  async () => {
    const id = Number(route.query.id);
    if (!Number.isFinite(id)) {
      return { character: null, quests: [], questTargets: [], enums: {} };
    }

    return loadCharacterDetail(id);
  },
  { server: false, watch: [characterId] },
);

const character = computed(() => data.value?.character || null);
const enums = computed(() => data.value?.enums || {});
const radarCanvas = ref<HTMLCanvasElement | null>(null);
let radarChart: any = null;

const targetsByQuest = computed(() => {
  const groups = new Map<number, CharacterQuestTargetRow[]>();
  for (const target of data.value?.questTargets || []) {
    const targets = groups.get(target.quest_id) || [];
    targets.push(target);
    groups.set(target.quest_id, targets);
  }
  return groups;
});

const attributeStats = computed(() => {
  const item = character.value;
  if (!item) return [];
  return [
    { key: "strength", label: "膂力", value: item.strength },
    { key: "physique", label: "体魄", value: item.physique },
    { key: "agility", label: "身法", value: item.agility },
    { key: "constitution", label: "根骨", value: item.constitution },
  ];
});

const radarMax = computed(() => Math.max(1000, ...attributeStats.value.map((item) => Number(item.value) || 0)));

const weaponCultivations = computed(() => {
  const item = character.value;
  if (!item) return [];
  return [
    { label: "拳掌", value: item.fist },
    { label: "刀剑", value: item.blade_sword },
    { label: "枪棒", value: item.spear_staff },
    { label: "暗器", value: item.hidden_weapon },
    { label: "内功", value: item.internal },
  ];
});

const lifeSkills = computed(() => {
  const item = character.value;
  if (!item) return [];
  return [
    { label: "挖矿", type: "mining", value: item.mining },
    { label: "采药", type: "herbGathering", value: item.herb_gathering },
    { label: "打猎", type: "hunting", value: item.hunting },
    { label: "锻造", type: "forging", value: item.forging },
    { label: "炼丹", type: "alchemy", value: item.alchemy },
    { label: "裁缝", type: "sewing", value: item.sewing },
  ] satisfies Array<{ label: string; type: LifeSkillType; value: number | null | undefined }>;
});

const favoriteItems = computed(() => {
  const item = character.value;
  if (!item) return [];
  return [
    { label: "茶", value: item.likes_tea },
    { label: "酒", value: item.likes_wine },
    { label: "琴", value: item.likes_music },
    { label: "棋", value: item.likes_chess },
    { label: "书", value: item.likes_book },
    { label: "画", value: item.likes_painting },
  ].filter((entry) => entry.value);
});

function characterName(item: CharacterDetailRow) {
  return item.name || `人物 ${item.id}`;
}

function characterInitial(item: CharacterDetailRow) {
  return characterName(item).slice(0, 1);
}

function locationText(item: CharacterDetailRow) {
  if (item.region_id === null || item.location_id === null) return "无地点";
  return `${enumLabel(enums.value, "DiDian", item.region_id)} / ${enumLabel(enums.value, "Area", item.location_id)}`;
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  return String(Math.round(Number(value)));
}

function label(type: string, id: number | string | null | undefined, fallback = "未知") {
  return enumLabel(enums.value, type, id, fallback);
}

function questTargets(quest: CharacterQuestRow) {
  return targetsByQuest.value.get(quest.id) || [];
}

function questSummaryParts(quest: CharacterQuestRow) {
  return formatQuestParts(quest, questTargets(quest), enums.value);
}

function themeColor(name: string, fallback: string) {
  if (!import.meta.client) return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

async function renderRadarChart() {
  if (!import.meta.client || !radarCanvas.value || !attributeStats.value.length) return;
  const {
    Chart,
    Filler,
    Legend,
    LineElement,
    PointElement,
    RadarController,
    RadialLinearScale,
    Tooltip,
  } = await import("chart.js");

  Chart.register(Filler, Legend, LineElement, PointElement, RadarController, RadialLinearScale, Tooltip);
  radarChart?.destroy();
  radarChart = new Chart(radarCanvas.value, {
    type: "radar",
    data: {
      labels: attributeStats.value.map((item) => item.label),
      datasets: [{
        data: attributeStats.value.map((item) => Math.round(item.value)),
        backgroundColor: "rgba(20, 184, 166, 0.22)",
        borderColor: themeColor("--primary", "#0f172a"),
        borderWidth: 0.5,
        pointBackgroundColor: themeColor("--primary", "#0f172a"),
        pointRadius: 2,
      }],
    },
    options: {
      animation: false,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true },
      },
      scales: {
        r: {
          beginAtZero: true,
          max: radarMax.value,
          ticks: { display: false, stepSize: Math.max(1, Math.ceil(radarMax.value / 4)) },
          grid: { color: themeColor("--border", "#e5e7eb") },
          angleLines: { color: themeColor("--border", "#e5e7eb") },
          pointLabels: {
            color: themeColor("--foreground", "#111827"),
            font: { size: 13, weight: 400 },
          },
        },
      },
    },
  });
}

watch([attributeStats, radarMax], () => {
  void nextTick(renderRadarChart);
}, { deep: true });

onMounted(() => {
  void nextTick(renderRadarChart);
});

onBeforeUnmount(() => {
  radarChart?.destroy();
});
</script>

<template>
  <AppPageContainer>
    <AppCard v-if="error">
      <AppCardContent class="text-destructive">{{ error.message }}</AppCardContent>
    </AppCard>

    <AppCard v-else-if="pending">
      <AppCardHeader>
        <CardTitle>人物详情</CardTitle>
        <CardDescription>读取中...</CardDescription>
      </AppCardHeader>
    </AppCard>

    <AppCard v-else-if="!character">
      <AppCardHeader>
        <CardTitle>人物详情</CardTitle>
        <CardDescription>没有找到 id: {{ route.query.id || "-" }}</CardDescription>
      </AppCardHeader>
    </AppCard>

    <template v-else>
      <AppCard :class="rarityCardClass(character.rarity_id)">
        <AppCardHeader>
          <div class="grid gap-2">
            <div>
              <CardTitle class="text-2xl">{{ characterName(character) }}</CardTitle>
              <CardDescription>{{ locationText(character) }}</CardDescription>
            </div>
          </div>
        </AppCardHeader>
      </AppCard>

      <div class="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(320px,2fr)]">
        <AppCard>
          <AppCardHeader>
            <CardTitle>基础信息</CardTitle>
          </AppCardHeader>
          <AppCardContent class="grid items-start gap-6 text-sm md:grid-cols-[auto_1fr]">
            <div class="flex justify-center rounded-md">
              <CharacterPortrait
                :ids="{ characterId: character.id, portrait: character.portrait }"
                :fallback="characterInitial(character)"
                :size="180"
              />
            </div>
            <div class="grid auto-rows-min content-start gap-3 text-sm grid-cols-2">
              <div class="flex justify-between gap-3">
                <span class="text-muted-foreground">门派</span>
                <SectHoverLink
                  mode="link"
                  :id="character.sect_id"
                  :label="character.sect_name || '无门派'"
                />
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-muted-foreground">地位</span>
                <span>{{ label("DiWei", character.position_id, "地位") }}</span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-muted-foreground">资质</span>
                <span>{{ label("NPC_Rare", character.rarity_id, "资质") }}</span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-muted-foreground">资历</span>
                <span>{{ label("Dengji", character.rank_id, "资历") }}</span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-muted-foreground">名声</span>
                <span>{{ formatNumber(character.fame) }}</span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-muted-foreground">侠义</span>
                <span>{{ formatNumber(character.chivalry) }}</span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-muted-foreground">银两</span>
                <span>{{ formatNumber(character.gold) }}</span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-muted-foreground">等级</span>
                <span>{{ formatNumber(character.level) }}</span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-muted-foreground">武器类型</span>
                <span>{{ label("BingQiType", character.weapon_type_id) }}</span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-muted-foreground">武器</span>
                <span>{{ character.equipment_weapon || "-" }}</span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-muted-foreground">防具</span>
                <span>{{ character.equipment_armor || "-" }}</span>
              </div>
              <div v-if="favoriteItems.length" class="flex flex-wrap items-center justify-between gap-2">
                <span class="text-muted-foreground">偏好</span>
                <div class="flex flex-wrap justify-end gap-2">
                  <Badge
                    v-for="item in favoriteItems"
                    :key="item.label"
                    variant="secondary"
                  >
                    {{ item.label }}
                  </Badge>
                </div>
              </div>
            </div>
          </AppCardContent>
        </AppCard>

        <AppCard>
          <AppCardHeader>
            <CardTitle>四维数值</CardTitle>
          </AppCardHeader>
          <AppCardContent class="grid min-w-0 gap-6 overflow-hidden text-sm md:grid-cols-[minmax(9rem,12rem)_minmax(0,1fr)]">
            <div class="grid auto-rows-min content-start gap-3 grid-cols-2 md:grid-cols-1">
              <div
                v-for="item in attributeStats"
                :key="item.key"
                class="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <span>{{ item.label }}</span>
                <span class="tabular-nums">{{ formatNumber(item.value) }}/1000</span>
              </div>
            </div>
            <div class="relative h-47 w-full min-w-0 overflow-hidden">
              <canvas ref="radarCanvas" class="block h-full w-full" aria-label="四维雷达图" />
            </div>
          </AppCardContent>
        </AppCard>
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <AppCard>
          <AppCardHeader>
            <CardTitle>武器修为</CardTitle>
            <CardDescription>武学修为 {{ formatNumber(character.cultivation) }}</CardDescription>
          </AppCardHeader>
          <AppCardContent class="grid gap-3 grid-cols-2">
            <div
              v-for="item in weaponCultivations"
              :key="item.label"
              class="flex items-center justify-between rounded-md border px-3 py-2"
            >
              <span>{{ item.label }}</span>
              <span class="tabular-nums">{{ formatNumber(item.value) }}/100</span>
            </div>
          </AppCardContent>
        </AppCard>

        <AppCard>
          <AppCardHeader>
            <CardTitle>生活技艺</CardTitle>
          </AppCardHeader>
          <AppCardContent class="grid gap-3 grid-cols-2">
            <div
              v-for="skill in lifeSkills"
              :key="skill.label"
              class="flex items-center justify-between rounded-md border px-3 py-2"
            >
              <span>{{ skill.label }}</span>
              <LifeSkillRankImages
                :type="skill.type"
                :value="skill.value"
                :label="skill.label"
              />
            </div>
          </AppCardContent>
        </AppCard>
      </div>

      <AppCard>
        <AppCardHeader>
          <CardTitle>心愿任务</CardTitle>
        </AppCardHeader>
        <AppCardContent class="grid gap-3">
          <div
            v-for="quest in data?.quests || []"
            :key="quest.id"
            class="flex flex-col gap-1 rounded-md border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <span>
              阶段 {{ quest.stage }}：
              <WikiText :parts="questSummaryParts(quest)" />
            </span>
            <span class="text-sm text-muted-foreground">亲密度 {{ quest.required_affinity }}</span>
          </div>
          <div v-if="!(data?.quests || []).length" class="text-sm text-muted-foreground">
            无心愿任务
          </div>
        </AppCardContent>
      </AppCard>
    </template>
  </AppPageContainer>
</template>
