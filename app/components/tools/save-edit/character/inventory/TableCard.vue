<script setup lang="ts">
import EditableTableCardHeader from "../EditableTableCardHeader.vue";
import EditableItemCard from "./EditableItemCard.vue";
import {
  fieldDraftKey,
  formatSaveValue,
  parseFieldDraftKey,
  type SaveEditDraft,
} from "~/components/tools/save-edit/model";
import { itemRarityLabel, itemTypeLabel } from "~/lib/wiki/item";
import { rarityCardClass } from "~/lib/rarity";
import type { BgDatabaseField, BgDatabaseTable, BgDatabaseValue } from "~/lib/bgdatabase";
import type { WikiEnums } from "~/lib/wiki/text";

type InventoryItemRow = {
  id: number;
  name: string | null;
  legacy_name: string | null;
  image_id: string | null;
  type_id: number | null;
  rarity_id: number | null;
  is_material: number | null;
};

const props = defineProps<{
  table: BgDatabaseTable;
  equippedUids?: {
    weapon1?: string;
    weapon2?: string;
    armor?: string;
  };
  draft: SaveEditDraft;
  enums: WikiEnums;
}>();

const emit = defineEmits<{
  updateField: [field: BgDatabaseField, value: string, rowIndex: number];
}>();

const { queryRows } = useWikiDb();
const page = ref(1);
const search = ref("");
const typeFilter = ref("all");
const rarityFilter = ref("all");
const materialFilter = ref("all");
const pageSize = 24;
const equipmentTypeIds = new Set([9, 10, 11, 12, 13, 14, 15]);
const equipmentStyleOptionIds = [1, 2, 3, 4, 6, 10, 11];

const { data: items } = await useAsyncData(
  "save-edit-inventory-items",
  () => queryRows<InventoryItemRow>(
    `SELECT id, name, legacy_name, image_id, type_id, rarity_id, is_material
     FROM items
     ORDER BY id`,
  ),
  { server: false },
);

function lookupName(value: string | null | undefined) {
  return String(value || "").trim().normalize("NFKC");
}

function addLookupName(map: Map<string, InventoryItemRow>, value: string | null | undefined, item: InventoryItemRow) {
  const key = lookupName(value);
  if (key && !map.has(key)) map.set(key, item);
}

const itemByLegacyName = computed(() => {
  const result = new Map<string, InventoryItemRow>();
  for (const item of items.value || []) addLookupName(result, item.legacy_name, item);
  return result;
});

const itemByName = computed(() => {
  const result = new Map<string, InventoryItemRow>();
  for (const item of items.value || []) {
    addLookupName(result, item.name, item);
  }
  return result;
});

const nameField = computed(() => props.table.fields.daojuname);
const uidField = computed(() => props.table.fields.uid);
const quantityField = computed(() => props.table.fields.qty);
const equippedField = computed(() => props.table.fields.iseuipped);
const rowIndexes = computed(() => Array.from({ length: props.table.rowCount }, (_, index) => index));
const parsedFields = computed(() =>
  props.table.fieldNames
    .map((fieldName) => props.table.fields[fieldName])
    .filter((field): field is BgDatabaseField => Boolean(field?.parsed)),
);
const dirtyRows = computed(() => {
  const result = new Set<number>();
  for (const key of Object.keys(props.draft)) {
    const parsed = parseFieldDraftKey(key);
    if (parsed?.tableIndex === props.table.tableIndex) result.add(parsed.rowIndex);
  }
  return result;
});
const equipmentUidSlots = [
  { key: "weapon1", label: "武器 1" },
  { key: "weapon2", label: "武器 2" },
  { key: "armor", label: "防具" },
];

