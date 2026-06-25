<script setup lang="ts">
import { Plus, Trash2 } from "@lucide/vue";
import AddInventoryItemDialog, { type InventoryAddItemPayload } from "./AddInventoryItemDialog.vue";
import EditableTableCardHeader from "../EditableTableCardHeader.vue";
import EditableItemCard from "./EditableItemCard.vue";
import {
  formatSaveValue,
  type SaveEditDraftResetTarget,
  type SaveEditRowDraftOperation,
  type SaveEditDraft,
  type SaveEditTableRowView,
  createXingNangRow,
} from "~/lib/save-edit";
import { itemRarityLabel, itemTypeLabel } from "~/lib/wiki/item";
import { rarityCardClass } from "~/lib/rarity";
import type { BgDatabaseField, BgDatabaseTable, BgDatabaseValue } from "~/lib/save-edit";
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

type InventoryDisplayRow = SaveEditTableRowView;
type EquipmentSlot = {
  key: string;
  label: string;
};

const props = withDefaults(defineProps<{
  table: BgDatabaseTable;
  ownerName?: string;
  ownerLabel?: string;
  equippedUids?: Record<string, string | undefined>;
  equipmentSlots?: EquipmentSlot[];
  draft: SaveEditDraft;
  enums: WikiEnums;
}>(), {
  ownerName: "ZhuJue",
  ownerLabel: "主角",
  equippedUids: () => ({}),
  equipmentSlots: () => [
    { key: "weapon1", label: "武器 1" },
    { key: "weapon2", label: "武器 2" },
    { key: "armor", label: "防具" },
  ],
});

const emit = defineEmits<{
  rowOperation: [operation: SaveEditRowDraftOperation];
  rowOperations: [operations: SaveEditRowDraftOperation[]];
  resetDraft: [table: BgDatabaseTable, target: SaveEditDraftResetTarget];
}>();

const { queryRows } = useWikiDb();
const { findInventoryItemSource } = useItemData();
const page = ref(1);
const search = ref("");
const typeFilter = ref("all");
const rarityFilter = ref("all");
const materialFilter = ref("all");
const addDialogOpen = ref(false);
const deleteMode = ref(false);
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
const ownerField = computed(() => props.table.fields.juesename);
const uidField = computed(() => props.table.fields.uid);
const quantityField = computed(() => props.table.fields.qty);
const equippedField = computed(() => props.table.fields.iseuipped);
const tableIndex = useSaveEditTableViewIndex(toRef(props, "table"), toRef(props, "draft"));
const ownerRowIndexes = computed(() =>
  ownerField.value ? tableIndex.rowIndexesByInitialField(ownerField.value.name, props.ownerName) : [],
);
const parsedFields = computed(() =>
  props.table.fieldNames
    .map((fieldName) => props.table.fields[fieldName])
    .filter((field): field is BgDatabaseField => Boolean(field?.parsed)),
);
const dirtyRows = computed(() => {
  return tableIndex.dirtyRows.value;
});
const deletedRows = computed(() => tableIndex.deletedRows.value);

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

