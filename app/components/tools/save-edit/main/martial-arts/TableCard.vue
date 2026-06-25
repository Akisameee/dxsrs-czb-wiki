<script setup lang="ts">
import { Plus, Trash2 } from "@lucide/vue";
import AddMartialArtDialog, { type MartialArtAddPayload } from "./AddMartialArtDialog.vue";
import EditableTableCardHeader from "../EditableTableCardHeader.vue";
import EditDialog, { type MartialLevelRow, type MartialSaveField } from "./EditDialog.vue";
import MartialArtCard from "~/components/wiki/martial-art/Card.vue";
import SaveEditDeleteButton from "~/components/tools/save-edit/SaveEditDeleteButton.vue";
import SaveEditEditButton from "~/components/tools/save-edit/SaveEditEditButton.vue";
import SaveEditResettableFrame from "~/components/tools/save-edit/SaveEditResettableFrame.vue";
import {
  selectSaveEditFieldView,
  selectSaveEditTableView,
  saveEditEnumOptions,
  selectSaveEditTableRow,
  type SaveEditDraft,
  type SaveEditDraftResetOperation,
  type SaveEditRowDraftOperation,
  type SaveEditRowDraftTarget,
  type SaveEditTableRowView,
} from "~/lib/save-edit";
import {
  martialArtRarityToneId,
} from "~/lib/wiki/martial-art";
import { enumLabel } from "~/lib/utils";
import type { BgDatabaseField, BgDatabaseTable } from "~/lib/save-edit";
import type { WikiEnums } from "~/lib/wiki/text";

type MartialArtRow = {
  id: number;
  name: string | null;
  legacy_name: string | null;
  sect_id: number | null;
  sect_name: string | null;
  type_id: number | null;
  rarity_id: number | null;
};

type MartialDisplayRow = {
  key: string;
  target: SaveEditRowDraftTarget;
  rowIndex: number | null;
  name: string;
  martialArt: MartialArtRow | null;
  view: SaveEditTableRowView;
};

type CustomEffectTargetRow = {
  effect_id: number;
  target_id: number;
};

const props = withDefaults(defineProps<{
  jsTable: BgDatabaseTable;
  baseTable: BgDatabaseTable;
  detailTable: BgDatabaseTable;
  draft: SaveEditDraft;
  enums: WikiEnums;
  ownerName?: string;
  ownerLabel?: string;
}>(), {
  ownerName: "ZhuJue",
  ownerLabel: "主角",
});

const emit = defineEmits<{
  updateField: [field: BgDatabaseField, value: string, rowIndex: number];
  rowOperation: [table: BgDatabaseTable, operation: SaveEditRowDraftOperation];
  rowOperations: [table: BgDatabaseTable, operations: SaveEditRowDraftOperation[]];
  resetDrafts: [operations: SaveEditDraftResetOperation[]];
}>();

const { queryRows } = useWikiDb();
const openRow = ref<string | null>(null);
const addDialogOpen = ref(false);
const deleteMode = ref(false);
let martialEntityNameCounter = 0;

const { data: martialArts } = await useAsyncData(
  "save-edit-martial-art-lookup",
  () => queryRows<MartialArtRow>(
    `SELECT art.id, art.name, art.legacy_name, art.sect_id, sect.name AS sect_name,
      art.type_id, art.rarity_id
     FROM martial_arts art
     LEFT JOIN sects sect ON sect.id = art.sect_id
     ORDER BY art.id`,
  ),
  { server: false },
);

const { data: effectTargets } = await useAsyncData(
  "save-edit-martial-effect-targets",
  () => queryRows<CustomEffectTargetRow>(
    `SELECT effect_id, target_id
     FROM custom_martial_effect_rates
     ORDER BY effect_id`,
  ),
  { server: false },
);

const artByName = computed(() => {
  const result = new Map<string, MartialArtRow>();
  for (const art of martialArts.value || []) {
    addName(result, art.name, art);
    addName(result, art.legacy_name, art);
  }
  return result;
});

const buffTargetsByEffect = computed(() => {
  const result: Record<string, string> = {};
  for (const row of effectTargets.value || []) {
    const effectId = String(row.effect_id);
    if (!(effectId in result)) result[effectId] = String(row.target_id);
  }
  return result;
});

