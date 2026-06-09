<script setup lang="ts">
import { enumLabel, enumMapFromRows } from "~/lib/utils";
import { CircleHelp } from "@lucide/vue";
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
  martial_type_id: number;
};

const { queryRows } = useWikiDb();
const search = ref("");
const sectFilter = ref("all");
const regionFilter = ref("all");
const currentPage = ref(1);
const pageSize = 25;

const { data, pending, error } = await useAsyncData("characters-index", async () => {
  const [characters, enumRows] = await Promise.all([
    queryRows<Character>("SELECT * FROM characters ORDER BY id"),
    queryRows<{ type: string; id: number; label: string | null }>("SELECT type, id, label FROM enums ORDER BY type, id"),
  ]);
  return { characters, enums: enumMapFromRows(enumRows) };
}, { server: false });

const enums = computed(() => data.value?.enums || {});
const characters = computed(() => data.value?.characters || []);

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
  const start = (currentPage.value - 1) * pageSize;
  return filteredRows.value.slice(start, start + pageSize);
});

const pageCount = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize)));

watch([search, sectFilter, regionFilter], () => {
  currentPage.value = 1;
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
                <HoverCardContent class="grid gap-3">
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
                      <span class="text-muted-foreground">武器</span>
                      <span>{{ enumLabel(enums, "BingQiType", item.weapon_type_id) }}</span>
                    </div>
                    <div class="flex justify-between gap-3">
                      <span class="text-muted-foreground">路线</span>
                      <span>{{ enumLabel(enums, "NPC_WuGongType", item.martial_type_id) }}</span>
                    </div>
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

      <Pagination
        v-if="pageCount > 1"
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
    </template>
  </main>
</template>
