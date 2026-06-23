<script setup lang="ts">
import { Check } from "@lucide/vue";
import { useMediaQuery } from "@vueuse/core";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import MartialArtCard from "~/components/wiki/martial-art/Card.vue";
import WikiCardGrid from "~/components/wiki/WikiCardGrid.vue";
import WikiIndexHeader from "~/components/wiki/WikiIndexHeader.vue";
import {
  martialArtName,
  martialArtRarityToneId,
  martialArtSectLabel,
  martialArtStyleLabel,
  martialArtTypeLabel,
  type MartialArtStyleRow,
} from "~/lib/wiki/martial-art";
import type { WikiEnums } from "~/lib/wiki/text";

export type MartialArtAddRow = {
  id: number;
  name: string | null;
  legacy_name: string | null;
  sect_id: number | null;
  sect_name: string | null;
  type_id: number | null;
  rarity_id: number | null;
};

export type MartialArtAddPayload = {
  martialArt: MartialArtAddRow;
};

const props = defineProps<{
  enums: WikiEnums;
}>();

const emit = defineEmits<{
  add: [payloads: MartialArtAddPayload[]];
}>();

const open = defineModel<boolean>("open", { required: true });
const { queryRows } = useWikiDb();
const search = ref("");
const sectFilter = ref("all");
const typeFilter = ref("all");
const rarityFilter = ref("all");
const currentPage = ref(1);
const selectedIds = ref<Set<number>>(new Set());
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

const { data, pending, error } = useLazyAsyncData(
  "save-edit-martial-art-add-items",
  async () => {
    const [arts, styles] = await Promise.all([
      queryRows<MartialArtAddRow>(
        `SELECT art.id, art.name, art.legacy_name, art.sect_id, sect.name AS sect_name,
          art.type_id, art.rarity_id
         FROM martial_arts art
         LEFT JOIN sects sect ON sect.id = art.sect_id
         ORDER BY art.id`,
      ),
      queryRows<MartialArtStyleRow>(
        "SELECT martial_art_id, slot, style_id FROM martial_art_styles ORDER BY martial_art_id, slot",
      ),
    ]);
    return { arts, styles };
  },
  { server: false },
);

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

const sectOptions = computed(() => {
  const rows = new Map<string, string>();
  for (const art of arts.value) {
    if (art.sect_id !== null && art.sect_name) rows.set(String(art.sect_id), art.sect_name);
  }
  return Array.from(rows.entries()).map(([value, label]) => ({ value, label }));
});
const typeOptions = computed(() => enumOptions("BingQiType"));
const rarityOptions = computed(() =>
  Object.entries(props.enums.WuGongRare || {})
    .filter(([id, label]) => label && Number(id) <= 4)
    .map(([value, label]) => ({ value, label: label || value })),
);
const indexFilters = computed(() => [
  {
    id: "martial-art-sect",
    label: "门派",
    modelValue: sectFilter.value,
    placeholder: "全部门派",
    allLabel: "全部门派",
    options: sectOptions.value,
  },
  {
    id: "martial-art-type",
    label: "类型",
    modelValue: typeFilter.value,
    placeholder: "全部类型",
    allLabel: "全部类型",
    options: typeOptions.value,
  },
  {
    id: "martial-art-rarity",
    label: "稀有度",
    modelValue: rarityFilter.value,
    placeholder: "全部稀有度",
    allLabel: "全部稀有度",
    options: rarityOptions.value,
  },
]);
const filteredRows = computed(() => {
  const keyword = search.value.trim().toLowerCase();
  return arts.value.filter((item) => {
    if (keyword && ![martialArtName(item), item.legacy_name, String(item.id)]
      .some((value) => String(value || "").toLowerCase().includes(keyword))) return false;
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
const selectedRows = computed(() => {
  const ids = selectedIds.value;
  return arts.value.filter((item) => ids.has(item.id));
});
const pageCount = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize.value)));

watch(open, (value) => {
  if (!value) return;
  currentPage.value = 1;
  selectedIds.value = new Set();
});

watch([search, sectFilter, typeFilter, rarityFilter], () => {
  currentPage.value = 1;
});

watch(pageCount, (count) => {
  if (currentPage.value > count) currentPage.value = count;
});

function enumOptions(type: string) {
  return Object.entries(props.enums[type] || {})
    .filter(([, label]) => label)
    .map(([value, label]) => ({ value, label: label || value }));
}

function updateFilter(id: string, value: string) {
  if (id === "martial-art-sect") sectFilter.value = value;
  if (id === "martial-art-type") typeFilter.value = value;
  if (id === "martial-art-rarity") rarityFilter.value = value;
}

function styleItems(item: MartialArtAddRow) {
  return (stylesByMartialArt.value.get(item.id) || [])
    .map((row) => ({
      id: row.style_id,
      label: martialArtStyleLabel(row, props.enums),
    }))
    .filter((row) => row.label);
}

function toggleRow(item: MartialArtAddRow) {
  const next = new Set(selectedIds.value);
  if (next.has(item.id)) next.delete(item.id);
  else next.add(item.id);
  selectedIds.value = next;
}

function confirmSelection() {
  if (!selectedRows.value.length) return;
  emit("add", selectedRows.value.map((martialArt) => ({ martialArt })));
  open.value = false;
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-4xl"
      @open-auto-focus.prevent
    >
      <DialogHeader>
        <DialogTitle>添加武学</DialogTitle>
        <DialogDescription>点击武学卡片选择，确认后一次性加入</DialogDescription>
      </DialogHeader>

      <div class="grid gap-4">
        <WikiIndexHeader
          title="武学"
          :description="pending ? '读取中...' : `共 ${arts.length} 门武学，当前 ${filteredRows.length} 条`"
          search-id="save-edit-add-martial-art-search"
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
            role="button"
            :id="item.id"
            :name="martialArtName(item)"
            :type="martialArtTypeLabel(item, enums)"
            :type-id="item.type_id"
            :rarity-id="item.rarity_id"
            :rarity-tone-id="martialArtRarityToneId(item.rarity_id)"
            :sect-id="item.sect_id"
            :sect-label="martialArtSectLabel(item)"
            :styles="styleItems(item)"
            :selected="selectedIds.has(item.id)"
            :on-click="() => toggleRow(item)"
          />
        </WikiCardGrid>
      </div>

      <DialogFooter>
        <AppButton
          type="button"
          :disabled="!selectedRows.length"
          @click="confirmSelection"
        >
          <Check class="size-4" />
          确定<span v-if="selectedRows.length">（{{ selectedRows.length }}）</span>
        </AppButton>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
