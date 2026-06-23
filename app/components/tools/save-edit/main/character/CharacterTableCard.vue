<script setup lang="ts">
import EditableTableCardHeader from "../EditableTableCardHeader.vue";
import SaveEditEditButton from "~/components/tools/save-edit/SaveEditEditButton.vue";
import SaveEditResettableFrame from "~/components/tools/save-edit/SaveEditResettableFrame.vue";
import CharacterCard from "~/components/wiki/character/Card.vue";
import WikiCardGrid from "~/components/wiki/WikiCardGrid.vue";
import { Badge } from "~/components/ui/badge";
import {
  Select,
  SelectItem,
  SelectValue,
} from "~/components/ui/select";
import {
  formatSaveValue,
  saveEditDraftFieldValue,
  saveEditDraftRowDirty,
  selectSaveEditInsertedTableRows,
  type SaveEditDraftResetOperation,
  type SaveEditDraftResetTarget,
  type SaveEditRowDraftOperation,
  type SaveEditTableRowView,
  type BgDatabaseField,
  type BgDatabaseTable,
  type BgDatabaseValue,
  type SaveEditDraft,
} from "~/lib/save-edit";
import { enumLabel } from "~/lib/utils";
import { characterLocationText } from "~/lib/wiki/character";
import type { WikiEnums } from "~/lib/wiki/text";

type NpcDisplayRow = {
  rowIndex: number;
  key: string;
  characterId: number | null;
  name: string;
  fullName: string;
  portrait: string;
  sectId: number | null;
  sect: string;
  regionId: number | null;
  locationId: number | null;
  weaponType: string;
  status: string;
  rank: string;
  rarityId: number | null;
  teammate: boolean;
  dirty: boolean;
};

type CharacterLookupRow = {
  id: number;
  name: string | null;
  legacy_name: string | null;
  region_id: number | null;
  location_id: number | null;
};

const props = defineProps<{
  table: BgDatabaseTable;
  draft: SaveEditDraft;
  enums: WikiEnums;
  jsWugongTable?: BgDatabaseTable | null;
  gWugongTable?: BgDatabaseTable | null;
  gWugongDetailTable?: BgDatabaseTable | null;
  inventoryTable?: BgDatabaseTable | null;
}>();

const emit = defineEmits<{
  editCharacter: [rowIndex: number];
  resetDrafts: [operations: SaveEditDraftResetOperation[]];
  tableRowOperations: [table: BgDatabaseTable, operations: SaveEditRowDraftOperation[]];
}>();

const { queryRows } = useWikiDb();
const search = ref("");
const sectFilter = ref("all");
const regionFilter = ref("all");
const rarityFilter = ref("all");
const page = ref(1);
const pageSize = 24;

const { data: characterLookupRows } = await useAsyncData(
  "save-edit-npc-character-lookup",
  () => queryRows<CharacterLookupRow>(
    `SELECT id, name, legacy_name, region_id, location_id
     FROM characters
     ORDER BY id`,
  ),
  { server: false },
);

const characterByName = computed(() => {
  const result = new Map<string, CharacterLookupRow>();
  for (const character of characterLookupRows.value || []) {
    addLookupName(result, character.name, character);
    addLookupName(result, character.legacy_name, character);
  }
  return result;
});

const rows = computed<NpcDisplayRow[]>(() =>
  Array.from({ length: props.table.rowCount }, (_, rowIndex) => buildRow(rowIndex)),
);
const teammateRows = computed(() => rows.value.filter((row) => row.teammate));
const tableDirty = computed(() => rows.value.some((row) => row.dirty));
const martialBaseRowByName = computed(() => {
  const result = new Map<string, number>();
  const table = props.gWugongTable;
  const field = table?.fields.name;
  if (!table || !field) return result;
  for (let rowIndex = 0; rowIndex < table.rowCount; rowIndex += 1) {
    const key = lookupName(initialTableFieldText(table, "name", rowIndex));
    if (key && !result.has(key)) result.set(key, rowIndex);
  }
  return result;
});
const martialDetailRowsByName = computed(() => {
  const result = new Map<string, number[]>();
  const table = props.gWugongDetailTable;
  if (!table) return result;
  for (let rowIndex = 0; rowIndex < table.rowCount; rowIndex += 1) {
    const key = lookupName(initialTableFieldText(table, "wugongname", rowIndex));
    if (!key) continue;
    const list = result.get(key) || [];
    list.push(rowIndex);
    result.set(key, list);
  }
  return result;
});

