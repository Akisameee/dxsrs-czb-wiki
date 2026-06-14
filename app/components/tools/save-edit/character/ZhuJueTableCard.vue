<script setup lang="ts">
import SaveCharacterPortraitEditor from "./SaveCharacterPortraitEditor.vue";
import WikiEnumSelect from "~/components/wiki/WikiEnumSelect.vue";
import {
  fieldDraftKey,
  formatSaveValue,
  saveEditEnumOptions,
  saveEditCharacterName,
  type SaveEditDraft,
  type SaveEditFile,
} from "~/components/tools/save-edit/model";
import type { BgDatabaseField, BgDatabaseTable, BgDatabaseValue } from "~/lib/bgdatabase";
import type { WikiEnums } from "~/lib/wiki/text";

type FieldItem = {
  key: string;
  label: string;
};

type FieldGroup = {
  key: string;
  title: string;
  fields: FieldItem[];
};

const props = defineProps<{
  table: BgDatabaseTable;
  save: SaveEditFile;
  draft: SaveEditDraft;
  enums: WikiEnums;
}>();

const emit = defineEmits<{
  updateField: [field: BgDatabaseField, value: string, rowIndex: number];
}>();

const groups: FieldGroup[] = [
  {
    key: "basic",
    title: "基础信息",
    fields: [
      { key: "xing", label: "姓" },
      { key: "ming", label: "名" },
      { key: "sex", label: "性别" },
      { key: "menpai", label: "门派" },
      { key: "diwei", label: "地位" },
      { key: "old", label: "年龄" },
      { key: "maxold", label: "寿命" },
      { key: "gold", label: "银两" },
      { key: "xingdongli", label: "行动力" },
      { key: "maxxingdongli", label: "最大行动力" },
      { key: "chenghao", label: "称号" },
    ],
  },
  {
    key: "attributes",
    title: "四维数值",
    fields: [
      { key: "lvli", label: "膂力" },
      { key: "gengu", label: "根骨" },
      { key: "tipo", label: "体魄" },
      { key: "shenfa", label: "身法" },
      { key: "lvli_plus", label: "膂力加成" },
      { key: "genfu_plus", label: "根骨加成" },
      { key: "tipo_plus", label: "体魄加成" },
      { key: "shenfa_plus", label: "身法加成" },
    ],
  },
  {
    key: "martial",
    title: "武学修为",
    fields: [
      { key: "wuxuexiuwei", label: "武学修为" },
      { key: "quanzhang", label: "拳掌" },
      { key: "daojian", label: "刀剑" },
      { key: "qiangbang", label: "枪棒" },
      { key: "anqi", label: "暗器" },
      { key: "neigong", label: "内功" },
      { key: "maxwugongqty", label: "武功上限" },
    ],
  },
  {
    key: "life",
    title: "江湖与技艺",
    fields: [
      { key: "mingsheng", label: "名声" },
      { key: "xiayi", label: "侠义" },
      { key: "gongxian", label: "贡献" },
      { key: "wakuang", label: "挖矿" },
      { key: "caiyao", label: "采药" },
      { key: "dalie", label: "打猎" },
      { key: "duanzao", label: "锻造" },
      { key: "liandan", label: "炼丹" },
      { key: "caifeng", label: "裁缝" },
    ],
  },
  {
    key: "portrait",
    title: "头像部件",
    fields: [
      { key: "qianfa", label: "前发" },
      { key: "houfa", label: "后发" },
      { key: "maozi", label: "嘴巴/帽子位" },
      { key: "meimao", label: "眉毛" },
      { key: "lianshi", label: "脸型" },
      { key: "yifu", label: "衣服" },
      { key: "houbei", label: "背部" },
      { key: "huzi", label: "胡子" },
    ],
  },
  {
    key: "equipment",
    title: "装备引用",
    fields: [
      { key: "wq1_uid", label: "武器 1 UID" },
      { key: "wq2_uid", label: "武器 2 UID" },
      { key: "fj_uid", label: "防具 UID" },
    ],
  },
];

const visibleGroups = computed(() =>
  groups
    .map((group) => ({
      ...group,
      fields: group.fields.filter((field) => Boolean(props.table.fields[field.key]?.parsed)),
    }))
    .filter((group) => group.fields.length),
);
const basicGroup = computed(() => visibleGroups.value.find((group) => group.key === "basic"));
const detailGroups = computed(() => visibleGroups.value.filter((group) => !["basic", "portrait"].includes(group.key)));
const hasPortraitFields = computed(() => Boolean(visibleGroups.value.find((group) => group.key === "portrait")));

function fieldValue(field: BgDatabaseField | undefined): BgDatabaseValue {
  if (!field) return null;
  const key = fieldDraftKey(field, 0);
  return props.draft[key] ?? field.values[0] ?? null;
}

function updateField(field: BgDatabaseField | undefined, value: string) {
  if (field) emit("updateField", field, value, 0);
}

function enumOptions(fieldName: string) {
  return saveEditEnumOptions(props.enums, props.table.name, fieldName);
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>ZhuJue</CardTitle>
      <CardDescription>主角：{{ saveEditCharacterName(save, draft) }}</CardDescription>
    </CardHeader>
    <CardContent class="grid gap-6">
      <div class="grid auto-rows-min content-start gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="field in basicGroup?.fields || []"
            :key="field.key"
            class="grid gap-1"
          >
            <Label class="text-muted-foreground">{{ field.label }}</Label>
            <WikiEnumSelect
              v-if="enumOptions(field.key).length"
              :model-value="formatSaveValue(fieldValue(table.fields[field.key]))"
              :options="enumOptions(field.key)"
              @update:model-value="updateField(table.fields[field.key], $event)"
            />
            <Input
              v-else
              :model-value="formatSaveValue(fieldValue(table.fields[field.key]))"
              @update:model-value="updateField(table.fields[field.key], String($event))"
            />
          </div>
      </div>

      <SaveCharacterPortraitEditor
        v-if="hasPortraitFields"
        :save="save"
        :table="table"
        :draft="draft"
        @update-field="(field, value, rowIndex) => emit('updateField', field, value, rowIndex)"
      />

      <div
        v-for="group in detailGroups"
        :key="group.key"
        class="grid gap-3"
      >
        <div class="text-sm font-medium">{{ group.title }}</div>
        <div class="grid auto-rows-min gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="field in group.fields"
            :key="field.key"
            class="grid gap-1"
          >
            <Label class="text-muted-foreground">{{ field.label }}</Label>
            <WikiEnumSelect
              v-if="enumOptions(field.key).length"
              :model-value="formatSaveValue(fieldValue(table.fields[field.key]))"
              :options="enumOptions(field.key)"
              @update:model-value="updateField(table.fields[field.key], $event)"
            />
            <Input
              v-else
              :model-value="formatSaveValue(fieldValue(table.fields[field.key]))"
              @update:model-value="updateField(table.fields[field.key], String($event))"
            />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
