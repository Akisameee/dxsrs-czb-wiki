<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import { useMediaQuery } from "@vueuse/core";
import { enumMapFromRows } from "~/lib/utils";
import { rarityCardClass } from "~/lib/rarity";
import {
  itemDetailUrl,
  itemInitial,
  itemMaterialText,
  itemName,
  itemRarityLabel,
  itemRarityToneId,
  itemTypeLabel,
  type ItemSummaryRow,
} from "~/lib/wiki/item";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
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

useHead({ title: "道具" });

type Item = ItemSummaryRow;

const ItemHoverLink = defineAsyncComponent(() => import("~/components/wiki-summary/item/HoverLink.vue"));
const { queryRows } = useWikiDb();
const search = ref("");
const typeFilter = ref("all");
const rarityFilter = ref("all");
const materialFilter = ref("all");
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

const { data, pending, error } = await useAsyncData("items-index", async () => {
  const [items, enumRows] = await Promise.all([
    queryRows<Item>(
      `SELECT id, icon, description, type_id, rarity_id, use_type_id, use_text, use_value,
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

const filteredRows = computed(() => {
  const keyword = search.value.trim().toLowerCase();
  return items.value.filter((item) => {
    if (keyword && !itemName(item, enums.value).toLowerCase().includes(keyword)) return false;
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

watch([search, typeFilter, rarityFilter, materialFilter], () => {
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

function itemCardClass(item: Item) {
  const base = "cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";
  return `${base} ${rarityCardClass(itemRarityToneId(item.rarity_id))}`;
}

function goToItem(item: Item) {
  return navigateTo(itemDetailUrl(item.id));
}

function handleItemKeydown(event: KeyboardEvent, item: Item) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  void goToItem(item);
}
</script>

<template>
  <main class="container mx-auto grid gap-6 p-6">
    <Card>
      <CardHeader>
        <CardTitle>道具</CardTitle>
        <CardDescription>
          {{ pending ? "读取中..." : `共 ${items.length} 个道具，当前 ${filteredRows.length} 条` }}
        </CardDescription>
      </CardHeader>
      <CardContent class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div class="grid gap-2">
          <Label for="item-search">搜索</Label>
          <Input id="item-search" v-model="search" type="search" placeholder="搜索道具" />
        </div>
        <div class="grid gap-2">
          <Label for="item-type">类型</Label>
          <Select v-model="typeFilter">
            <SelectTrigger id="item-type" class="w-full">
              <SelectValue placeholder="全部类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem v-for="option in typeOptions" :key="option.id" :value="option.id">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="grid gap-2">
          <Label for="item-rarity">稀有度</Label>
          <Select v-model="rarityFilter">
            <SelectTrigger id="item-rarity" class="w-full">
              <SelectValue placeholder="全部稀有度" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部稀有度</SelectItem>
              <SelectItem v-for="option in rarityOptions" :key="option.id" :value="option.id">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="grid gap-2">
          <Label for="item-material">材料</Label>
          <Select v-model="materialFilter">
            <SelectTrigger id="item-material" class="w-full">
              <SelectValue placeholder="全部道具" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部道具</SelectItem>
              <SelectItem value="1">仅材料</SelectItem>
              <SelectItem value="0">非材料</SelectItem>
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
        <PaginationContent v-slot="{ items: pageItems }">
          <PaginationFirst />
          <PaginationPrevious />
          <template v-for="(pageItem, index) in pageItems" :key="index">
            <PaginationItem
              v-if="pageItem.type === 'page'"
              :is-active="pageItem.value === page"
              :value="pageItem.value"
            >
              {{ pageItem.value }}
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
          :class="itemCardClass(item)"
          role="link"
          tabindex="0"
          @click="goToItem(item)"
          @keydown="handleItemKeydown($event, item)"
        >
          <CardHeader>
            <div class="flex items-start gap-3">
              <Avatar size="lg">
                <AvatarFallback>{{ itemInitial(item, enums) }}</AvatarFallback>
              </Avatar>

              <div class="min-w-0 flex-1">
                <CardTitle class="truncate text-base">{{ itemName(item, enums) }}</CardTitle>
                <CardDescription class="truncate">{{ itemTypeLabel(item, enums) }}</CardDescription>
              </div>

              <ItemHoverLink :id="item.id" mode="button" />
            </div>
          </CardHeader>
        </Card>
      </div>

      <Card v-else>
        <CardContent class="py-12 text-center text-muted-foreground">
          没有匹配的道具
        </CardContent>
      </Card>
    </template>
  </main>
</template>
