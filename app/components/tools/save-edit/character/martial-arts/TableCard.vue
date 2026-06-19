<script setup lang="ts">
import EditableTableCardHeader from "../EditableTableCardHeader.vue";
import EditDialog, { type MartialLevelRow, type MartialSaveField } from "./EditDialog.vue";
import EditableFieldFrame from "~/components/tools/save-edit/fields/EditableFieldFrame.vue";
import MartialArtHoverLink from "~/components/wiki/martial-art/HoverLink.vue";
import MartialArtIcon from "~/components/wiki/martial-art/MartialArtIcon.vue";
import WikiCard from "~/components/wiki/WikiCard.vue";
import {
  formatSaveValue,
  saveEditDraftDirtyRows,
  saveEditDraftFieldValue,
  saveEditDraftHasField,
  saveEditEnumOptions,
  type SaveEditDraft,
} from "~/lib/save-edit";
import { rarityCardClass } from "~/lib/rarity";
import { martialArtRarityToneId } from "~/lib/wiki/martial-art";
import { enumLabel } from "~/lib/utils";
import type { BgDatabaseField, BgDatabaseTable, BgDatabaseValue } from "~/lib/save-edit";
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

type PlayerMartialRow = {
  rowIndex: number;
  name: string;
  martialArt: MartialArtRow | null;
};

type CustomEffectTargetRow = {
  effect_id: number;
  target_id: number;
};

const props = defineProps<{
  jsTable: BgDatabaseTable;
  baseTable: BgDatabaseTable;
  detailTable: BgDatabaseTable;
  draft: SaveEditDraft;
  enums: WikiEnums;
}>();

const emit = defineEmits<{
  updateField: [field: BgDatabaseField, value: string, rowIndex: number];
}>();

const { queryRows } = useWikiDb();
const openRow = ref<number | null>(null);

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

const playerRows = computed<PlayerMartialRow[]>(() =>
  Array.from({ length: props.jsTable.rowCount }, (_, rowIndex) => rowIndex)
    .filter((rowIndex) => fieldText(props.jsTable.fields.juesename, rowIndex) === "ZhuJue")
    .map((rowIndex) => {
      const name = fieldText(props.jsTable.fields.wugongname, rowIndex);
      return {
        rowIndex,
        name,
        martialArt: artByName.value.get(lookupKey(name)) || null,
      };
    }),
);

const tableDirty = computed(() => playerRows.value.some((row) => martialRowDirty(row.rowIndex)));

const parsedFieldsByTableIndex = computed(() => {
  const result = new Map<number, BgDatabaseField[]>();
  for (const table of [props.jsTable, props.baseTable, props.detailTable]) {
    result.set(
      table.tableIndex,
      table.fieldNames
        .map((fieldName) => table.fields[fieldName])
        .filter((field): field is BgDatabaseField => Boolean(field?.parsed)),
    );
  }
  return result;
});

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
    result.set(table.tableIndex, saveEditDraftDirtyRows(props.draft, table.tableIndex));
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

function fieldValue(field: BgDatabaseField | undefined, rowIndex: number): BgDatabaseValue {
  return saveEditDraftFieldValue(field, rowIndex, props.draft);
}

function fieldText(field: BgDatabaseField | undefined, rowIndex: number) {
  return formatSaveValue(fieldValue(field, rowIndex));
}

function initialFieldText(field: BgDatabaseField | undefined, rowIndex: number) {
  return formatSaveValue(field?.values[rowIndex]);
}

function fieldPayload(table: BgDatabaseTable, fieldName: string, rowIndex: number): MartialSaveField | null {
  const field = table.fields[fieldName];
  if (!field?.parsed) return null;
  return {
    key: fieldName,
    label: fieldName,
    field,
    rowIndex,
    value: fieldText(field, rowIndex),
    initialValue: initialFieldText(field, rowIndex),
    enumOptions: saveEditEnumOptions(props.enums, table.name, fieldName).map((option) => ({
      value: option.id,
      label: option.label,
    })),
  };
}

function jsFields(rowIndex: number) {
  return [
    "currentlv",
    "maxlv",
    "currentexp",
    "maxexp",
    "liansuo_mp",
    "liansuo_fg1",
    "liansuo_fg2",
  ]
    .map((fieldName) => fieldPayload(props.jsTable, fieldName, rowIndex))
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
    .map((fieldName) => fieldPayload(props.baseTable, fieldName, rowIndex))
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
      fields[fieldName] = rowIndex === null ? null : fieldPayload(props.detailTable, fieldName, rowIndex);
    }
    return { level, fields };
  });
}