const jsTableView = computed(() => selectSaveEditTableView(props.jsTable, props.draft));
const insertedRows = computed(() => jsTableView.value.insertedRows);
const allOwnerRows = computed<MartialDisplayRow[]>(() => [
  ...insertedRows.value.filter((row) => (row.values.juesename || row.initialValues.juesename || props.ownerName) === props.ownerName),
  ...Array.from({ length: props.jsTable.rowCount }, (_, rowIndex) => rowIndex)
    .filter((rowIndex) => initialFieldText(props.jsTable.fields.juesename, rowIndex) === props.ownerName)
    .map((rowIndex) => selectSaveEditTableRow(props.jsTable, props.draft, rowIndex)),
].map((view) => {
  const name = view.values.wugongname || view.initialValues.wugongname || "";
  return {
    key: view.key,
    target: view.target,
    rowIndex: view.rowIndex,
    name,
    martialArt: artByName.value.get(lookupKey(name)) || null,
    view,
  };
}));
const ownerRows = computed(() => allOwnerRows.value.filter((row) => row.view.status !== "deleted"));

const tableDirty = computed(() => allOwnerRows.value.some((row) => martialTableRowDirty(row)));

const baseRowByName = computed(() => {
  const result = new Map<string, number>();
  const field = props.baseTable.fields.name;
  for (let rowIndex = 0; rowIndex < props.baseTable.rowCount; rowIndex += 1) {
    const key = lookupKey(initialFieldText(field, rowIndex));
    if (key && !result.has(key)) result.set(key, rowIndex);
  }
  return result;
});

const detailRowByNameAndLevel = computed(() => {
  const result = new Map<string, number>();
  const nameField = props.detailTable.fields.wugongname;
  const levelField = props.detailTable.fields.lv;
  for (let rowIndex = 0; rowIndex < props.detailTable.rowCount; rowIndex += 1) {
    const name = lookupKey(initialFieldText(nameField, rowIndex));
    const level = Number(initialFieldText(levelField, rowIndex));
    if (!name || !Number.isFinite(level)) continue;
    const key = detailLookupKey(name, level);
    if (!result.has(key)) result.set(key, rowIndex);
  }
  return result;
});

const dirtyRowsByTableIndex = computed(() => {
  const result = new Map<number, Set<number>>();
  for (const table of [props.jsTable, props.baseTable, props.detailTable]) {
    result.set(table.tableIndex, selectSaveEditTableView(table, props.draft).dirtyRows);
  }
  return result;
});

function lookupKey(value: string | null | undefined) {
  return String(value || "").trim().normalize("NFKC");
}

function detailLookupKey(name: string, level: number) {
  return `${name}\u0000${level}`;
}

function addName(map: Map<string, MartialArtRow>, value: string | null | undefined, art: MartialArtRow) {
  const key = lookupKey(value);
  if (key && !map.has(key)) map.set(key, art);
}

function fieldText(field: BgDatabaseField | undefined, rowIndex: number) {
  return selectSaveEditFieldView(field, rowIndex, props.draft).text;
}

function initialFieldText(field: BgDatabaseField | undefined, rowIndex: number) {
  return selectSaveEditFieldView(field, rowIndex, props.draft).initialText;
}

function fieldPayload(
  table: BgDatabaseTable,
  fieldName: string,
  target: SaveEditRowDraftTarget,
  rowIndex: number | null,
  view?: SaveEditTableRowView,
): MartialSaveField | null {
  const field = table.fields[fieldName];
  if (!field?.parsed) return null;
  const initialValue = view ? view.initialValues[fieldName] ?? "" : initialFieldText(field, rowIndex ?? 0);
  const value = view ? view.values[fieldName] ?? "" : fieldText(field, rowIndex ?? 0);
  const fieldView = selectSaveEditFieldView(field, rowIndex ?? 0, props.draft);
  return {
    key: fieldName,
    label: fieldName,
    field,
    target,
    rowIndex,
    value,
    initialValue,
    dirty: view ? view.dirtyFields.has(fieldName) : fieldView.dirty,
    enumOptions: saveEditEnumOptions(props.enums, table.name, fieldName).map((option) => ({
      value: option.id,
      label: option.label,
    })),
  };
}