function enumOptions(type: string) {
  return Object.entries(props.enums[type] || {})
    .filter(([, label]) => label)
    .map(([id, label]) => ({ value: id, label: label || id }));
}

const sectOptions = computed(() => enumOptions("MenPai"));
const regionOptions = computed(() => enumOptions("DiDian"));
const rarityOptions = computed(() => enumOptions("NPC_Rare"));

const indexFilters = computed(() => [
  {
    id: "character-sect",
    label: "门派",
    modelValue: sectFilter.value,
    placeholder: "全部门派",
    allLabel: "全部门派",
    options: sectOptions.value,
  },
  {
    id: "character-region",
    label: "地点",
    modelValue: regionFilter.value,
    placeholder: "全部地点",
    allLabel: "全部地点",
    options: regionOptions.value,
  },
  {
    id: "character-rarity",
    label: "资质",
    modelValue: rarityFilter.value,
    placeholder: "全部资质",
    allLabel: "全部资质",
    options: rarityOptions.value,
  },
]);

const filteredRows = computed(() => {
  const query = search.value.trim().toLowerCase();
  return rows.value.filter((row) =>
    (!query || [
      row.name,
      row.fullName,
      row.sect,
      row.weaponType,
      row.status,
      row.rank,
      rowDescription(row),
    ].some((value) => value.toLowerCase().includes(query))) &&
    (sectFilter.value === "all" || String(row.sectId) === sectFilter.value) &&
    (regionFilter.value === "all" || String(row.regionId) === regionFilter.value) &&
    (rarityFilter.value === "all" || String(row.rarityId) === rarityFilter.value),
  );
});
const pageCount = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize)));
const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize;
  return filteredRows.value.slice(start, start + pageSize);
});

watch(search, () => {
  page.value = 1;
});

watch([sectFilter, regionFilter, rarityFilter], () => {
  page.value = 1;
});

watch(pageCount, (count) => {
  if (page.value > count) page.value = count;
});

function updateFilter(id: string, value: string) {
  if (id === "character-sect") sectFilter.value = value;
  if (id === "character-region") regionFilter.value = value;
  if (id === "character-rarity") rarityFilter.value = value;
}

function field(fieldName: string): BgDatabaseField | undefined {
  return props.table.fields[fieldName];
}

function lookupName(value: string | null | undefined) {
  return String(value || "").trim().normalize("NFKC");
}

function addLookupName(map: Map<string, CharacterLookupRow>, value: string | null | undefined, character: CharacterLookupRow) {
  const key = lookupName(value);
  if (key && !map.has(key)) map.set(key, character);
}

function rowCharacter(name: string, fullNameValue: string) {
  return characterByName.value.get(lookupName(name)) ??
    characterByName.value.get(lookupName(fullNameValue)) ??
    null;
}

function fieldValue(fieldName: string, rowIndex: number): BgDatabaseValue {
  return saveEditDraftFieldValue(field(fieldName), rowIndex, props.draft);
}

function fieldText(fieldName: string, rowIndex: number) {
  return formatSaveValue(fieldValue(fieldName, rowIndex));
}

function tableFieldText(table: BgDatabaseTable | null | undefined, fieldName: string, rowIndex: number) {
  return formatSaveValue(saveEditDraftFieldValue(table?.fields[fieldName], rowIndex, props.draft));
}