const insertedRows = computed(() => tableIndex.insertedRows.value);
const filteredRowIndexes = computed(() => {
  const query = search.value.trim().toLowerCase();

  return ownerRowIndexes.value.filter((rowIndex) => {
    if (deletedRows.value.has(rowIndex)) return false;
    const name = initialFieldText(nameField.value, rowIndex);
    const uid = initialFieldText(uidField.value, rowIndex);
    const item = initialRowItem(rowIndex);
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
const filteredInventoryEntries = computed<Array<InventoryDisplayRow | number>>(() => [
  ...insertedRows.value.filter(insertMatchesFilters),
  ...filteredRowIndexes.value,
]);
const totalRows = computed(() => filteredInventoryEntries.value.length);
const matchedRows = computed(() =>
  ownerRowIndexes.value.filter((rowIndex) => !deletedRows.value.has(rowIndex) && rowItem(rowIndex)).length,
);
const pageCount = computed(() => Math.max(1, Math.ceil(totalRows.value / pageSize)));
const pagedInventoryRows = computed<InventoryDisplayRow[]>(() => {
  const start = (page.value - 1) * pageSize;
  return filteredInventoryEntries.value
    .slice(start, start + pageSize)
    .map((entry) => typeof entry === "number" ? tableIndex.row(entry) : entry);
});
const equippedRowIndexes = computed(() => {
  const used = new Set<number>();
  const rows = props.equipmentSlots.map((slot) => {
    const uid = props.equippedUids[slot.key] || "";
    const rowIndex = uid ? findRowIndexByUid(uid, used) : null;
    if (rowIndex !== null) used.add(rowIndex);
    return { ...slot, rowIndex };
  });

  const fallbackRows = ownerRowIndexes.value
    .filter((rowIndex) => !used.has(rowIndex) && !deletedRows.value.has(rowIndex))
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
const hasExplicitEquippedUids = computed(() => Object.values(props.equippedUids).some((uid) => Boolean(uid)));
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
  return tableIndex.value(field, rowIndex);
}

function fieldText(field: BgDatabaseField | undefined, rowIndex: number) {
  return formatSaveValue(fieldValue(field, rowIndex));
}

function initialFieldText(field: BgDatabaseField | undefined, rowIndex: number) {
  return tableIndex.initialText(field, rowIndex);
}

function rowItem(rowIndex: number) {
  const key = lookupName(fieldText(nameField.value, rowIndex));
  return itemByLegacyName.value.get(key) || itemByName.value.get(key) || null;
}

function initialRowItem(rowIndex: number) {
  const key = lookupName(initialFieldText(nameField.value, rowIndex));
  return itemByLegacyName.value.get(key) || itemByName.value.get(key) || null;
}

function insertMatchesFilters(row: InventoryDisplayRow) {
  if ((row.values.juesename || row.initialValues.juesename || props.ownerName) !== props.ownerName) return false;
  const query = search.value.trim().toLowerCase();
  const item = displayItem(row);
  const name = displayItemName(row);
  if (query && ![name, row.values.uid, item?.name, item?.legacy_name, item ? String(item.id) : ""]
    .some((value) => String(value || "").toLowerCase().includes(query))) {
    return false;
  }
  if (typeFilter.value !== "all" && String(row.values.type || item?.type_id) !== typeFilter.value) return false;
  if (rarityFilter.value !== "all" && String(row.values.rare || item?.rarity_id) !== rarityFilter.value) return false;
  if (materialFilter.value !== "all" && String(Number(item?.is_material || 0)) !== materialFilter.value) return false;
  return true;
}

function isEquipmentItem(item: InventoryItemRow | null) {
  return equipmentTypeIds.has(Number(item?.type_id));
}

function findRowIndexByUid(uid: string, used: Set<number>) {
  const key = uid.trim();
  if (!key) return null;
  const rowIndex = ownerRowIndexes.value.find((index) =>
    !used.has(index) && !deletedRows.value.has(index) && fieldText(uidField.value, index).trim() === key,
  );
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
    ...tableIndex.field(field, rowIndex),
    key: field.name,
    field,
    value: fieldText(field, rowIndex),
    initialValue: initialFieldText(field, rowIndex),
    enumOptions: field.name === "rare"
      ? enumOptions("ItemRare")
      : field.name === "mingke_fg"
        ? equipmentStyleOptions()
        : [],
  }));
}

function rowDirty(rowIndex: number) {
  return dirtyRows.value.has(rowIndex);
}

const tableDirty = computed(() => tableIndex.dirty.value);

function resetRow(rowIndex: number) {
  emit("resetDraft", props.table, { type: "row", rowIndex });
}

function deleteRow(rowIndex: number) {
  emit("rowOperation", {
    type: "delete",
    target: { type: "row", rowIndex },
  });
}

function resetTable() {
  emit("resetDraft", props.table, { type: "table" });
}

function updateQuantity(rowIndex: number, value: string) {
  if (quantityField.value) {
    emit("rowOperation", {
      type: "update",
      target: { type: "row", rowIndex },
      values: { [quantityField.value.name]: value },
    });
  }
}

function updateEquipmentField(rowIndex: number, field: BgDatabaseField, value: string) {
  emit("rowOperation", {
    type: "update",
    target: { type: "row", rowIndex },
    values: { [field.name]: value },
  });
}

async function addPendingItems(payloads: InventoryAddItemPayload[]) {
  const rows = await Promise.all(payloads.map((payload) =>
    createXingNangRow({ id: payload.item.id }, { findInventoryItem: findInventoryItemSource }, { owner: props.ownerName }),
  ));
  const operations = rows.filter((values): values is Record<string, string> => Boolean(values)).map((values): SaveEditRowDraftOperation => {
    const filteredValues = filterInsertValues(values);
    return {
      type: "insert",
      tempId: createTempRowId(),
      initialValues: filteredValues,
      values: filteredValues,
    };
  });
  if (operations.length) emit("rowOperations", operations);
  page.value = 1;
}

function rowViewItem(row: InventoryDisplayRow) {
  const key = lookupName(row.values.daojuname);
  return itemByLegacyName.value.get(key) || itemByName.value.get(key) || null;
}

function rowViewFields(row: InventoryDisplayRow) {
  return parsedFields.value.map((field) => ({
    key: field.name,
    field,
    value: row.values[field.name] ?? "",
    initialValue: row.initialValues[field.name] ?? "",
    dirty: row.dirtyFields.has(field.name),
    enumOptions: field.name === "rare"
      ? enumOptions("ItemRare")
      : field.name === "mingke_fg"
        ? equipmentStyleOptions()
        : [],
  }));
}

function displayRowKey(row: InventoryDisplayRow) {
  return row.key;
}

function displayRowIndex(row: InventoryDisplayRow, index: number) {
  return row.rowIndex ?? props.table.rowCount + index;
}

function displayItemName(row: InventoryDisplayRow) {
  return displayItem(row)?.name || row.values.showname || row.values.daojuname || row.values.name || "待添加物品";
}

function displayUid(row: InventoryDisplayRow) {
  return row.values.uid || "";
}

function displayQuantity(row: InventoryDisplayRow) {
  return row.values.qty || "1";
}

function displayInitialQuantity(row: InventoryDisplayRow) {
  return row.initialValues.qty || "1";
}

function displayItem(row: InventoryDisplayRow) {
  if (row.rowIndex !== null && row.status !== "inserted") return rowItem(row.rowIndex);
  return rowViewItem(row);
}

function displayIsEquipment(row: InventoryDisplayRow) {
  return isEquipmentItem(displayItem(row));
}

function displayRowFields(row: InventoryDisplayRow) {
  return rowViewFields(row);
}

function displayTypeLabel(row: InventoryDisplayRow) {
  const item = displayItem(row);
  if (item) return itemTypeLabel(item, props.enums);
  if (row.status === "inserted") return itemTypeLabel({ type_id: Number(row.values.type || 0) }, props.enums);
  return "未匹配";
}

function displayRarityLabel(row: InventoryDisplayRow) {
  const item = displayItem(row);
  if (item) return itemRarityLabel(item, props.enums);
  if (row.status === "inserted") return itemRarityLabel({ rarity_id: Number(row.values.rare || 0) }, props.enums);
  return "未知";
}

function displayRarityClass(row: InventoryDisplayRow) {
  const item = displayItem(row);
  if (item) return rarityCardClass(item.rarity_id ?? null);
  if (row.status === "inserted") return rarityCardClass(Number(row.values.rare || 0));
  return rarityCardClass(null);
}

function displayDirty(row: InventoryDisplayRow) {
  return row.dirtyFields.size > 0;
}

function updateDisplayQuantity(row: InventoryDisplayRow, value: string) {
  emit("rowOperation", {
    type: "update",
    target: row.target,
    values: { qty: value },
  });
}

function updateDisplayEquipmentField(row: InventoryDisplayRow, field: BgDatabaseField, value: string) {
  emit("rowOperation", {
    type: "update",
    target: row.target,
    values: { [field.name]: value },
  });
}

function resetDisplayRow(row: InventoryDisplayRow) {
  emit("resetDraft", props.table, row.target);
}

function deleteDisplayRow(row: InventoryDisplayRow) {
  emit("rowOperation", {
    type: "delete",
    target: row.target,
  });
}

function deleteCurrentViewRows() {
  const operations = filteredInventoryEntries.value.map((entry): SaveEditRowDraftOperation => ({
    type: "delete",
    target: typeof entry === "number" ? { type: "row", rowIndex: entry } : entry.target,
  }));
  if (operations.length) emit("rowOperations", operations);
}

function toggleDeleteMode() {
  deleteMode.value = !deleteMode.value;
}

function createTempRowId() {
  if (import.meta.client && globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `insert-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function filterInsertValues(values: Record<string, string>) {
  return Object.fromEntries(Object.entries(values).filter(([fieldName]) => Boolean(props.table.fields[fieldName])));
}
</script>

<template>
  <AppCard>
    <EditableTableCardHeader
      title="行囊"
      :description="`${ownerLabel}行囊 ${ownerRowIndexes.length} 行，已映射 ${matchedRows} 条，当前 ${totalRows} 条`"
      :dirty="tableDirty"
      @reset="resetTable"
    />
    <AppCardContent class="grid gap-4">
      <div v-if="hasExplicitEquippedUids || hasEquippedRows" class="grid gap-3">
        <div class="grid gap-3 lg:grid-cols-3">
          <template v-for="slot in equippedRowIndexes" :key="slot.key">
            <EditableItemCard
              v-if="slot.rowIndex !== null"
              :row-index="slot.rowIndex"
              :item-name="fieldText(nameField, slot.rowIndex)"
              :uid="fieldText(uidField, slot.rowIndex)"
              :quantity="fieldText(quantityField, slot.rowIndex)"
              :initial-quantity="initialFieldText(quantityField, slot.rowIndex)"
              :quantity-dirty="fieldText(quantityField, slot.rowIndex) !== initialFieldText(quantityField, slot.rowIndex)"
              :quantity-reset-value="initialFieldText(quantityField, slot.rowIndex)"
              :item="rowItem(slot.rowIndex)"
              :is-equipment="isEquipmentItem(rowItem(slot.rowIndex))"
              :row-fields="rowFields(slot.rowIndex)"
              :type-label="slot.label"
              :rarity-label="rowItem(slot.rowIndex) ? itemRarityLabel(rowItem(slot.rowIndex)!, enums) : '未知'"
              :rarity-class="rarityCardClass(rowItem(slot.rowIndex)?.rarity_id ?? null)"
              :dirty="rowDirty(slot.rowIndex)"
              :delete-mode="deleteMode"
              @update-quantity="updateQuantity(slot.rowIndex, $event)"
              @update-equipment-field="updateEquipmentField(slot.rowIndex, $event.field, $event.value)"
              @reset="resetRow(slot.rowIndex)"
              @delete="deleteRow(slot.rowIndex)"
            />
            <div v-else class="grid min-h-24 place-items-center rounded-md border border-dashed px-3 py-6 text-sm text-muted-foreground">
              {{ slot.label }}：未装备
            </div>
          </template>
        </div>
      </div>

      <div class="grid gap-4 grid-cols-4">
        <AppFieldStack label="搜索" label-for="save-edit-inventory-search">
          <AppInput
            id="save-edit-inventory-search"
            v-model="search"
            type="search"
            placeholder="搜索道具"
          />
        </AppFieldStack>

        <AppFieldStack
          v-for="filter in indexFilters"
          :key="filter.id"
          :label="filter.label"
          :label-for="filter.id"
        >
          <Select
            :model-value="filter.modelValue"
            @update:model-value="updateFilter(filter.id, String($event))"
          >
            <AppSelectTrigger :id="filter.id" class="w-full">
              <SelectValue :placeholder="filter.placeholder" />
            </AppSelectTrigger>
            <AppSelectContent>
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
            </AppSelectContent>
          </Select>
        </AppFieldStack>
      </div>

      <div class="grid w-full grid-cols-4 gap-2 sm:ml-auto sm:w-[28rem]">
        <AppButton type="button" class="col-span-2 w-full" @click="addDialogOpen = true">
          <Plus class="size-4" />
          添加物品
        </AppButton>
        <AppButton
          type="button"
          class="w-full"
          :variant="deleteMode ? 'destructive' : 'outline'"
          :aria-pressed="deleteMode"
          @click="toggleDeleteMode"
        >
          <Trash2 class="size-4" />
          删除物品
        </AppButton>
        <AppButton
          type="button"
          variant="destructive"
          class="w-full"
          :disabled="!deleteMode || !totalRows"
          @click="deleteCurrentViewRows"
        >
          <Trash2 class="size-4" />
          全部删除
        </AppButton>
      </div>

      <div class="flex justify-center">
        <AppPagination
          v-model:page="page"
          :total="totalRows"
          :page-size="pageSize"
        />
      </div>

      <div v-if="!pagedInventoryRows.length" class="rounded-md border px-3 py-8 text-center text-sm text-muted-foreground">
        没有匹配的行囊物品
      </div>

      <div v-else class="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <EditableItemCard
          v-for="(row, index) in pagedInventoryRows"
          :key="displayRowKey(row)"
          :row-index="displayRowIndex(row, index)"
          :item-name="displayItemName(row)"
          :uid="displayUid(row)"
          :quantity="displayQuantity(row)"
          :initial-quantity="displayInitialQuantity(row)"
          :quantity-dirty="row.dirtyFields.has('qty')"
          :quantity-reset-value="displayInitialQuantity(row)"
          :item="displayItem(row)"
          :is-equipment="displayIsEquipment(row)"
          :row-fields="displayRowFields(row)"
          :type-label="displayTypeLabel(row)"
          :rarity-label="displayRarityLabel(row)"
          :rarity-class="displayRarityClass(row)"
          :dirty="displayDirty(row)"
          :delete-mode="deleteMode"
          @update-quantity="updateDisplayQuantity(row, $event)"
          @update-equipment-field="updateDisplayEquipmentField(row, $event.field, $event.value)"
          @reset="resetDisplayRow(row)"
          @delete="deleteDisplayRow(row)"
        />
      </div>
    </AppCardContent>

    <AddInventoryItemDialog
      v-model:open="addDialogOpen"
      :enums="enums"
      @add="addPendingItems"
    />
  </AppCard>
</template>
