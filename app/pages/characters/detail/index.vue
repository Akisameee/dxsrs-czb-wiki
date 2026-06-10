<script setup lang="ts">
import { FlaskConical, Hammer, Leaf, Pickaxe, Scissors, Swords } from "@lucide/vue";
import { enumLabel } from "~/lib/utils";
import { rarityCardClass } from "~/lib/rarity";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
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

useHead({ title: "人物详情" });

const route = useRoute();
const { loadCharacterDetail } = useCharacterData();

const characterId = computed(() => Number(route.query.id));

const { data, pending, error } = await useAsyncData(
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
    { key: "strength", label: "膂力", value: item.strength, textClass: "text-rose-600" },
    { key: "physique", label: "体魄", value: item.physique, textClass: "text-emerald-600" },
    { key: "agility", label: "身法", value: item.agility, textClass: "text-lime-600" },
    { key: "constitution", label: "根骨", value: item.constitution, textClass: "text-blue-600" },
  ];
});

const radarMax = computed(() => Math.max(1000, ...attributeStats.value.map((item) => item.value)));

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
    { label: "挖矿", value: item.mining, icon: Pickaxe },
    { label: "采药", value: item.herb_gathering, icon: Leaf },
    { label: "打猎", value: item.hunting, icon: Swords },
    { label: "锻造", value: item.forging, icon: Hammer },
    { label: "炼丹", value: item.alchemy, icon: FlaskConical },
    { label: "裁缝", value: item.sewing, icon: Scissors },
  ];
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
  return enumLabel(enums.value, "Character", item.id, `人物 ${item.id}`);
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

function skillIconClass(value: number, index: number) {
  const active = index < Number(value || 0);
  return active ? "text-primary" : "text-muted-foreground/25";
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
        borderWidth: 2,
        pointBackgroundColor: themeColor("--primary", "#0f172a"),
        pointRadius: 3,
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
            font: { size: 13, weight: "600" },
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
  <main class="container mx-auto grid gap-6 p-6">
    <Card v-if="error">
      <CardContent class="text-destructive">{{ error.message }}</CardContent>
    </Card>

    <Card v-else-if="pending">
      <CardHeader>
        <CardTitle>人物详情</CardTitle>
        <CardDescription>读取中...</CardDescription>
      </CardHeader>
    </Card>

    <Card v-else-if="!character">
      <CardHeader>
        <CardTitle>人物详情</CardTitle>
        <CardDescription>没有找到 id: {{ route.query.id || "-" }}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button as-child variant="outline">
          <NuxtLink to="/characters/">返回人物</NuxtLink>
        </Button>
      </CardFooter>
    </Card>

    <template v-else>
      <Card :class="rarityCardClass(character.rarity_id)">
        <CardHeader>
          <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div class="grid gap-2">
              <div>
                <CardTitle class="text-2xl">{{ characterName(character) }}</CardTitle>
                <CardDescription>{{ locationText(character) }}</CardDescription>
              </div>
            </div>

            <Button as-child variant="outline">
              <NuxtLink to="/characters/">返回人物</NuxtLink>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div class="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>基础信息</CardTitle>
          </CardHeader>
          <CardContent class="grid gap-4">
            <div class="text-sm text-muted-foreground">头像</div>
            <div class="flex items-center justify-center rounded-md border border-dashed py-6">
              <Avatar class="size-20 text-2xl">
                <AvatarFallback>{{ characterInitial(character) }}</AvatarFallback>
              </Avatar>
            </div>
            <div class="grid gap-3 text-sm sm:grid-cols-2">
              <div class="flex justify-between gap-3">
                <span class="text-muted-foreground">门派</span>
                <span>{{ label("LianSuo_MP", character.sect_id, "无门派") }}</span>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>四维数值</CardTitle>
          </CardHeader>
          <CardContent class="grid min-w-0 gap-6 overflow-hidden">
            <div class="relative h-80 w-full min-w-0 overflow-hidden">
              <canvas ref="radarCanvas" class="h-full w-full" aria-label="四维雷达图" />
            </div>
            <div class="grid gap-3 sm:grid-cols-2">
              <div
                v-for="item in attributeStats"
                :key="item.key"
                class="flex justify-between gap-3 rounded-md border px-3 py-2"
              >
                <span :class="item.textClass">{{ item.label }}</span>
                <span class="tabular-nums">{{ formatNumber(item.value) }}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>武器修为</CardTitle>
            <CardDescription>武学修为 {{ formatNumber(character.cultivation) }}</CardDescription>
          </CardHeader>
          <CardContent class="grid gap-3 sm:grid-cols-2">
            <div
              v-for="item in weaponCultivations"
              :key="item.label"
              class="flex items-center justify-between rounded-md border px-3 py-2"
            >
              <span>{{ item.label }}</span>
              <span class="tabular-nums">{{ formatNumber(item.value) }}/100</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>生活技艺</CardTitle>
            <CardDescription>临时图案，后续替换为解包图片</CardDescription>
          </CardHeader>
          <CardContent class="grid gap-3 sm:grid-cols-2">
            <div
              v-for="skill in lifeSkills"
              :key="skill.label"
              class="flex items-center justify-between rounded-md border px-3 py-2"
            >
              <span>{{ skill.label }}</span>
              <span class="flex gap-1">
                <component
                  :is="skill.icon"
                  v-for="index in 5"
                  :key="index"
                  class="size-5"
                  :class="skillIconClass(skill.value, index - 1)"
                />
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>心愿任务</CardTitle>
        </CardHeader>
        <CardContent class="grid gap-3">
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
        </CardContent>
      </Card>
    </template>
  </main>
</template>
