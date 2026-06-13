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
import CharacterPortrait from "~/components/wiki/character/CharacterPortrait.vue";
import { Badge } from "~/components/ui/badge";
import SectHoverLink from "~/components/wiki/sect/HoverLink.vue";
import WikiCard from "~/components/wiki/WikiCard.vue";
import WikiCardGrid from "~/components/wiki/WikiCardGrid.vue";
import WikiIndexHeader from "~/components/wiki/WikiIndexHeader.vue";

useHead({ title: "人物" });

type Character = CharacterSummaryRow;

const CharacterHoverLink = defineAsyncComponent(() => import("~/components/wiki/character/HoverLink.vue"));
const { queryRows } = useWikiDb();
const search = ref("");
const sectFilter = ref("all");
const regionFilter = ref("all");
const rarityFilter = ref("all");
const currentPage = ref(1);
useWikiIndexRouteQuery({
  search,
  page: currentPage,
  filters: [
    { key: "sect", value: sectFilter },
    { key: "region", value: regionFilter },
    { key: "rarity", value: rarityFilter },
  ],
});
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

function goToCharacter(item: Character) {
  return navigateTo(characterDetailUrl(item.id));
}

function enumOptions(type: string) {
  return Object.entries(enums.value[type] || {})
    .filter(([, label]) => label)
    .map(([id, label]) => ({ id, label: label || id }));
}

const sectOptions = computed(() => enumOptions("LianSuo_MP"));
const regionOptions = computed(() => enumOptions("DiDian"));
const rarityOptions = computed(() => enumOptions("NPC_Rare"));

const indexFilters = computed(() => [
  {
    id: "character-sect",
    label: "门派",
    modelValue: sectFilter.value,
    placeholder: "全部门派",
    allLabel: "全部门派",
    options: sectOptions.value.map((option) => ({ value: option.id, label: option.label })),
  },
  {
    id: "character-region",
    label: "地点",
    modelValue: regionFilter.value,
    placeholder: "全部地点",
    allLabel: "全部地点",
    options: regionOptions.value.map((option) => ({ value: option.id, label: option.label })),
  },
  {
    id: "character-rarity",
    label: "资质",
    modelValue: rarityFilter.value,
    placeholder: "全部资质",
    allLabel: "全部资质",
    options: rarityOptions.value.map((option) => ({ value: option.id, label: option.label })),
  },
]);

function updateFilter(id: string, value: string) {
  if (id === "character-sect") sectFilter.value = value;
  if (id === "character-region") regionFilter.value = value;
  if (id === "character-rarity") rarityFilter.value = value;
}

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

watch(pageCount, (count) => {
  if (currentPage.value > count) currentPage.value = count;
});
</script>

<template>
  <main class="container mx-auto grid gap-6 p-6">
    <WikiIndexHeader
      title="人物"
      :description="pending ? '读取中...' : `共 ${characters.length} 人，当前 ${filteredRows.length} 条`"
      search-id="character-search"
      search-placeholder="搜索人物"
      :search="search"
      :filters="indexFilters"
      @update:search="search = $event"
      @update:filter="updateFilter"
    />

    <WikiCardGrid
      v-model:page="currentPage"
      :error="error"
      :rows="pagedRows"
      :total="filteredRows.length"
      :page-size="pageSize"
      empty-label="没有匹配的人物"
    >
        <WikiCard
          v-for="item in pagedRows"
          :key="item.id"
          role="link"
          :title="characterName(item)"
          :description="locationText(item)"
          :color="rarityCardClass(item.rarity_id)"
          :on-click="() => goToCharacter(item)"
        >
          <template #avatar>
            <CharacterPortrait
              :ids="{ characterId: item.id, portrait: item.portrait }"
              :fallback="characterInitial(item)"
              :size="48"
            />
          </template>
          <template #action>
            <CharacterHoverLink :id="item.id" mode="button" />
          </template>
          <template #badges>
            <SectHoverLink
              :id="item.sect_id"
              :label="enumLabel(enums, 'LianSuo_MP', item.sect_id)"
            />
            <Badge variant="secondary">
              {{ enumLabel(enums, 'BingQiType', item.weapon_type_id) }}
            </Badge>
          </template>
        </WikiCard>
    </WikiCardGrid>
  </main>
</template>