function jsFields(row: MartialDisplayRow) {
  return [
    "currentlv",
    "maxlv",
    "currentexp",
    "maxexp",
    "liansuo_mp",
    "liansuo_fg1",
    "liansuo_fg2",
  ]
    .map((fieldName) => fieldPayload(props.jsTable, fieldName, row.target, row.rowIndex, row.view))
    .filter((field): field is MartialSaveField => Boolean(field));
}

function baseRowIndex(name: string) {
  return baseRowByName.value.get(lookupKey(name)) ?? null;
}

function baseFields(name: string) {
  const rowIndex = baseRowIndex(name);
  if (rowIndex === null) return [];
  return [
    "rare",
    "cost",
    "slashfx",
    "hitfx",
    "buff1",
    "bufftarget1",
    "buff2",
    "bufftarget2",
    "buff3",
    "bufftarget3",
    "beidong1",
    "beidong2",
    "beidong3",
    "jiange",
    "mingzhong",
  ]
    .map((fieldName) => fieldPayload(props.baseTable, fieldName, { type: "row", rowIndex }, rowIndex))
    .filter((field): field is MartialSaveField => Boolean(field));
}

function detailRowIndex(name: string, level: number) {
  return detailRowByNameAndLevel.value.get(detailLookupKey(lookupKey(name), level)) ?? null;
}

function detailLevels(name: string): MartialLevelRow[] {
  return Array.from({ length: 10 }, (_, level) => {
    const rowIndex = detailRowIndex(name, level);
    const fields: MartialLevelRow["fields"] = {};
    for (const fieldName of [
      "weili",
      "hp",
      "zhenqiup",
      "maxexp",
      "xiulian_lvli",
      "xiulian_gengu",
      "xiulian_tipo",
      "xiulian_shenfa",
      "xiulian_wuyi",
      "b1value",
      "b2value",
      "b3value",
    ]) {
      fields[fieldName] = rowIndex === null ? null : fieldPayload(props.detailTable, fieldName, { type: "row", rowIndex }, rowIndex);
    }
    return { level, fields };
  });
}

function detailRowsFor(name: string) {
  return Array.from({ length: 10 }, (_, level) => detailRowIndex(name, level))
    .filter((rowIndex): rowIndex is number => rowIndex !== null);
}

function martialLinkName(rowIndex: number) {
  return initialFieldText(props.jsTable.fields.wugongname, rowIndex) ||
    fieldText(props.jsTable.fields.wugongname, rowIndex);
}

function martialRowName(row: MartialDisplayRow) {
  if (row.rowIndex === null) return row.name;
  return martialLinkName(row.rowIndex);
}

function rowDirty(table: BgDatabaseTable, rowIndex: number) {
  return Boolean(dirtyRowsByTableIndex.value.get(table.tableIndex)?.has(rowIndex));
}

function martialTableRowDirty(row: MartialDisplayRow) {
  const name = martialRowName(row);
  const baseIndex = baseRowIndex(name);
  return row.view.rowDirty ||
    (baseIndex !== null && rowDirty(props.baseTable, baseIndex)) ||
    detailRowsFor(name).some((detailIndex) => rowDirty(props.detailTable, detailIndex));
}

function martialRowDirty(row: MartialDisplayRow) {
  const name = martialRowName(row);
  const baseIndex = baseRowIndex(name);
  return row.view.status === "deleted" ||
    row.view.dirtyFields.size > 0 ||
    (baseIndex !== null && rowDirty(props.baseTable, baseIndex)) ||
    detailRowsFor(name).some((detailIndex) => rowDirty(props.detailTable, detailIndex));
}

function resetRowOperation(table: BgDatabaseTable, rowIndex: number): SaveEditDraftResetOperation {
  return { table, target: { type: "row", rowIndex } };
}

function martialResetOperations(row: MartialDisplayRow) {
  const name = martialRowName(row);
  const operations: SaveEditDraftResetOperation[] = [
    { table: props.jsTable, target: row.target },
  ];
  const baseIndex = baseRowIndex(name);
  if (baseIndex !== null) operations.push(resetRowOperation(props.baseTable, baseIndex));
  for (const detailIndex of detailRowsFor(name)) operations.push(resetRowOperation(props.detailTable, detailIndex));
  return operations;
}

