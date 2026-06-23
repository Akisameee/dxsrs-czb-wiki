<script setup lang="ts">
import EditableTableCardHeader from "../EditableTableCardHeader.vue";
import SaveFieldEditor from "~/components/tools/save-edit/fields/SaveFieldEditor.vue";
import {
  formatSaveValue,
  saveEditDraftFieldValue,
  saveEditDraftRowDirty,
  saveEditEnumOptions,
  type SaveEditDraft,
} from "~/lib/save-edit";
import type { BgDatabaseField, BgDatabaseTable, BgDatabaseValue } from "~/lib/save-edit";
import { characterLocationText } from "~/lib/wiki/character";
import type { WikiEnums } from "~/lib/wiki/text";

type FieldGroup = {
  title: string;
  fields: Array<{ key: string; label: string }>;
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
  rowIndex: number;
  draft: SaveEditDraft;
  enums: WikiEnums;
}>();

const emit = defineEmits<{
  updateField: [field: BgDatabaseField, value: string, rowIndex: number];
  resetRow: [rowIndex: number];
}>();

const fieldGroups: FieldGroup[] = [
  {
    title: "基础信息",
    fields: [
      { key: "xing", label: "姓" },
      { key: "ming", label: "名" },
      { key: "name", label: "存档名" },
      { key: "sex", label: "性别" },
      { key: "old", label: "年龄" },
      { key: "maxold", label: "寿命" },
      { key: "touxiang", label: "头像" },
    ],
  },
  {
    title: "身份",
    fields: [
      { key: "menpai", label: "门派" },
      { key: "diwei", label: "地位" },
      { key: "dengji", label: "资历" },
      { key: "rare", label: "资质" },
      { key: "type", label: "类型" },
      { key: "area", label: "地点" },
    ],
  },
  {
    title: "关系",
    fields: [
      { key: "qinmidu", label: "亲密度" },
      { key: "isteammate", label: "队友" },
      { key: "lastchuzhan", label: "上次出战" },
      { key: "cengjingyaoqing", label: "曾邀请" },
      { key: "isjiaotou", label: "教头" },
    ],
  },
  {
    title: "属性",
    fields: [
      { key: "lvli", label: "膂力" },
      { key: "gengu", label: "根骨" },
      { key: "tipo", label: "体魄" },
      { key: "shenfa", label: "身法" },
      { key: "wuxuexiuwei", label: "武学修为" },
      { key: "quanzhang", label: "拳掌" },
      { key: "daojian", label: "刀剑" },
      { key: "qiangbang", label: "枪棒" },
      { key: "anqi", label: "暗器" },
      { key: "neigong", label: "内功" },
    ],
  },
  {
    title: "装备",
    fields: [
      { key: "bingqitype", label: "武器类型" },
      { key: "wq_uid", label: "武器 UID" },
      { key: "fj_uid", label: "防具 UID" },
    ],
  },
];

const activeGroups = computed(() =>
  fieldGroups
    .map((group) => ({
      ...group,
      fields: group.fields.filter((item) => hasField(item.key)),
    }))
    .filter((group) => group.fields.length),
);
const dirty = computed(() => saveEditDraftRowDirty(props.draft, props.table.tableIndex, props.rowIndex));
const characterName = computed(() => fullName() || fieldText("name") || `Character ${props.rowIndex}`);
const { queryRows } = useWikiDb();

const { data: characterLookupRows } = await useAsyncData(
  "save-edit-npc-detail-character-lookup",
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

const characterRecord = computed(() =>
  characterByName.value.get(lookupName(fieldText("name"))) ??
  characterByName.value.get(lookupName(fullName())) ??
  null,
);
const locationText = computed(() =>
  characterLocationText(
    {
      region_id: characterRecord.value?.region_id ?? null,
      location_id: characterRecord.value?.location_id ?? null,
    },
    props.enums,
  ),
);

function field(fieldName: string): BgDatabaseField | undefined {
  return props.table.fields[fieldName];
}

function hasField(fieldName: string) {
  return Boolean(field(fieldName)?.parsed);
}

function fieldValue(fieldName: string): BgDatabaseValue | undefined {
  return saveEditDraftFieldValue(field(fieldName), props.rowIndex, props.draft);
}

function fieldText(fieldName: string) {
  return formatSaveValue(fieldValue(fieldName));
}

function fullName() {
  return `${fieldText("xing")}${fieldText("ming")}`.trim();
}

function lookupName(value: string | null | undefined) {
  return String(value || "").trim().normalize("NFKC");
}

function addLookupName(map: Map<string, CharacterLookupRow>, value: string | null | undefined, character: CharacterLookupRow) {
  const key = lookupName(value);
  if (key && !map.has(key)) map.set(key, character);
}

function enumOptions(fieldName: string) {
  return saveEditEnumOptions(props.enums, props.table.name, fieldName);
}

function updateField(fieldName: string, value: string) {
  const target = field(fieldName);
  if (target) emit("updateField", target, value, props.rowIndex);
}
</script>

<template>
  <AppCard>
    <EditableTableCardHeader
      :title="`角色：${characterName}`"
      :description="`地点：${locationText}，Character 表第 ${rowIndex} 行`"
      :dirty="dirty"
      @reset="emit('resetRow', rowIndex)"
    />

    <AppCardContent class="grid gap-5">
      <div
        v-for="group in activeGroups"
        :key="group.title"
        class="grid gap-3"
      >
        <div class="text-sm font-medium">{{ group.title }}</div>
        <div class="grid auto-rows-min gap-3 grid-cols-2 xl:grid-cols-4">
          <AppFieldStack
            v-for="item in group.fields"
            :key="item.key"
            :label="item.label"
          >
            <SaveFieldEditor
              :field="field(item.key)"
              :row-index="rowIndex"
              :draft="draft"
              :enum-options="enumOptions(item.key)"
              compact
              @update="(_field, value) => updateField(item.key, value)"
            />
          </AppFieldStack>
        </div>
      </div>
    </AppCardContent>
  </AppCard>
</template>