function enumOptions(type: string) {
  return Object.entries(props.enums[type] || {})
    .filter(([, label]) => label)
    .map(([id, label]) => ({ value: id, label: label || id }));
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

const filteredRowIndexes = computed(() => {
  const query = search.value.trim().toLowerCase();

  return rowIndexes.value.filter((rowIndex) => {
    const name = fieldText(nameField.value, rowIndex);
    const uid = fieldText(uidField.value, rowIndex);
    const item = rowItem(rowIndex);
    if (query && ![name, uid, item?.name, item?.legacy_name, item ? String(item.id) : ""]
      .some((value) => String(value || "").toLowerCase().includes(query))) {
      return false;
    }
    if (typeFilter.value !== "all" && String(item?.type_id) !== typeFilter.value) return false;
    if (rarityFilter.value !== "all" && String(item?.rarity_id) !== rarityFilter.value) return false;
    if (materialFilter.value !== "all" && String(Number(item?.is_material || 0)) !== materialFilter.value) return false;
    return true;
  });
});
const totalRows = computed(() => filteredRowIndexes.value.length);
const matchedRows = computed(() => rowIndexes.value.filter((rowIndex) => rowItem(rowIndex)).length);
const pageCount = computed(() => Math.max(1, Math.ceil(totalRows.value / pageSize)));
const pagedRowIndexes = computed(() => {
  const start = (page.value - 1) * pageSize;
  return filteredRowIndexes.value.slice(start, start + pageSize);
});
const equippedRowIndexes = computed(() => {
  const used = new Set<number>();
  const rows = equipmentUidSlots.map((slot) => {
    const uid = props.equippedUids?.[slot.key as keyof NonNullable<typeof props.equippedUids>] || "";
    const rowIndex = uid ? findRowIndexByUid(uid, used) : null;
    if (rowIndex !== null) used.add(rowIndex);
    return { ...slot, rowIndex };
  });

  const fallbackRows = rowIndexes.value
    .filter((rowIndex) => !used.has(rowIndex))
    .filter((rowIndex) => isEquipmentItem(rowItem(rowIndex)))
    .filter((rowIndex) => saveBool(equippedField.value, rowIndex));

  let fallbackIndex = 0;
  return rows.map((row) => {
    if (row.rowIndex !== null) return row;
    const fallback = fallbackRows[fallbackIndex++];
    if (fallback !== undefined) used.add(fallback);
    return { ...row, rowIndex: fallback ?? null };
  });
});
const hasEquippedRows = computed(() => equippedRowIndexes.value.some((slot) => slot.rowIndex !== null));

watch(search, () => {
  page.value = 1;
});

watch([typeFilter, rarityFilter, materialFilter], () => {
  page.value = 1;
});

watch(pageCount, (count) => {
  if (page.value > count) page.value = count;
});

function updateFilter(id: string, value: string) {
  if (id === "item-type") typeFilter.value = value;
  if (id === "item-rarity") rarityFilter.value = value;
  if (id === "item-material") materialFilter.value = value;
}

function fieldValue(field: BgDatabaseField | undefined, rowIndex: number): BgDatabaseValue {
  if (!field) return null;
  const key = fieldDraftKey(field, rowIndex);
  return props.draft[key] ?? field.values[rowIndex] ?? null;
}

function fieldText(field: BgDatabaseField | undefined, rowIndex: number) {
  return formatSaveValue(fieldValue(field, rowIndex));
}

function initialFieldText(field: BgDatabaseField | undefined, rowIndex: number) {
  return formatSaveValue(field?.values[rowIndex]);
}

function rowItem(rowIndex: number) {
  const key = lookupName(fieldText(nameField.value, rowIndex));
  return itemByLegacyName.value.get(key) || itemByName.value.get(key) || null;
}

function isEquipmentItem(item: InventoryItemRow | null) {
  return equipmentTypeIds.has(Number(item?.type_id));
}

function findRowIndexByUid(uid: string, used: Set<number>) {
  const key = uid.trim();
  if (!key) return null;
  const rowIndex = rowIndexes.value.find((index) => !used.has(index) && fieldText(uidField.value, index).trim() === key);
  return rowIndex ?? null;
}

function saveBool(field: BgDatabaseField | undefined, rowIndex: number) {
  const value = fieldValue(field, rowIndex);
  if (typeof value === "boolean") return value;
  return ["1", "true", "True", "TRUE"].includes(formatSaveValue(value));
}

function equipmentStyleOptions() {
  return equipmentStyleOptionIds.map((id) => ({
    value: String(id),
    label: props.enums.LianSuo_FG?.[String(id)] || `风格 ${id}`,
  }));
}

function rowFields(rowIndex: number) {
  return parsedFields.value.map((field) => ({
    key: field.name,
    field,
    value: fieldText(field, rowIndex),
    initialValue: initialFieldText(field, rowIndex),
    enumOptions: field.name === "mingke_fg" ? equipmentStyleOptions() : [],
  }));
}

function rowDirty(rowIndex: number) {
  return dirtyRows.value.has(rowIndex);
}

const tableDirty = computed(() => dirtyRows.value.size > 0);

function resetRow(rowIndex: number) {
  for (const field of parsedFields.value) {
    const initialValue = initialFieldText(field, rowIndex);
    if (fieldDraftKey(field, rowIndex) in props.draft) emit("updateField", field, initialValue, rowIndex);
  }
}

function resetTable() {
  for (const rowIndex of rowIndexes.value) resetRow(rowIndex);
}

function updateQuantity(rowIndex: number, value: string) {
  if (quantityField.value) emit("updateField", quantityField.value, value, rowIndex);
}

function updateEquipmentField(rowIndex: number, field: BgDatabaseField, value: string) {
  emit("updateField", field, value, rowIndex);
}
</script>

<template>
  <AppCard>
    <EditableTableCardHeader
      title="行囊"
      :description="`${table.rowCount} 行，已映射 ${matchedRows} 条，当前 ${totalRows} 条`"
      :dirty="tableDirty"
      @reset="resetTable"
    />
    <AppCardContent class="grid gap-4">
      <div v-if="equippedUids || hasEquippedRows" class="grid gap-3">
        <div class="text-sm font-medium">已装备</div>
        <div class="grid gap-3 lg:grid-cols-3">
          <template v-for="slot in equippedRowIndexes" :key="slot.key">
            <EditableItemCard
              v-if="slot.rowIndex !== null"
              :row-index="slot.rowIndex"
              :item-name="fieldText(nameField, slot.rowIndex)"
              :uid="fieldText(uidField, slot.rowIndex)"
              :quantity="fieldText(quantityField, slot.rowIndex)"
              :initial-quantity="initialFieldText(quantityField, slot.rowIndex)"
              :item="rowItem(slot.rowIndex)"
              :is-equipment="isEquipmentItem(rowItem(slot.rowIndex))"
              :row-fields="rowFields(slot.rowIndex)"
              :type-label="slot.label"
              :rarity-label="rowItem(slot.rowIndex) ? itemRarityLabel(rowItem(slot.rowIndex)!, enums) : '未知'"
              :rarity-class="rarityCardClass(rowItem(slot.rowIndex)?.rarity_id ?? null)"
              :dirty="rowDirty(slot.rowIndex)"
              @update-quantity="updateQuantity(slot.rowIndex, $event)"
              @update-equipment-field="updateEquipmentField(slot.rowIndex, $event.field, $event.value)"
              @reset="resetRow(slot.rowIndex)"
            />
            <div v-else class="grid min-h-24 place-items-center rounded-md border border-dashed px-3 py-6 text-sm text-muted-foreground">
              {{ slot.label }}：未装备
            </div>
          </template>
        </div>
      </div>

      <div class="grid gap-4 grid-cols-4">
        <div class="grid gap-2">
          <Label for="save-edit-inventory-search">搜索</Label>
          <AppInput
            id="save-edit-inventory-search"
            v-model="search"
            type="search"
            placeholder="搜索道具"
          />
        </div>

        <div v-for="filter in indexFilters" :key="filter.id" class="grid gap-2">
          <Label :for="filter.id">{{ filter.label }}</Label>
          <Select
            :model-value="filter.modelValue"
            @update:model-value="updateFilter(filter.id, String($event))"
          >
            <AppSelectTrigger :id="filter.id" class="w-full">
              <SelectValue :placeholder="filter.placeholder" />
            </AppSelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {{ filter.allLabel }}
              </SelectItem>
              <SelectItem
                v-for="option in filter.options"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div class="flex justify-end">
        <Pagination
          v-slot="{ page: currentPage }"
          v-model:page="page"
          :items-per-page="pageSize"
          :sibling-count="1"
          :total="totalRows"
          show-edges
        >
          <PaginationContent v-slot="{ items: paginationItems }">
            <PaginationFirst />
            <PaginationPrevious />
            <template v-for="(item, index) in paginationItems" :key="index">
              <PaginationItem
                v-if="item.type === 'page'"
                :is-active="item.value === currentPage"
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
      </div>

      <div v-if="!pagedRowIndexes.length" class="rounded-md border px-3 py-8 text-center text-sm text-muted-foreground">
        没有匹配的行囊物品
      </div>

      <div v-else class="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <EditableItemCard
          v-for="rowIndex in pagedRowIndexes"
          :key="rowIndex"
          :row-index="rowIndex"
          :item-name="fieldText(nameField, rowIndex)"
          :uid="fieldText(uidField, rowIndex)"
          :quantity="fieldText(quantityField, rowIndex)"
          :initial-quantity="initialFieldText(quantityField, rowIndex)"
          :item="rowItem(rowIndex)"
          :is-equipment="isEquipmentItem(rowItem(rowIndex))"
          :row-fields="rowFields(rowIndex)"
          :type-label="rowItem(rowIndex) ? itemTypeLabel(rowItem(rowIndex)!, enums) : '未匹配'"
          :rarity-label="rowItem(rowIndex) ? itemRarityLabel(rowItem(rowIndex)!, enums) : '未知'"
          :rarity-class="rarityCardClass(rowItem(rowIndex)?.rarity_id ?? null)"
          :dirty="rowDirty(rowIndex)"
          @update-quantity="updateQuantity(rowIndex, $event)"
          @update-equipment-field="updateEquipmentField(rowIndex, $event.field, $event.value)"
          @reset="resetRow(rowIndex)"
        />
      </div>
    </AppCardContent>
  </AppCard>
</template>