function detailRowsFor(name: string) {
  return Array.from({ length: 10 }, (_, level) => detailRowIndex(name, level))
    .filter((rowIndex): rowIndex is number => rowIndex !== null);
}

function rowDirty(table: BgDatabaseTable, rowIndex: number) {
  return Boolean(dirtyRowsByTableIndex.value.get(table.tableIndex)?.has(rowIndex));
}

function martialRowDirty(rowIndex: number) {
  const name = fieldText(props.jsTable.fields.wugongname, rowIndex);
  const baseIndex = baseRowIndex(name);
  return rowDirty(props.jsTable, rowIndex) ||
    (baseIndex !== null && rowDirty(props.baseTable, baseIndex)) ||
    detailRowsFor(name).some((detailIndex) => rowDirty(props.detailTable, detailIndex));
}

function resetRow(table: BgDatabaseTable, rowIndex: number) {
  for (const field of parsedFieldsByTableIndex.value.get(table.tableIndex) || []) {
    const initialValue = initialFieldText(field, rowIndex);
    if (saveEditDraftHasField(field, rowIndex, props.draft)) emit("updateField", field, initialValue, rowIndex);
  }
}

function resetMartial(rowIndex: number) {
  const name = fieldText(props.jsTable.fields.wugongname, rowIndex);
  resetRow(props.jsTable, rowIndex);
  const baseIndex = baseRowIndex(name);
  if (baseIndex !== null) resetRow(props.baseTable, baseIndex);
  for (const detailIndex of detailRowsFor(name)) resetRow(props.detailTable, detailIndex);
}

function resetTable() {
  for (const row of playerRows.value) resetMartial(row.rowIndex);
}

function updateField(payload: { field: BgDatabaseField; rowIndex: number; value: string }) {
  emit("updateField", payload.field, payload.value, payload.rowIndex);
}

function cardTitle(row: PlayerMartialRow) {
  return baseFieldText(row.name, "chnname") || row.name || "未知武学";
}

function cardDescription(row: PlayerMartialRow) {
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

function jsFieldNumber(rowIndex: number, fieldName: string) {
  return numberOrNull(fieldText(props.jsTable.fields[fieldName], rowIndex));
}

function cardTypeId(row: PlayerMartialRow) {
  return baseFieldNumber(row.name, "type") ??
    jsFieldNumber(row.rowIndex, "wugongtype");
}

function cardRarityId(row: PlayerMartialRow) {
  return baseFieldNumber(row.name, "rare");
}
</script>

<template>
  <AppCard>
    <EditableTableCardHeader
      title="武学"
      :description="`${playerRows.length} 个玩家武学`"
      :dirty="tableDirty"
      @reset="resetTable"
    />
    <AppCardContent>
      <div v-if="playerRows.length" class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <template
          v-for="row in playerRows"
          :key="row.rowIndex"
        >
          <WikiCard
            :title="cardTitle(row)"
            :description="cardDescription(row)"
            :color="rarityCardClass(martialArtRarityToneId(cardRarityId(row)))"
          >
            <template #avatar>
              <MartialArtIcon
                :name="cardTitle(row)"
                :type-id="cardTypeId(row)"
                :rarity-id="cardRarityId(row)"
                :size="40"
              />
            </template>

            <template #action>
              <EditableFieldFrame
                :dirty="martialRowDirty(row.rowIndex)"
                @reset="resetMartial(row.rowIndex)"
              >
                <AppButton
                  type="button"
                  variant="outline"
                  @click="openRow = row.rowIndex"
                >
                  编辑
                </AppButton>
              </EditableFieldFrame>
              <MartialArtHoverLink
                v-if="row.martialArt"
                :id="row.martialArt.id"
                mode="button"
              />
            </template>
          </WikiCard>

          <EditDialog
            v-if="openRow === row.rowIndex"
            :open="openRow === row.rowIndex"
            @update:open="openRow = $event ? row.rowIndex : null"
            :title="cardTitle(row)"
            :description="row.name"
            :fields="jsFields(row.rowIndex)"
            :base-fields="baseFields(row.name)"
            :type-id="row.martialArt?.type_id ?? null"
            :buff-targets-by-effect="buffTargetsByEffect"
            :levels="detailLevels(row.name)"
            @update-field="updateField"
          />
        </template>
      </div>

      <div v-else class="rounded-md border px-3 py-8 text-center text-sm text-muted-foreground">
        没有找到玩家武学
      </div>
    </AppCardContent>
  </AppCard>
</template>
