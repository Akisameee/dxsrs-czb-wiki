<script setup lang="ts">
import { useMediaQuery } from "@vueuse/core";
import { enumMapFromRows } from "~/lib/utils";
import {
  martialArtRarityToneId,
  martialArtName,
  martialArtSectLabel,
  martialArtStyleLabel,
  martialArtTypeLabel,
  type MartialArtStyleRow,
  type MartialArtSummaryRow,
} from "~/lib/wiki/martial-art";
import MartialArtCard from "~/components/wiki/martial-art/Card.vue";
import WikiCardGrid from "~/components/wiki/WikiCardGrid.vue";
import WikiIndexHeader from "~/components/wiki/WikiIndexHeader.vue";

useHead({ title: "武学" });

type MartialArt = MartialArtSummaryRow;

const { queryRows } = useWikiDb();
const search = ref("");
const sectFilter = ref("all");
const typeFilter = ref("all");
const rarityFilter = ref("all");
const currentPage = ref(1);
useWikiIndexRouteQuery({
  search,
  page: currentPage,
  filters: [
    { key: "sect", value: sectFilter },
    { key: "type", value: typeFilter },
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

const { data, pending, error } = await useAsyncData("martial-arts-index", async () => {
  const [arts, styles, enumRows] = await Promise.all([
    queryRows<MartialArtSummaryRow>(
      "SELECT id, sect_id, type_id, rarity_id, power, cost, obtain_method, is_sect_restricted FROM martial_arts ORDER BY id",
    ),
    queryRows<MartialArtStyleRow>(
      "SELECT martial_art_id, slot, style_id FROM martial_art_styles ORDER BY martial_art_id, slot",
    ),
    queryRows<{ type: string; id: number; label: string | null }>(
      "SELECT type, id, label FROM enums ORDER BY type, id",
    ),
  ]);

  return {
    enums: enumMapFromRows(enumRows),
    arts,
    styles,
  };
}, { server: false });

const enums = computed(() => data.value?.enums || {});
const arts = computed(() => data.value?.arts || []);
const stylesByMartialArt = computed(() => {
  const rows = new Map<number, MartialArtStyleRow[]>();
  for (const style of data.value?.styles || []) {
    const list = rows.get(style.martial_art_id) || [];
    list.push(style);
    rows.set(style.martial_art_id, list);
  }
  return rows;
});

function enumOptions(type: string) {
  return Object.entries(enums.value[type] || {})
    .filter(([, label]) => label)
    .map(([id, label]) => ({ id, label: label || id }));
}

const sectOptions = computed(() => enumOptions("LianSuo_MP"));
const typeOptions = computed(() => enumOptions("BingQiType"));
const rarityOptions = computed(() =>
  Object.entries(enums.value.WuGongRare || {})
    .filter(([id, label]) => label && Number(id) <= 4)
    .map(([id, label]) => ({ id, label: label || id })),
);

const indexFilters = computed(() => [
  {
    id: "martial-art-sect",
    label: "门派",
    modelValue: sectFilter.value,
    placeholder: "全部门派",
    allLabel: "全部门派",
    options: sectOptions.value.map((option) => ({ value: option.id, label: option.label })),
  },
  {
    id: "martial-art-type",
    label: "类型",
    modelValue: typeFilter.value,
    placeholder: "全部类型",
    allLabel: "全部类型",
    options: typeOptions.value.map((option) => ({ value: option.id, label: option.label })),
  },
  {
    id: "martial-art-rarity",
    label: "稀有度",
    modelValue: rarityFilter.value,
    placeholder: "全部稀有度",
    allLabel: "全部稀有度",
    options: rarityOptions.value.map((option) => ({ value: option.id, label: option.label })),
  },
]);

function updateFilter(id: string, value: string) {
  if (id === "martial-art-sect") sectFilter.value = value;
  if (id === "martial-art-type") typeFilter.value = value;
  if (id === "martial-art-rarity") rarityFilter.value = value;
}

const filteredRows = computed(() => {
  const keyword = search.value.trim().toLowerCase();
  return arts.value.filter((item) => {
    if (keyword && !martialArtName(item, enums.value).toLowerCase().includes(keyword)) return false;
    if (sectFilter.value !== "all" && String(item.sect_id) !== sectFilter.value) return false;
    if (typeFilter.value !== "all" && String(item.type_id) !== typeFilter.value) return false;
    if (rarityFilter.value !== "all" && String(martialArtRarityToneId(item.rarity_id)) !== rarityFilter.value) return false;
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

function martialArtUrl(item: MartialArt) {
  return `/martial-arts/detail/?id=${item.id}`;
}

function styleItems(item: MartialArt) {
  return (stylesByMartialArt.value.get(item.id) || [])
    .map((row) => ({
      id: row.style_id,
      label: martialArtStyleLabel(row, enums.value),
    }))
    .filter((row) => row.label);
}

function goToMartialArt(item: MartialArt) {
  return navigateTo(martialArtUrl(item));
}

</script>

<template>
  <main class="container mx-auto grid gap-6 p-6">
    <WikiIndexHeader
      title="武学"
      :description="pending ? '读取中...' : `共 ${arts.length} 门武学，当前 ${filteredRows.length} 条`"
      search-id="martial-art-search"
      search-placeholder="搜索武学"
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
      empty-label="没有匹配的武学"
    >
        <MartialArtCard
          v-for="item in pagedRows"
          :key="item.id"
          role="link"
          :id="item.id"
          :name="martialArtName(item, enums)"
          :type="martialArtTypeLabel(item, enums)"
          :type-id="item.type_id"
          :rarity-id="item.rarity_id"
          :rarity-tone-id="martialArtRarityToneId(item.rarity_id)"
          :sect-id="item.sect_id"
          :sect-label="martialArtSectLabel(item, enums)"
          :styles="styleItems(item)"
          :on-click="() => goToMartialArt(item)"
        />
    </WikiCardGrid>
  </main>
</template>