function initialTableFieldText(table: BgDatabaseTable | null | undefined, fieldName: string, rowIndex: number) {
  return formatSaveValue(table?.fields[fieldName]?.values[rowIndex]);
}

function fieldNumber(fieldName: string, rowIndex: number) {
  const value = Number(fieldText(fieldName, rowIndex));
  return Number.isFinite(value) ? value : null;
}

function fieldBool(fieldName: string, rowIndex: number) {
  const value = fieldValue(fieldName, rowIndex);
  if (typeof value === "boolean") return value;
  return ["1", "true", "True", "TRUE"].includes(formatSaveValue(value));
}

function fullName(rowIndex: number) {
  return `${fieldText("xing", rowIndex)}${fieldText("ming", rowIndex)}` || fieldText("name", rowIndex);
}

function enumFieldLabel(type: string, fieldName: string, rowIndex: number, fallback = "未知") {
  return enumLabel(props.enums, type, fieldText(fieldName, rowIndex), fallback);
}

function buildRow(rowIndex: number): NpcDisplayRow {
  const name = fieldText("name", rowIndex);
  const fullNameValue = fullName(rowIndex);
  const character = rowCharacter(name, fullNameValue);
  return {
    rowIndex,
    key: `${rowIndex}-${name}`,
    characterId: character?.id ?? null,
    name,
    fullName: fullNameValue,
    portrait: fieldText("touxiang", rowIndex),
    sectId: fieldNumber("menpai", rowIndex),
    sect: enumFieldLabel("MenPai", "menpai", rowIndex),
    regionId: character?.region_id ?? null,
    locationId: character?.location_id ?? null,
    weaponType: enumFieldLabel("BingQiType", "bingqitype", rowIndex),
    status: enumFieldLabel("DiWei", "diwei", rowIndex),
    rank: enumFieldLabel("Dengji", "dengji", rowIndex),
    rarityId: fieldNumber("rare", rowIndex),
    teammate: fieldBool("isteammate", rowIndex),
    dirty: characterRowDirty(rowIndex, name),
  };
}

function rowDescription(row: NpcDisplayRow) {
  return characterLocationText({ region_id: row.regionId, location_id: row.locationId }, props.enums);
}

function resetRow(row: NpcDisplayRow) {
  resetCharacterRows([row]);
}

function resetTable() {
  resetCharacterRows(rows.value);
}

function characterRowDirty(rowIndex: number, ownerName: string) {
  return saveEditDraftRowDirty(props.draft, props.table.tableIndex, rowIndex) ||
    inventoryRowsDirty(ownerName) ||
    martialRowsDirty(ownerName);
}

function relatedExistingRows(table: BgDatabaseTable | null | undefined, ownerFieldName: string, ownerName: string) {
  if (!table) return [];
  return Array.from({ length: table.rowCount }, (_, rowIndex) => rowIndex)
    .filter((rowIndex) => initialTableFieldText(table, ownerFieldName, rowIndex) === ownerName);
}

function relatedInsertedRows(table: BgDatabaseTable | null | undefined, ownerFieldName: string, ownerName: string) {
  if (!table) return [];
  return selectSaveEditInsertedTableRows(table, props.draft)
    .filter((row) => (row.values[ownerFieldName] || row.initialValues[ownerFieldName] || "") === ownerName);
}

function inventoryRowsDirty(ownerName: string) {
  const table = props.inventoryTable;
  if (!table) return false;
  return relatedExistingRows(table, "juesename", ownerName)
    .some((rowIndex) => saveEditDraftRowDirty(props.draft, table.tableIndex, rowIndex)) ||
    relatedInsertedRows(table, "juesename", ownerName).length > 0;
}

function martialRowsDirty(ownerName: string) {
  const table = props.jsWugongTable;
  if (!table) return false;
  return relatedExistingRows(table, "juesename", ownerName)
    .some((rowIndex) => martialRowDirty(rowIndex)) ||
    relatedInsertedRows(table, "juesename", ownerName).some((row) => martialInsertedRowDirty(row));
}

