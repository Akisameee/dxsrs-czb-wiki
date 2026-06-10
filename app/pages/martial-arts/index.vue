<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import { useMediaQuery } from "@vueuse/core";
import { enumMapFromRows } from "~/lib/utils";
import { rarityCardClass } from "~/lib/rarity";
import {
  martialArtRarityToneId,
  martialArtName,
  martialArtRarityLabel,
  martialArtSectLabel,
  martialArtStyleLabel,
  martialArtTypeLabel,
  type MartialArtStyleRow,
  type MartialArtSummaryRow,
} from "~/lib/wiki/martial-art";
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

useHead({ title: "武学" });

type MartialArt = MartialArtSummaryRow;

const MartialArtHoverLink = defineAsyncComponent(() => import("~/components/wiki-summary/martial-art/HoverLink.vue"));
const { queryRows } = useWikiDb();
const search = ref("");
const sectFilter = ref("all");
const typeFilter = ref("all");
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

watch([search, sectFilter, typeFilter, rarityFilter], () => {
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

function martialArtCardClass(item: MartialArt) {
  const base = "cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";
  return `${base} ${rarityCardClass(martialArtRarityToneId(item.rarity_id))}`;
}

function martialArtUrl(item: MartialArt) {
  return `/martial-arts/detail/?id=${item.id}`;
}

function martialArtInitial(item: MartialArt) {
  return martialArtName(item, enums.value).slice(0, 1);
}

function styleLabels(item: MartialArt) {
  return (stylesByMartialArt.value.get(item.id) || [])
    .map((row) => martialArtStyleLabel(row, enums.value))
    .filter(Boolean);
}

function goToMartialArt(item: MartialArt) {
  return navigateTo(martialArtUrl(item));
}
</script>

<template>
  <main class="container mx-auto grid gap-6 p-6">
    <Card>
      <CardHeader>
        <CardTitle>武学</CardTitle>
        <CardDescription>
          {{ pending ? "读取中..." : `共 ${arts.length} 门武学，当前 ${filteredRows.length} 条` }}
        </CardDescription>
      </CardHeader>
      <CardContent class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div class="grid gap-2">
          <Label for="martial-art-search">搜索</Label>
          <Input id="martial-art-search" v-model="search" type="search" placeholder="搜索武学" />
        </div>
        <div class="grid gap-2">
          <Label for="martial-art-sect">门派</Label>
          <Select v-model="sectFilter">
            <SelectTrigger id="martial-art-sect" class="w-full">
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
          <Label for="martial-art-type">类型</Label>
          <Select v-model="typeFilter">
            <SelectTrigger id="martial-art-type" class="w-full">
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
          <Label for="martial-art-rarity">稀有度</Label>
          <Select v-model="rarityFilter">
            <SelectTrigger id="martial-art-rarity" class="w-full">
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
          :class="martialArtCardClass(item)"
          role="link"
          tabindex="0"
          @click="goToMartialArt(item)"
          @keydown.enter="goToMartialArt(item)"
          @keydown.space.prevent="goToMartialArt(item)"
        >
          <CardHeader>
            <div class="flex items-start gap-3">
              <div class="flex size-10 shrink-0 items-center justify-center rounded-full border text-sm font-medium text-muted-foreground">
                {{ martialArtInitial(item) }}
              </div>

              <div class="min-w-0 flex-1">
                <CardTitle class="truncate text-base">{{ martialArtName(item, enums) }}</CardTitle>
                <CardDescription class="truncate">
                  {{ martialArtTypeLabel(item, enums) }}
                </CardDescription>
                <div class="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {{ martialArtSectLabel(item, enums) }}
                  </Badge>
                  <Badge
                    v-for="style in styleLabels(item)"
                    :key="style"
                    variant="secondary"
                  >
                    {{ style }}
                  </Badge>
                </div>
              </div>

              <MartialArtHoverLink :id="item.id" mode="button" />
            </div>
          </CardHeader>
        </Card>
      </div>

      <Card v-else>
        <CardContent class="py-12 text-center text-muted-foreground">
          没有匹配的武学
        </CardContent>
      </Card>
    </template>
  </main>
</template>
