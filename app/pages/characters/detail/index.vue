<script setup lang="ts">
import { FlaskConical, Hammer, Leaf, Pickaxe, Scissors, Swords } from "@lucide/vue";
import { enumLabel, enumMapFromRows } from "~/lib/utils";
import { rarityBadgeClass, rarityCardClass } from "~/lib/rarity";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";

useHead({ title: "人物详情" });

type Character = {
  id: number;
  portrait: string | null;
  region_id: number | null;
  location_id: number | null;
  sect_id: number;
  sex_id: number;
  rarity_id: number;
  rank_id: number;
  position_id: number;
  level: number;
  favorite_rarity_id: number;
  fame: number;
  chivalry: number;
  gold: number;
  is_instructor: number;
  is_manager: number;
  weapon_type_id: number;
  growth_type_id: number;
  equipment_weapon: string | null;
  equipment_armor: string | null;
  equipment_other_weapon: string | null;
  strength: number;
  constitution: number;
  physique: number;
  agility: number;
  cultivation: number;
  fist: number;
  blade_sword: number;
  spear_staff: number;
  hidden_weapon: number;
  internal: number;
  mining: number;
  herb_gathering: number;
  hunting: number;
  forging: number;
  alchemy: number;
  sewing: number;
  likes_tea: number;
  likes_wine: number;
  likes_music: number;
  likes_chess: number;
  likes_book: number;
  likes_painting: number;
  word: string | null;
};

type CharacterQuest = {
  id: number;
  character_id: number;
  stage: number;
  required_affinity: number;
  quest_type_id: number;
  reward_item_id: number | null;
};

type CharacterQuestTarget = {
  quest_id: number;
  slot: number;
  target_role: string;
  target_kind: string;
  target_id: number | null;
  target_region_id: number | null;
};

const route = useRoute();
const { queryRows } = useWikiDb();

const characterId = computed(() => Number(route.query.id));

const { data, pending, error } = await useAsyncData(
  () => `characters-detail-${route.query.id || "empty"}`,
  async () => {
    const id = Number(route.query.id);
    if (!Number.isFinite(id)) {
      return { character: null, quests: [], questTargets: [], enums: {} };
    }

    const [characters, quests, questTargets, enumRows] = await Promise.all([
      queryRows<Character>("SELECT * FROM characters WHERE id = ?", [id]),
      queryRows<CharacterQuest>(
        "SELECT id, character_id, stage, required_affinity, quest_type_id, reward_item_id FROM character_quests WHERE character_id = ? ORDER BY stage",
        [id],
      ),
      queryRows<CharacterQuestTarget>(
        `SELECT t.quest_id, t.slot, t.target_role, t.target_kind, t.target_id, t.target_region_id
         FROM character_quest_targets t
         JOIN character_quests q ON q.id = t.quest_id
         WHERE q.character_id = ?
         ORDER BY t.quest_id, t.slot`,
        [id],
      ),
      queryRows<{ type: string; id: number; label: string | null }>("SELECT type, id, label FROM enums ORDER BY type, id"),
    ]);

    return {
      character: characters[0] || null,
      quests,
      questTargets,
      enums: enumMapFromRows(enumRows),
    };
  },
  { server: false, watch: [characterId] },
);

const character = computed(() => data.value?.character || null);
const enums = computed(() => data.value?.enums || {});
const radarCanvas = ref<HTMLCanvasElement | null>(null);
let radarChart: any = null;

