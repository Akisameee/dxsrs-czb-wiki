<script setup lang="ts">
import { enumLabel, enumMapFromRows } from "~/lib/utils";
import { CircleHelp } from "@lucide/vue";
import { useMediaQuery } from "@vueuse/core";
import { rarityCardClass } from "~/lib/rarity";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

useHead({ title: "人物" });

type Character = {
  id: number;
  region_id: number | null;
  location_id: number | null;
  sect_id: number;
  rarity_id: number;
  weapon_type_id: number;
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

const { queryRows } = useWikiDb();
const search = ref("");
const sectFilter = ref("all");
const regionFilter = ref("all");
const currentPage = ref(1);
const isSm = useMediaQuery("(min-width: 640px)");
const isLg = useMediaQuery("(min-width: 1024px)");
const isXl = useMediaQuery("(min-width: 1280px)");
const gridColumns = computed(() => {
  if (isXl.value) return 4;
  if (isLg.value) return 3;
  if (isSm.value) return 2;
  return 1;
});
const pageSize = computed(() => gridColumns.value * (gridColumns.value === 1 ? 10 : 6));

const { data, pending, error } = await useAsyncData("characters-index", async () => {
  const [characters, quests, questTargets, enumRows] = await Promise.all([
    queryRows<Character>("SELECT * FROM characters ORDER BY id"),
    queryRows<CharacterQuest>("SELECT id, character_id, stage, required_affinity, quest_type_id, reward_item_id FROM character_quests ORDER BY character_id, stage"),
    queryRows<CharacterQuestTarget>("SELECT quest_id, slot, target_role, target_kind, target_id, target_region_id FROM character_quest_targets ORDER BY quest_id, slot"),
    queryRows<{ type: string; id: number; label: string | null }>("SELECT type, id, label FROM enums ORDER BY type, id"),
  ]);
  return { characters, quests, questTargets, enums: enumMapFromRows(enumRows) };
}, { server: false });

const enums = computed(() => data.value?.enums || {});
const characters = computed(() => data.value?.characters || []);
const questsByCharacter = computed(() => {
  const groups = new Map<number, CharacterQuest[]>();
  for (const quest of data.value?.quests || []) {
    const characterQuests = groups.get(quest.character_id) || [];
    characterQuests.push(quest);
    groups.set(quest.character_id, characterQuests);
  }
  return groups;
});
const targetsByQuest = computed(() => {
  const groups = new Map<number, CharacterQuestTarget[]>();
  for (const target of data.value?.questTargets || []) {
    const targets = groups.get(target.quest_id) || [];
    targets.push(target);
    groups.set(target.quest_id, targets);
  }
  return groups;
});

function characterName(item: Character) {
  return enumLabel(enums.value, "Character", item.id, `人物 ${item.id}`);
}

function locationText(item: Character) {
  if (item.region_id === null || item.location_id === null) return "无地点";
  return `${enumLabel(enums.value, "DiDian", item.region_id)} / ${enumLabel(enums.value, "Area", item.location_id)}`;
}

function characterInitial(item: Character) {
  return characterName(item).slice(0, 1);
}

function characterDetailUrl(item: Character) {
  return `/characters/detail/?id=${item.id}`;
}

function characterCardClass(item: Character) {
  const base = "cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";
  return `${base} ${rarityCardClass(item.rarity_id)}`;
}

function goToCharacter(item: Character) {
  return navigateTo(characterDetailUrl(item));
}

function characterQuests(item: Character) {
  return questsByCharacter.value.get(item.id) || [];
}

function questLabel(quest: CharacterQuest) {
  return enumLabel(enums.value, "QuestType", quest.quest_type_id, "任务").replace(/^情缘_/, "");
}

function questTargetLabel(target: CharacterQuestTarget) {
  if (target.target_kind === "character") {
    return enumLabel(enums.value, "Character", target.target_id, "未知人物");
  }
  if (target.target_kind === "item") {
    return enumLabel(enums.value, "Item", target.target_id, "未知道具");
  }
  if (target.target_kind === "location") {
    const region = enumLabel(enums.value, "DiDian", target.target_region_id, "未知地点");
    const location = enumLabel(enums.value, "Area", target.target_id, "");
    return location ? `${region} / ${location}` : region;
  }
  if (target.target_kind === "sect") {
    return enumLabel(enums.value, "LianSuo_MP", target.target_id, "未知门派");
  }
  return target.target_id === null ? "-" : String(target.target_id);
}

function questTargets(quest: CharacterQuest) {
  return targetsByQuest.value.get(quest.id) || [];
}

function questMainTarget(quest: CharacterQuest) {
  return questTargets(quest).find((target) => target.target_role === "main");
}

function questExtraTargets(quest: CharacterQuest) {
  return questTargets(quest).filter((target) => target.target_role !== "main");
}

function questRewardText(quest: CharacterQuest) {
  return quest.reward_item_id === null
    ? ""
    : enumLabel(enums.value, "Item", quest.reward_item_id, `道具 ${quest.reward_item_id}`);
}

function withQuestReward(quest: CharacterQuest, text: string) {
  const reward = questRewardText(quest);
  return reward ? `${text} -> ${reward}` : text;
}

function questSummary(quest: CharacterQuest) {
  const type = questLabel(quest);
  const mainTarget = questMainTarget(quest);
  const main = mainTarget ? questTargetLabel(mainTarget) : "";
  const extras = questExtraTargets(quest).map(questTargetLabel).filter(Boolean);

  if (quest.quest_type_id === 240) {
    return withQuestReward(quest, `交付 ${main || "指定物品"}`);
  }
  if (quest.quest_type_id === 241) {
    return withQuestReward(quest, `教训 ${main || "指定人物"}`);
  }
  if (quest.quest_type_id === 242) {
    const related = extras.length ? `，找 ${extras.join("、")}` : "";
    return withQuestReward(quest, `${main || "指定地点"} 寻宝${related}`);
  }
  if (quest.quest_type_id === 243) {
    return withQuestReward(quest, `给 ${main || "指定人物"} 下挑战书`);
  }
  if (quest.quest_type_id === 244) {
    return withQuestReward(quest, `赢得与 ${main || "指定人物"} 的比武`);
  }
  if (quest.quest_type_id === 720) {
    const sect = extras.length ? extras.join("、") : main;
    return withQuestReward(quest, `参加 ${sect || "指定门派"} 武林大会`);
  }

  const targetText = [main, ...extras].filter(Boolean).join("、");
  return withQuestReward(quest, targetText ? `${type}：${targetText}` : type);
}

function enumOptions(type: string) {
  return Object.entries(enums.value[type] || {})
    .filter(([, label]) => label)
    .map(([id, label]) => ({ id, label: label || id }));
}

const sectOptions = computed(() => enumOptions("LianSuo_MP"));
const regionOptions = computed(() => enumOptions("DiDian"));

const filteredRows = computed(() => {
  const keyword = search.value.trim().toLowerCase();
  return characters.value.filter((item) => {
    if (keyword && !characterName(item).toLowerCase().includes(keyword)) return false;
    if (sectFilter.value !== "all" && String(item.sect_id) !== sectFilter.value) return false;
    if (regionFilter.value !== "all" && String(item.region_id) !== regionFilter.value) return false;
    return true;
  });
});

const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredRows.value.slice(start, start + pageSize.value);
});