function resetMartial(row: MartialDisplayRow) {
  emit("resetDrafts", martialResetOperations(row));
}

function resetTable() {
  const insertedDeletes = allOwnerRows.value
    .filter((row) => row.target.type === "insert")
    .map((row): SaveEditRowDraftOperation => ({
      type: "delete",
      target: row.target,
    }));
  if (insertedDeletes.length) emit("rowOperations", props.jsTable, insertedDeletes);

  const resetOperations = allOwnerRows.value.flatMap((row) => martialResetOperations(row));
  if (resetOperations.length) emit("resetDrafts", resetOperations);
}

function updateField(payload: { field: BgDatabaseField; target: SaveEditRowDraftTarget; value: string }) {
  if (payload.field.tableIndex === props.jsTable.tableIndex && payload.field.table === props.jsTable.name) {
    emit("rowOperation", props.jsTable, {
      type: "update",
      target: payload.target,
      values: { [payload.field.name]: payload.value },
    });
    return;
  }

  if (payload.target.type === "row") emit("updateField", payload.field, payload.value, payload.target.rowIndex);
}

function cardTitle(row: MartialDisplayRow) {
  return baseFieldText(row.name, "chnname") || row.name || "未知武学";
}

function cardDescription(row: MartialDisplayRow) {
  return enumLabel(props.enums, "BingQiType", cardTypeId(row), "未匹配");
}

function numberOrNull(value: string | null | undefined) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function baseFieldNumber(name: string, fieldName: string) {
  const rowIndex = baseRowIndex(name);
  if (rowIndex === null) return null;
  return numberOrNull(fieldText(props.baseTable.fields[fieldName], rowIndex));
}

function baseFieldText(name: string, fieldName: string) {
  const rowIndex = baseRowIndex(name);
  if (rowIndex === null) return "";
  return fieldText(props.baseTable.fields[fieldName], rowIndex);
}

function jsFieldText(row: MartialDisplayRow, fieldName: string) {
  return row.view.values[fieldName] ?? row.view.initialValues[fieldName] ?? "";
}

function jsFieldNumber(row: MartialDisplayRow, fieldName: string) {
  return numberOrNull(jsFieldText(row, fieldName));
}

function cardTypeId(row: MartialDisplayRow) {
  return baseFieldNumber(row.name, "type") ??
    jsFieldNumber(row, "wugongtype") ??
    row.martialArt?.type_id ??
    null;
}

function cardRarityId(row: MartialDisplayRow) {
  return baseFieldNumber(row.name, "rare") ?? row.martialArt?.rarity_id ?? null;
}

function cardSectId(row: MartialDisplayRow) {
  const id = jsFieldNumber(row, "liansuo_mp") ??
    row.martialArt?.sect_id ??
    null;
  return id === 15 ? null : id;
}

function cardSectLabel(row: MartialDisplayRow) {
  const id = jsFieldNumber(row, "liansuo_mp") ??
    row.martialArt?.sect_id ??
    null;
  return enumLabel(props.enums, "LianSuo_MP", id, row.martialArt?.sect_name || "无门派");
}

function cardStyleItems(row: MartialDisplayRow) {
  const ids = [
    jsFieldNumber(row, "liansuo_fg1"),
    jsFieldNumber(row, "liansuo_fg2"),
  ];
  return ids
    .filter((id): id is number => Boolean(id && id > 0))
    .map((id) => ({
      id,
      label: enumLabel(props.enums, "LianSuo_FG", id, `风格 ${id}`),
    }));
}

function addPendingMartialArts(payloads: MartialArtAddPayload[]) {
  const operations = payloads.map((payload): SaveEditRowDraftOperation => {
    const martialName = payload.martialArt.legacy_name || payload.martialArt.name || "";
    const values = filterInsertValues({
      name: createMartialEntityName(),
      juesename: props.ownerName,
      wugongname: martialName,
      wugongtype: baseFieldText(martialName, "type") || String(payload.martialArt.type_id || 0),
      currentlv: "0",
      maxlv: "9",
      currentexp: "0",
      maxexp: "100",
      liansuo_mp: baseFieldText(martialName, "liansuo_mp") || String(payload.martialArt.sect_id || 0),
      liansuo_fg1: baseFieldText(martialName, "liansuo_fg1") || "0",
      liansuo_fg2: baseFieldText(martialName, "liansuo_fg2") || "0",
    });
    return {
      type: "insert",
      tempId: createTempRowId(),
      initialValues: values,
      values,
    };
  });
  if (operations.length) emit("rowOperations", props.jsTable, operations);
}

