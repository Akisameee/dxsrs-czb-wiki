<script setup lang="ts">
import EditableTableCardHeader from "../EditableTableCardHeader.vue";
import SaveEditEditButton from "~/components/tools/save-edit/SaveEditEditButton.vue";
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
}>();

const emit = defineEmits<{
  editCharacter: [rowIndex: number];
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
  };
}

function rowDescription(row: NpcDisplayRow) {
  return characterLocationText({ region_id: row.regionId, location_id: row.locationId }, props.enums);
}
</script>

<template>
  <AppCard>
    <EditableTableCardHeader
      title="NPC"
      :description="`${teammateRows.length}/6 队友，${filteredRows.length} 个搜索结果`"
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
          <CharacterCard
            v-for="row in teammateRows"
            :key="row.key"
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
              <SaveEditEditButton aria-label="编辑 NPC" @click="emit('editCharacter', row.rowIndex)" />
            </template>
          </CharacterCard>
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
          <CharacterCard
            v-for="row in pagedRows"
            :key="row.key"
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
              <SaveEditEditButton aria-label="编辑 NPC" @click="emit('editCharacter', row.rowIndex)" />
            </template>
          </CharacterCard>
        </WikiCardGrid>
      </div>
    </AppCardContent>
  </AppCard>
</template>