const pageCount = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize.value)));

watch([search, sectFilter, regionFilter], () => {
  currentPage.value = 1;
});

watch(pageSize, (size, oldSize) => {
  if (!oldSize) return;
  const firstVisibleIndex = (currentPage.value - 1) * oldSize;
  currentPage.value = Math.floor(firstVisibleIndex / size) + 1;
});

watch(pageCount, (count) => {
  if (currentPage.value > count) currentPage.value = count;
});
</script>

<template>
  <main class="container mx-auto grid gap-6 p-6">
    <Card>
      <CardHeader>
        <CardTitle>人物</CardTitle>
        <CardDescription>
          {{ pending ? "读取中..." : `共 ${characters.length} 人，当前 ${filteredRows.length} 条` }}
        </CardDescription>
      </CardHeader>
      <CardContent class="grid gap-4 md:grid-cols-3">
        <div class="grid gap-2">
          <Label for="character-search">搜索</Label>
          <Input id="character-search" v-model="search" type="search" placeholder="搜索人物" />
        </div>
        <div class="grid gap-2">
          <Label for="character-sect">门派</Label>
          <Select v-model="sectFilter">
            <SelectTrigger id="character-sect" class="w-full">
              <SelectValue placeholder="全部门派" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部门派</SelectItem>
              <SelectItem v-for="option in sectOptions" :key="option.id" :value="option.id">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="grid gap-2">
          <Label for="character-region">地点</Label>
          <Select v-model="regionFilter">
            <SelectTrigger id="character-region" class="w-full">
              <SelectValue placeholder="全部地点" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部地点</SelectItem>
              <SelectItem v-for="option in regionOptions" :key="option.id" :value="option.id">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>

    <Card v-if="error">
      <CardContent class="text-destructive">{{ error.message }}</CardContent>
    </Card>

    <template v-else>
      <Pagination
        v-slot="{ page }"
        v-model:page="currentPage"
        :items-per-page="pageSize"
        :sibling-count="1"
        :total="filteredRows.length"
        show-edges
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

      <div v-if="pagedRows.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Card
          v-for="item in pagedRows"
          :key="item.id"
          :class="characterCardClass(item)"
          role="link"
          tabindex="0"
          @click="goToCharacter(item)"
          @keydown.enter="goToCharacter(item)"
          @keydown.space.prevent="goToCharacter(item)"
        >
          <CardHeader>
            <div class="flex items-start gap-3">
              <Avatar size="lg">
                <AvatarFallback>{{ characterInitial(item) }}</AvatarFallback>
              </Avatar>

              <div class="min-w-0 flex-1">
                <CardTitle class="truncate text-base">{{ characterName(item) }}</CardTitle>
                <CardDescription class="truncate">{{ locationText(item) }}</CardDescription>
                <Badge variant="outline" class="mt-2">
                  {{ enumLabel(enums, "LianSuo_MP", item.sect_id) }}
                </Badge>
              </div>

              <HoverCard>
                <HoverCardTrigger as-child>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="查看摘要"
                    @click.stop
                    @keydown.enter.stop
                    @keydown.space.stop
                  >
                    <CircleHelp />
                  </Button>
                </HoverCardTrigger>
                <HoverCardContent class="grid w-96 max-w-[calc(100vw-2rem)] gap-3">
                  <div>
                    <div class="font-medium">{{ characterName(item) }}</div>
                    <div class="text-muted-foreground">{{ locationText(item) }}</div>
                  </div>
                  <div class="grid gap-2 text-sm">
                    <div class="flex justify-between gap-3">
                      <span class="text-muted-foreground">门派</span>
                      <span>{{ enumLabel(enums, "LianSuo_MP", item.sect_id) }}</span>
                    </div>
                    <div class="flex justify-between gap-3">
                      <span class="text-muted-foreground">资质</span>
                      <span>{{ enumLabel(enums, "NPC_Rare", item.rarity_id) }}</span>
                    </div>
                    <div class="flex justify-between gap-3">
                      <span class="text-muted-foreground">武器类型</span>
                      <span>{{ enumLabel(enums, "BingQiType", item.weapon_type_id) }}</span>
                    </div>
                  </div>
                  <div
                    v-if="characterQuests(item).length"
                    class="grid gap-2 border-t pt-3 text-sm text-muted-foreground"
                  >
                    <div>心愿任务</div>
                    <div
                      v-for="quest in characterQuests(item)"
                      :key="quest.id"
                      class="grid gap-1"
                    >
                      <div>{{ quest.stage }}. {{ questSummary(quest) }}</div>
                    </div>
                  </div>
                  <div v-else class="border-t pt-3 text-sm text-muted-foreground">
                    无心愿任务
                  </div>
                </HoverCardContent>
              </HoverCard>
            </div>
          </CardHeader>
        </Card>
      </div>

      <Card v-else>
        <CardContent class="py-12 text-center text-muted-foreground">
          没有匹配的人物
        </CardContent>
      </Card>
    </template>
  </main>
</template>