function deleteMartial(row: MartialDisplayRow) {
  emit("rowOperation", props.jsTable, {
    type: "delete",
    target: row.target,
  });
}

function toggleDeleteMode() {
  deleteMode.value = !deleteMode.value;
}

function createTempRowId() {
  if (import.meta.client && globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `insert-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createMartialEntityName() {
  martialEntityNameCounter += 1;
  return `${Date.now()}${martialEntityNameCounter}${Math.floor(Math.random() * 1000)}`;
}

function filterInsertValues(values: Record<string, string>) {
  return Object.fromEntries(Object.entries(values).filter(([fieldName]) => Boolean(props.jsTable.fields[fieldName])));
}
</script>

<template>
  <AppCard>
    <EditableTableCardHeader
      title="武学"
      :description="`${ownerRows.length} 个${ownerLabel}武学`"
      :dirty="tableDirty"
      @reset="resetTable"
    />
    <AppCardContent class="grid gap-4">
      <div class="grid grid-cols-2 gap-2">
        <AppButton type="button" @click="addDialogOpen = true">
          <Plus class="size-4" />
          添加武学
        </AppButton>
        <AppButton
          type="button"
          class="w-full"
          :variant="deleteMode ? 'destructive' : 'outline'"
          :aria-pressed="deleteMode"
          @click="toggleDeleteMode"
        >
          <Trash2 class="size-4" />
          删除武学
        </AppButton>
      </div>

      <div v-if="ownerRows.length" class="grid grid-cols-2 gap-2 md:gap-3 lg:grid-cols-3 xl:grid-cols-4">
        <template
          v-for="row in ownerRows"
          :key="row.key"
        >
          <SaveEditResettableFrame
            class="h-full"
            :dirty="martialRowDirty(row)"
            :surface="false"
            reset-label="重置武学"
            reset-class="-right-2 -top-2"
            @reset="resetMartial(row)"
          >
            <MartialArtCard
              class="h-full"
              :id="row.martialArt?.id ?? row.rowIndex ?? jsTable.rowCount"
              :name="cardTitle(row)"
              :type="cardDescription(row)"
              :type-id="cardTypeId(row)"
              :rarity-id="cardRarityId(row)"
              :rarity-tone-id="martialArtRarityToneId(cardRarityId(row))"
              :sect-id="cardSectId(row)"
              :sect-label="cardSectLabel(row)"
              :styles="cardStyleItems(row)"
            >
              <template #action>
                <SaveEditDeleteButton
                  v-if="deleteMode"
                  label="删除武学"
                  @click="deleteMartial(row)"
                />
                <SaveEditEditButton
                  v-else
                  aria-label="编辑武学"
                  label="编辑武学"
                  @click="openRow = row.key"
                />
              </template>
            </MartialArtCard>
          </SaveEditResettableFrame>

          <EditDialog
            v-if="openRow === row.key"
            :open="openRow === row.key"
            @update:open="openRow = $event ? row.key : null"
            :martial-art-id="row.martialArt?.id"
            :title="cardTitle(row)"
            :description="row.name"
            :fields="jsFields(row)"
            :base-fields="baseFields(row.name)"
            :type-id="cardTypeId(row)"
            :buff-targets-by-effect="buffTargetsByEffect"
            :levels="detailLevels(row.name)"
            @update-field="updateField"
          />
        </template>
      </div>

      <div v-else class="rounded-md border px-3 py-8 text-center text-sm text-muted-foreground">
        没有找到{{ ownerLabel }}武学
      </div>
    </AppCardContent>

    <AddMartialArtDialog
      v-model:open="addDialogOpen"
      :enums="enums"
      @add="addPendingMartialArts"
    />
  </AppCard>
</template>
