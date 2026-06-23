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
import {
  type ItemInventoryRecipeRow,
  itemName,
  itemTypeLabel,
} from "~/lib/wiki/item";
import ItemCard from "~/components/wiki/item/Card.vue";
import WikiCardGrid from "~/components/wiki/WikiCardGrid.vue";
import WikiIndexHeader from "~/components/wiki/WikiIndexHeader.vue";
import type { WikiEnums } from "~/lib/wiki/text";

export type InventoryAddItemRow = ItemInventoryRecipeRow;

export type InventoryAddItemPayload = {
  item: InventoryAddItemRow;
};

const props = defineProps<{
  enums: WikiEnums;
}>();

const emit = defineEmits<{
  add: [payloads: InventoryAddItemPayload[]];
}>();

const open = defineModel<boolean>("open", { required: true });
const { queryRows } = useWikiDb();
const search = ref("");
const typeFilter = ref("all");
const rarityFilter = ref("all");
const materialFilter = ref("all");
const currentPage = ref(1);
const selectedItemIds = ref<Set<number>>(new Set());
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

const { data: items, pending, error } = useLazyAsyncData(
  "save-edit-inventory-add-items",
  () => queryRows<InventoryAddItemRow>(
    `SELECT item.id, item.name, item.legacy_name, item.image_id,
      item.type_id, item.rarity_id, item.is_material,
      template.template_name, template.showname,
      template.att AS template_att, template.def AS template_def, template.hp AS template_hp,
      template.weight AS template_weight, template.length AS template_length,
      template.zhushuxing AS template_zhushuxing,
      template.lvli, template.gengu, template.tipo, template.shenfa,
      template.showlv, template.hidelv, template.mingkecitiao, template.mingke_fg,
      template.mingke_lvli, template.mingke_gengu, template.mingke_tipo, template.mingke_shenfa,
      recipe.item_id AS recipe_item_id,
      recipe.quantity AS recipe_quantity,
      recipe.length_min, recipe.length_max, recipe.weight_min, recipe.weight_max,
      recipe.att_min, recipe.att_max, recipe.def_min, recipe.def_max, recipe.hp_min, recipe.hp_max,
      recipe.main_attribute_min, recipe.main_attribute_max,
      recipe.bonus_value_min, recipe.bonus_value_max,
      recipe.fixed_strength, recipe.fixed_constitution, recipe.fixed_physique, recipe.fixed_agility
     FROM items item
     LEFT JOIN item_inventory_templates template ON template.item_id = item.id
     LEFT JOIN item_recipes recipe ON recipe.item_id = item.id
     ORDER BY item.id`,
  ),
  { server: false },
);

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
    options: typeOptions.value,
  },
  {
    id: "item-rarity",
    label: "稀有度",
    modelValue: rarityFilter.value,
    placeholder: "全部稀有度",
    allLabel: "全部稀有度",
    options: rarityOptions.value,
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
const filteredItems = computed(() => {
  const keyword = search.value.trim().toLowerCase();
  return (items.value || []).filter((item) => {
    if (keyword && !itemName(item).toLowerCase().includes(keyword)) return false;
    if (typeFilter.value !== "all" && String(item.type_id) !== typeFilter.value) return false;
    if (rarityFilter.value !== "all" && String(item.rarity_id) !== rarityFilter.value) return false;
    if (materialFilter.value !== "all" && String(Number(item.is_material)) !== materialFilter.value) return false;
    return true;
  });
});
const pagedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredItems.value.slice(start, start + pageSize.value);
});
const selectedItems = computed(() => {
  const ids = selectedItemIds.value;
  return (items.value || []).filter((item) => ids.has(item.id));
});
const pageCount = computed(() => Math.max(1, Math.ceil(filteredItems.value.length / pageSize.value)));
watch(open, (value) => {
  if (!value) return;
  currentPage.value = 1;
  selectedItemIds.value = new Set();
});

watch([search, typeFilter, rarityFilter, materialFilter], () => {
  currentPage.value = 1;
});

watch(pageCount, (count) => {
  if (currentPage.value > count) currentPage.value = count;
});

function enumOptions(type: string) {
  return Object.entries(props.enums[type] || {})
    .filter(([, label]) => label)
    .map(([id, label]) => ({ value: id, label: label || id }));
}

function updateFilter(id: string, value: string) {
  if (id === "item-type") typeFilter.value = value;
  if (id === "item-rarity") rarityFilter.value = value;
  if (id === "item-material") materialFilter.value = value;
}

function toggleItem(item: InventoryAddItemRow) {
  const next = new Set(selectedItemIds.value);
  if (next.has(item.id)) next.delete(item.id);
  else next.add(item.id);
  selectedItemIds.value = next;
}

function confirmSelection() {
  if (!selectedItems.value.length) return;
  emit("add", selectedItems.value.map((item) => ({ item })));
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
        <DialogTitle>添加物品</DialogTitle>
        <DialogDescription>点击道具卡片选择，确认后一次性加入行囊</DialogDescription>
      </DialogHeader>

      <div class="grid gap-4">
        <WikiIndexHeader
          title="道具"
          :description="pending ? '读取中...' : `共 ${items?.length || 0} 个道具，当前 ${filteredItems.length} 条`"
          search-id="save-edit-add-item-search"
          search-placeholder="搜索道具"
          :search="search"
          :filters="indexFilters"
          @update:search="search = $event"
          @update:filter="updateFilter"
        />

        <WikiCardGrid
          v-model:page="currentPage"
          :error="error"
          :rows="pagedItems"
          :total="filteredItems.length"
          :page-size="pageSize"
          empty-label="没有匹配的道具"
        >
          <ItemCard
            v-for="item in pagedItems"
            :key="item.id"
            role="button"
            :id="item.id"
            :name="itemName(item)"
            :image-id="item.image_id"
            :description="itemTypeLabel(item, enums)"
            :rarity-id="item.rarity_id"
            :selected="selectedItemIds.has(item.id)"
            :on-click="() => toggleItem(item)"
          />
        </WikiCardGrid>
      </div>

      <DialogFooter>
        <AppButton
          type="button"
          :disabled="!selectedItems.length"
          @click="confirmSelection"
        >
          <Check class="size-4" />
          确定<span v-if="selectedItems.length">（{{ selectedItems.length }}）</span>
        </AppButton>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