function martialRowDirty(rowIndex: number) {
  const table = props.jsWugongTable;
  if (!table) return false;
  const name = tableFieldText(table, "wugongname", rowIndex);
  return saveEditDraftRowDirty(props.draft, table.tableIndex, rowIndex) || martialDefinitionDirty(name);
}

function martialInsertedRowDirty(row: SaveEditTableRowView) {
  return row.rowDirty || martialDefinitionDirty(row.values.wugongname || row.initialValues.wugongname || "");
}

function martialDefinitionDirty(name: string) {
  const key = lookupName(name);
  const baseIndex = martialBaseRowByName.value.get(key);
  return Boolean((props.gWugongTable && baseIndex !== undefined && saveEditDraftRowDirty(props.draft, props.gWugongTable.tableIndex, baseIndex)) ||
    (props.gWugongDetailTable && (martialDetailRowsByName.value.get(key) || [])
      .some((rowIndex) => saveEditDraftRowDirty(props.draft, props.gWugongDetailTable!.tableIndex, rowIndex))));
}

function resetCharacterRows(targetRows: NpcDisplayRow[]) {
  const resetOperations: SaveEditDraftResetOperation[] = [];
  const rowOperationsByTable = new Map<BgDatabaseTable, SaveEditRowDraftOperation[]>();

  for (const row of targetRows) {
    pushReset(resetOperations, props.table, { type: "row", rowIndex: row.rowIndex });
    pushInventoryReset(resetOperations, rowOperationsByTable, row.name);
    pushMartialReset(resetOperations, rowOperationsByTable, row.name);
  }

  for (const [table, operations] of rowOperationsByTable) {
    if (operations.length) emit("tableRowOperations", table, operations);
  }
  if (resetOperations.length) emit("resetDrafts", resetOperations);
}

function pushInventoryReset(
  resetOperations: SaveEditDraftResetOperation[],
  rowOperationsByTable: Map<BgDatabaseTable, SaveEditRowDraftOperation[]>,
  ownerName: string,
) {
  const table = props.inventoryTable;
  if (!table) return;
  for (const rowIndex of relatedExistingRows(table, "juesename", ownerName)) {
    pushReset(resetOperations, table, { type: "row", rowIndex });
  }
  for (const row of relatedInsertedRows(table, "juesename", ownerName)) {
    pushRowOperation(rowOperationsByTable, table, { type: "delete", target: row.target });
  }
}

function pushMartialReset(
  resetOperations: SaveEditDraftResetOperation[],
  rowOperationsByTable: Map<BgDatabaseTable, SaveEditRowDraftOperation[]>,
  ownerName: string,
) {
  const table = props.jsWugongTable;
  if (!table) return;
  for (const rowIndex of relatedExistingRows(table, "juesename", ownerName)) {
    pushReset(resetOperations, table, { type: "row", rowIndex });
    pushMartialDefinitionReset(resetOperations, tableFieldText(table, "wugongname", rowIndex));
  }
  for (const row of relatedInsertedRows(table, "juesename", ownerName)) {
    pushRowOperation(rowOperationsByTable, table, { type: "delete", target: row.target });
    pushMartialDefinitionReset(resetOperations, row.values.wugongname || row.initialValues.wugongname || "");
  }
}

function pushMartialDefinitionReset(resetOperations: SaveEditDraftResetOperation[], name: string) {
  const key = lookupName(name);
  const baseIndex = martialBaseRowByName.value.get(key);
  if (props.gWugongTable && baseIndex !== undefined) {
    pushReset(resetOperations, props.gWugongTable, { type: "row", rowIndex: baseIndex });
  }
  if (props.gWugongDetailTable) {
    for (const rowIndex of martialDetailRowsByName.value.get(key) || []) {
      pushReset(resetOperations, props.gWugongDetailTable, { type: "row", rowIndex });
    }
  }
}