const targetsByQuest = computed(() => {
  const groups = new Map<number, CharacterQuestTarget[]>();
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

function characterName(item: Character) {
  return enumLabel(enums.value, "Character", item.id, `人物 ${item.id}`);
}

function characterInitial(item: Character) {
  return characterName(item).slice(0, 1);
}

function locationText(item: Character) {
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

function questTargets(quest: CharacterQuest) {
  return targetsByQuest.value.get(quest.id) || [];
}

function questTargetLabel(target: CharacterQuestTarget) {
  if (target.target_kind === "character") {
    return label("Character", target.target_id, "未知人物");
  }
  if (target.target_kind === "item") {
    return label("Item", target.target_id, "未知道具");
  }
  if (target.target_kind === "location") {
    const region = label("DiDian", target.target_region_id, "未知地点");
    const location = label("Area", target.target_id, "");
    return location ? `${region} / ${location}` : region;
  }
  if (target.target_kind === "sect") {
    return label("LianSuo_MP", target.target_id, "未知门派");
  }
  return target.target_id === null ? "-" : String(target.target_id);
}

function questRewardText(quest: CharacterQuest) {
  return quest.reward_item_id === null
    ? ""
    : label("Item", quest.reward_item_id, `道具 ${quest.reward_item_id}`);
}

function withQuestReward(quest: CharacterQuest, text: string) {
  const reward = questRewardText(quest);
  return reward ? `${text}，奖励 ${reward}` : text;
}

function questSummary(quest: CharacterQuest) {
  const targets = questTargets(quest);
  const mainTarget = targets.find((target) => target.target_role === "main");
  const main = mainTarget ? questTargetLabel(mainTarget) : "";
  const extras = targets.filter((target) => target.target_role !== "main").map(questTargetLabel).filter(Boolean);

  if (quest.quest_type_id === 240) {
    return withQuestReward(quest, `交付 ${main || "指定物品"}`);
  }
  if (quest.quest_type_id === 241) {
    return withQuestReward(quest, `教训 ${main || "指定人物"}`);
  }
  if (quest.quest_type_id === 242) {
    const related = extras.length ? `，关联人物 ${extras.join("、")}` : "";
    return withQuestReward(quest, `前往 ${main || "指定地点"} 找回传家宝${related}`);
  }
  if (quest.quest_type_id === 243) {
    return withQuestReward(quest, `给 ${main || "指定人物"} 下挑战书`);
  }
  if (quest.quest_type_id === 244) {
    return withQuestReward(quest, `操作该人物赢得与 ${main || "指定人物"} 的比武`);
  }
  if (quest.quest_type_id === 720) {
    const sect = extras.length ? extras.join("、") : main;
    return withQuestReward(quest, `参加 ${sect || "指定门派"} 武林大会`);
  }

  const questType = label("QuestType", quest.quest_type_id, "任务").replace(/^情缘_/, "");
  const targetText = targets.map(questTargetLabel).join("、");
  return withQuestReward(quest, targetText ? `${questType}：${targetText}` : questType);
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
              <div class="flex flex-wrap gap-2">
                <Badge variant="outline">{{ label("LianSuo_MP", character.sect_id, "无门派") }}</Badge>
                <Badge :class="rarityBadgeClass(character.rarity_id)">
                  {{ label("NPC_Rare", character.rarity_id, "资质") }}
                </Badge>
                <Badge variant="secondary">{{ label("Dengji", character.rank_id, "等级") }}</Badge>
                <Badge variant="secondary">{{ label("DiWei", character.position_id, "地位") }}</Badge>
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
            <CardDescription>头像资源待解包后接入</CardDescription>
          </CardHeader>
          <CardContent class="grid gap-4">
            <div class="flex items-center justify-center rounded-md border border-dashed py-6">
              <Avatar class="size-20 text-2xl">
                <AvatarFallback>{{ characterInitial(character) }}</AvatarFallback>
              </Avatar>
            </div>
            <div class="grid gap-3 text-sm sm:grid-cols-2">
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
            <CardTitle>四维</CardTitle>
            <CardDescription>膂力、根骨、体魄、身法</CardDescription>
          </CardHeader>
          <CardContent class="grid gap-6">
            <div class="h-80">
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
            <span>阶段 {{ quest.stage }}：{{ questSummary(quest) }}</span>
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
