<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import { enumLabel, enumMapFromRows } from "~/lib/utils";
import { useMediaQuery } from "@vueuse/core";
import { rarityCardClass } from "~/lib/rarity";
import {
  characterDetailUrl,
  characterInitial as getCharacterInitial,
  characterLocationText,
  characterName as getCharacterName,
  type CharacterSummaryRow,
} from "~/lib/wiki/character";
import { Badge } from "~/components/ui/badge";
import CharacterPortrait from "~/components/wiki/CharacterPortrait.vue";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
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

type Character = CharacterSummaryRow;

const CharacterHoverLink = defineAsyncComponent(() => import("~/components/wiki-summary/character/HoverLink.vue"));
const { queryRows } = useWikiDb();
const search = ref("");
const sectFilter = ref("all");
const regionFilter = ref("all");
const rarityFilter = ref("all");
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
  const [characters, enumRows] = await Promise.all([
    queryRows<Character>("SELECT * FROM characters ORDER BY id"),
    queryRows<{ type: string; id: number; label: string | null }>("SELECT type, id, label FROM enums ORDER BY type, id"),
  ]);
  return { characters, enums: enumMapFromRows(enumRows) };
}, { server: false });

const enums = computed(() => data.value?.enums || {});
const characters = computed(() => data.value?.characters || []);

function characterName(item: Character) {
  return getCharacterName(item, enums.value);
}

function locationText(item: Character) {
  return characterLocationText(item, enums.value);
}

function characterInitial(item: Character) {
  return getCharacterInitial(item, enums.value);
}

function characterCardClass(item: Character) {
  const base = "cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";
  return `${base} ${rarityCardClass(item.rarity_id)}`;
}

function goToCharacter(item: Character) {
  return navigateTo(characterDetailUrl(item.id));
}

function handleCharacterKeydown(event: KeyboardEvent, item: Character) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  void goToCharacter(item);
}

function enumOptions(type: string) {
  return Object.entries(enums.value[type] || {})
    .filter(([, label]) => label)
    .map(([id, label]) => ({ id, label: label || id }));
}

const sectOptions = computed(() => enumOptions("LianSuo_MP"));
const regionOptions = computed(() => enumOptions("DiDian"));
const rarityOptions = computed(() => enumOptions("NPC_Rare"));

const filteredRows = computed(() => {
  const keyword = search.value.trim().toLowerCase();
  return characters.value.filter((item) => {
    if (keyword && !characterName(item).toLowerCase().includes(keyword)) return false;
    if (sectFilter.value !== "all" && String(item.sect_id) !== sectFilter.value) return false;
    if (regionFilter.value !== "all" && String(item.region_id) !== regionFilter.value) return false;
    if (rarityFilter.value !== "all" && String(item.rarity_id) !== rarityFilter.value) return false;
    return true;
  });
});

const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredRows.value.slice(start, start + pageSize.value);
});

const pageCount = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize.value)));

watch([search, sectFilter, regionFilter, rarityFilter], () => {
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
      <CardContent class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
        <div class="grid gap-2">
          <Label for="character-rarity">资质</Label>
          <Select v-model="rarityFilter">
            <SelectTrigger id="character-rarity" class="w-full">
              <SelectValue placeholder="全部资质" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部资质</SelectItem>
              <SelectItem v-for="option in rarityOptions" :key="option.id" :value="option.id">
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
          @keydown="handleCharacterKeydown($event, item)"
        >
          <CardHeader>
            <div class="flex items-start gap-3">
              <CharacterPortrait
                :ids="{ characterId: item.id, portrait: item.portrait }"
                :fallback="characterInitial(item)"
                :size="48"
              />

              <div class="min-w-0 flex-1">
                <CardTitle class="truncate text-base">{{ characterName(item) }}</CardTitle>
                <CardDescription class="truncate">{{ locationText(item) }}</CardDescription>
                <Badge variant="outline" class="mt-2">
                  {{ enumLabel(enums, "LianSuo_MP", item.sect_id) }}
                </Badge>
                <Badge variant="secondary" class="mt-2">
                  {{ enumLabel(enums, "BingQiType", item.weapon_type_id) }}
                </Badge>
              </div>

              <CharacterHoverLink :id="item.id" mode="button" />
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