function pushReset(
  operations: SaveEditDraftResetOperation[],
  table: BgDatabaseTable,
  target: SaveEditDraftResetTarget,
) {
  const key = `${table.tableIndex}:${table.name}:${JSON.stringify(target)}`;
  if (operations.some((operation) => `${operation.table.tableIndex}:${operation.table.name}:${JSON.stringify(operation.target)}` === key)) return;
  operations.push({ table, target });
}

function pushRowOperation(
  operationsByTable: Map<BgDatabaseTable, SaveEditRowDraftOperation[]>,
  table: BgDatabaseTable,
  operation: SaveEditRowDraftOperation,
) {
  const operations = operationsByTable.get(table) || [];
  const key = JSON.stringify(operation);
  if (!operations.some((item) => JSON.stringify(item) === key)) operations.push(operation);
  operationsByTable.set(table, operations);
}
</script>

<template>
  <AppCard>
    <EditableTableCardHeader
      title="角色"
      :description="`${teammateRows.length}/6 队友，${filteredRows.length} 个搜索结果`"
      :dirty="tableDirty"
      @reset="resetTable"
    />

    <AppCardContent class="grid gap-5">
      <div class="grid gap-3">
        <div class="flex items-center justify-between gap-3">
          <div class="text-sm font-medium">当前队友</div>
          <Badge variant="secondary">{{ teammateRows.length }}/6</Badge>
        </div>

        <WikiCardGrid
          v-model:page="page"
          :rows="teammateRows"
          :total="teammateRows.length"
          :page-size="teammateRows.length || 1"
          empty-label="当前没有队友"
          :pagination="false"
        >
          <SaveEditResettableFrame
            v-for="row in teammateRows"
            :key="row.key"
            class="h-full"
            :dirty="row.dirty"
            :surface="false"
            reset-label="重置角色"
            reset-class="-right-2 -top-2"
            @reset="resetRow(row)"
          >
            <CharacterCard
              class="h-full"
              :id="row.characterId"
              :name="row.fullName"
              :description="rowDescription(row)"
              :portrait="row.portrait"
              :rarity-id="row.rarityId"
              :sect-label="row.sect"
              :weapon-type="row.weaponType"
              :interactive-badges="false"
            >
              <template #action>
                <SaveEditEditButton aria-label="编辑角色" @click="emit('editCharacter', row.rowIndex)" />
              </template>
            </CharacterCard>
          </SaveEditResettableFrame>
        </WikiCardGrid>
      </div>

      <div class="grid gap-4">
        <div class="grid gap-4 grid-cols-4">
          <AppFieldStack label="搜索" label-for="save-edit-npc-search">
            <AppInput
              id="save-edit-npc-search"
              v-model="search"
              type="search"
              placeholder="搜索 NPC"
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

        <WikiCardGrid
          v-model:page="page"
          :rows="pagedRows"
          :total="filteredRows.length"
          :page-size="pageSize"
          empty-label="没有匹配的 NPC"
        >
          <SaveEditResettableFrame
            v-for="row in pagedRows"
            :key="row.key"
            class="h-full"
            :dirty="row.dirty"
            :surface="false"
            reset-label="重置角色"
            reset-class="-right-2 -top-2"
            @reset="resetRow(row)"
          >
            <CharacterCard
              class="h-full"
              :id="row.characterId"
              :name="row.fullName"
              :description="rowDescription(row)"
              :portrait="row.portrait"
              :rarity-id="row.rarityId"
              :sect-label="row.sect"
              :weapon-type="row.weaponType"
              :interactive-badges="false"
            >
              <template #action>
                <SaveEditEditButton aria-label="编辑角色" @click="emit('editCharacter', row.rowIndex)" />
              </template>
            </CharacterCard>
          </SaveEditResettableFrame>
        </WikiCardGrid>
      </div>
    </AppCardContent>
  </AppCard>
</template>
