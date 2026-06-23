<script setup lang="ts">
import { enumMapFromRows } from "~/lib/utils";
import {
  itemDetailUrl,
  itemName,
  itemTypeLabel,
  type ItemSummaryRow,
} from "~/lib/wiki/item";
import ItemCard from "~/components/wiki/item/Card.vue";
import WikiCardGrid from "~/components/wiki/WikiCardGrid.vue";
import WikiIndexHeader from "~/components/wiki/WikiIndexHeader.vue";

useHead({ title: "道具" });

type Item = ItemSummaryRow;

const { queryRows } = useWikiDb();
const search = ref("");
const typeFilter = ref("all");
const rarityFilter = ref("all");
const materialFilter = ref("all");
const currentPage = ref(1);
useWikiIndexRouteQuery({
  search,
  page: currentPage,
  filters: [
    { key: "type", value: typeFilter },
    { key: "rarity", value: rarityFilter },
  { key: "material", value: materialFilter },
  ],
});
const pageSize = computed(() => 24);

const { data, pending, error } = useLazyAsyncData("items-index", async () => {
  const [items, enumRows] = await Promise.all([
    queryRows<Item>(
      `SELECT id, name, image_id, description, type_id, rarity_id, use_type_id, use_text, use_value,
        use_value2, use_value3, cost, required_strength, required_constitution,
        required_physique, required_agility, required_cultivation, required_mastery, is_material
       FROM items
       ORDER BY id`,
    ),
    queryRows<{ type: string; id: number; label: string | null }>(
      "SELECT type, id, label FROM enums ORDER BY type, id",
    ),
  ]);
  return { items, enums: enumMapFromRows(enumRows) };
}, { server: false });

const enums = computed(() => data.value?.enums || {});
const items = computed(() => data.value?.items || []);

function enumOptions(type: string) {
  return Object.entries(enums.value[type] || {})
    .filter(([, label]) => label)
    .map(([id, label]) => ({ id, label: label || id }));
}

const typeOptions = computed(() => enumOptions("ItemType"));
const rarityOptions = computed(() => enumOptions("ItemRare"));
const materialOptions = [
  { value: "1", label: "仅材料" },
  { value: "0", label: "非材料" },
];

const indexFilters = computed(() => [
  {
    id: "item-type",
    label: "类型",
    modelValue: typeFilter.value,
    placeholder: "全部类型",
    allLabel: "全部类型",
    options: typeOptions.value.map((option) => ({ value: option.id, label: option.label })),
  },
  {
    id: "item-rarity",
    label: "稀有度",
    modelValue: rarityFilter.value,
    placeholder: "全部稀有度",
    allLabel: "全部稀有度",
    options: rarityOptions.value.map((option) => ({ value: option.id, label: option.label })),
  },
  {
    id: "item-material",
    label: "材料",
    modelValue: materialFilter.value,
    placeholder: "全部道具",
    allLabel: "全部道具",
    options: materialOptions,
  },
]);

function updateFilter(id: string, value: string) {
  if (id === "item-type") typeFilter.value = value;
  if (id === "item-rarity") rarityFilter.value = value;
  if (id === "item-material") materialFilter.value = value;
}

const filteredRows = computed(() => {
  const keyword = search.value.trim().toLowerCase();
  return items.value.filter((item) => {
    if (keyword && !itemName(item).toLowerCase().includes(keyword)) return false;
    if (typeFilter.value !== "all" && String(item.type_id) !== typeFilter.value) return false;
    if (rarityFilter.value !== "all" && String(item.rarity_id) !== rarityFilter.value) return false;
    if (materialFilter.value !== "all" && String(Number(item.is_material)) !== materialFilter.value) return false;
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

function goToItem(item: Item) {
  return navigateTo(itemDetailUrl(item.id));
}
</script>

<template>
  <AppPageContainer>
    <WikiIndexHeader
      title="道具"
      :description="pending ? '读取中...' : `共 ${items.length} 个道具，当前 ${filteredRows.length} 条`"
      search-id="item-search"
      search-placeholder="搜索道具"
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
      empty-label="没有匹配的道具"
    >
      <ItemCard
        v-for="item in pagedRows"
        :key="item.id"
        role="link"
        :id="item.id"
        :name="itemName(item)"
        :image-id="item.image_id"
        :description="itemTypeLabel(item, enums)"
        :rarity-id="item.rarity_id"
        :on-click="() => goToItem(item)"
      />
    </WikiCardGrid>
  </AppPageContainer>
</template>
