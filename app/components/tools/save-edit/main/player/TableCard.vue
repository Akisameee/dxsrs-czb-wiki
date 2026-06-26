<script setup lang="ts">
import EditableTableCardHeader from "../EditableTableCardHeader.vue";
import PlayerPortraitEditor, { type PlayerPortraitPartKey, type PlayerPortraitValues } from "./PlayerPortraitEditor.vue";
import LifeSkillFieldEditor from "./LifeSkillFieldEditor.vue";
import SaveFieldEditor from "~/components/tools/save-edit/fields/SaveFieldEditor.vue";
import {
  formatSaveValue,
  saveEditEnumOptions,
  saveEditCharacterName,
  type SaveEditDraft,
  type SaveEditFile,
} from "~/lib/save-edit";
import type { BgDatabaseField, BgDatabaseTable, BgDatabaseValue } from "~/lib/save-edit";
import type { WikiEnums } from "~/lib/wiki/text";

const props = defineProps<{
  table: BgDatabaseTable;
  save: SaveEditFile;
  draft: SaveEditDraft;
  enums: WikiEnums;
}>();

const emit = defineEmits<{
  updateField: [field: BgDatabaseField, value: string, rowIndex: number];
}>();

const index = useSaveEditTableViewIndex(toRef(props, "table"), toRef(props, "draft"));

const portraitFieldKeys: PlayerPortraitPartKey[] = ["qianfa", "houfa", "maozi", "meimao", "lianshi", "yifu", "houbei", "huzi"];
const basicFieldKeys = [
  "xing", "ming", "menpai", "diwei", "old", "maxold", "gold", "mingsheng",
  "xiayi", "gongxian", "xingdongli", "maxxingdongli", "chenghao",
];
const attributeFieldKeys = ["lvli", "gengu", "tipo", "shenfa", "lvli_plus", "genfu_plus", "tipo_plus", "shenfa_plus"];
const martialFieldKeys = ["wuxuexiuwei", "quanzhang", "daojian", "qiangbang", "anqi", "neigong", "maxwugongqty"];
const lifeFieldKeys = ["wakuang", "caiyao", "dalie", "duanzao", "liandan", "caifeng"];
const equipmentFieldKeys = ["wq1_uid", "wq2_uid", "fj_uid"];

const hasPortraitFields = computed(() => groupHasFields(portraitFieldKeys));
const hasBasicFields = computed(() => groupHasFields(basicFieldKeys));
const hasAttributeFields = computed(() => groupHasFields(attributeFieldKeys));
const hasMartialFields = computed(() => groupHasFields(martialFieldKeys));
const hasLifeFields = computed(() => groupHasFields(lifeFieldKeys));
const hasEquipmentFields = computed(() => groupHasFields(equipmentFieldKeys));
const sexId = computed(() => Number(formatSaveValue(fieldValue(props.table.fields.sex)) || 0));
const characterName = computed(() => saveEditCharacterName(props.save, props.draft));
const parsedFields = computed(() =>
  props.table.fieldNames
    .map((fieldName) => props.table.fields[fieldName])
    .filter((field): field is BgDatabaseField => Boolean(field?.parsed)),
);
const tableDirty = computed(() => index.dirty.value);
const portraitValues = computed(() => portraitFieldValues(false));
const initialPortraitValues = computed(() => portraitFieldValues(true));

function fieldValue(field: BgDatabaseField | undefined): BgDatabaseValue {
  return index.field(field, 0).value;
}

function fieldCurrentText(fieldName: string) {
  return index.text(props.table.fields[fieldName], 0);
}

function fieldInitialText(fieldName: string) {
  return index.initialText(props.table.fields[fieldName], 0);
}

function fieldView(fieldName: string) {
  return index.field(props.table.fields[fieldName], 0);
}

function field(fieldName: string) {
  return props.table.fields[fieldName];
}

function hasField(fieldName: string) {
  return Boolean(field(fieldName)?.parsed);
}

function groupHasFields(fieldNames: string[]) {
  return fieldNames.some(hasField);
}

function emitField(field: BgDatabaseField | undefined, value: string, rowIndex = 0) {
  if (field) emit("updateField", field, value, rowIndex);
}

function updateField(field: BgDatabaseField | undefined, value: string, rowIndex = 0) {
  if (field && field === props.table.fields.sex) {
    setSex(Number(value));
    return;
  }
  emitField(field, value, rowIndex);
}

function resetTable() {
  for (const f of parsedFields.value) {
    const fv = index.field(f, 0);
    if (fv.dirty) emitField(f, fv.initialText);
  }
}

function enumOptions(fieldName: string) {
  return saveEditEnumOptions(props.enums, props.table.name, fieldName);
}

function setField(fieldName: string, value: string) {
  emitField(props.table.fields[fieldName], value);
}

function setSex(value: number) {
  if (value === sexId.value) return;
  setField("sex", String(value));
}

function setPortraitOption(key: PlayerPortraitPartKey, value: string) {
  setField(key, value);
}

function portraitFieldValues(initial: boolean) {
  return Object.fromEntries(
    portraitFieldKeys.map((key) => [
      key,
      initial ? fieldInitialText(key) : fieldCurrentText(key),
    ]),
  ) as PlayerPortraitValues;
}
</script>

<template>
  <AppCard>
    <EditableTableCardHeader
      title="主角信息"
      :dirty="tableDirty"
      @reset="resetTable"
    />
    <AppCardContent :class="hasPortraitFields ? 'grid gap-6 lg:grid-cols-[240px_1fr]' : 'grid gap-6'">
      <PlayerPortraitEditor
        v-if="hasPortraitFields"
        :sex="sexId"
        :values="portraitValues"
        :initial-values="initialPortraitValues"
        :fallback="characterName.slice(0, 1)"
        @update-sex="setSex"
        @update-part="setPortraitOption"
      />

      <div class="grid auto-rows-min gap-5">
        <div v-if="hasBasicFields" class="grid gap-3">
          <div class="text-sm font-medium">基础信息</div>
          <div class="grid auto-rows-min gap-3 grid-cols-2 xl:grid-cols-4">
            <div v-if="hasField('xing')" class="flex items-center gap-2">
              <AppFieldStack class="flex-1" label="姓">
                <SaveFieldEditor :field-view="fieldView('xing')" :enum-options="enumOptions('xing')" compact @update="updateField" />
              </AppFieldStack>
              <AppFieldStack class="flex-1" label="名">
                <SaveFieldEditor :field-view="fieldView('ming')" :enum-options="enumOptions('ming')" compact @update="updateField" />
              </AppFieldStack>
            </div>
            <div v-if="hasField('old')" class="flex items-center gap-2">
              <AppFieldStack class="flex-1" label="年龄">
                <SaveFieldEditor :field-view="fieldView('old')" :enum-options="enumOptions('old')" compact @update="updateField" />
              </AppFieldStack>
              <AppFieldStack class="flex-1" label="寿命">
                <SaveFieldEditor :field-view="fieldView('maxold')" :enum-options="enumOptions('maxold')" compact @update="updateField" />
              </AppFieldStack>
            </div>
            <div v-if="hasField('menpai')" class="flex items-center gap-2">
              <AppFieldStack class="flex-1" label="门派">
                <SaveFieldEditor :field-view="fieldView('menpai')" :enum-options="enumOptions('menpai')" compact @update="updateField" />
              </AppFieldStack>
              <AppFieldStack class="flex-1" label="地位">
                <SaveFieldEditor :field-view="fieldView('diwei')" :enum-options="enumOptions('diwei')" compact @update="updateField" />
              </AppFieldStack>
            </div>
            <div v-if="hasField('mingsheng')" class="flex items-center gap-2">
              <AppFieldStack class="flex-1" label="名声">
                <SaveFieldEditor :field-view="fieldView('mingsheng')" :enum-options="enumOptions('mingsheng')" compact @update="updateField" />
              </AppFieldStack>
              <AppFieldStack class="flex-1" label="侠义">
                <SaveFieldEditor :field-view="fieldView('xiayi')" :enum-options="enumOptions('xiayi')" compact @update="updateField" />
              </AppFieldStack>
            </div>
            <div v-if="hasField('xingdongli')" class="flex items-center gap-2">
              <AppFieldStack class="flex-1" label="行动力">
                <SaveFieldEditor :field-view="fieldView('xingdongli')" :enum-options="enumOptions('xingdongli')" compact @update="updateField" />
              </AppFieldStack>
              <AppFieldStack class="flex-1" label="最大行动力">
                <SaveFieldEditor :field-view="fieldView('maxxingdongli')" :enum-options="enumOptions('maxxingdongli')" compact @update="updateField" />
              </AppFieldStack>
            </div>
            <AppFieldStack v-if="hasField('gold')" label="银两">
              <SaveFieldEditor :field-view="fieldView('gold')" :enum-options="enumOptions('gold')" compact @update="updateField" />
            </AppFieldStack>
            <AppFieldStack v-if="hasField('gongxian')" label="贡献">
              <SaveFieldEditor :field-view="fieldView('gongxian')" :enum-options="enumOptions('gongxian')" compact @update="updateField" />
            </AppFieldStack>
            <AppFieldStack v-if="hasField('chenghao')" label="称号">
              <SaveFieldEditor :field-view="fieldView('chenghao')" :enum-options="enumOptions('chenghao')" compact @update="updateField" />
            </AppFieldStack>
          </div>
        </div>

        <div v-if="hasAttributeFields" class="grid gap-3">
          <div class="text-sm font-medium">基础属性</div>
          <div class="grid auto-rows-min gap-3 grid-cols-2 xl:grid-cols-4">
            <div v-if="hasField('lvli')" class="flex items-center gap-2">
              <AppFieldStack class="flex-1" label="膂力">
                <SaveFieldEditor :field-view="fieldView('lvli')" :enum-options="enumOptions('lvli')" compact @update="updateField" />
              </AppFieldStack>
              <AppFieldStack class="flex-1" label="额外膂力">
                <SaveFieldEditor :field-view="fieldView('lvli_plus')" :enum-options="enumOptions('lvli_plus')" compact @update="updateField" />
              </AppFieldStack>
            </div>
            <div v-if="hasField('gengu')" class="flex items-center gap-2">
              <AppFieldStack class="flex-1" label="根骨">
                <SaveFieldEditor :field-view="fieldView('gengu')" :enum-options="enumOptions('gengu')" compact @update="updateField" />
              </AppFieldStack>
              <AppFieldStack class="flex-1" label="额外根骨">
                <SaveFieldEditor :field-view="fieldView('genfu_plus')" :enum-options="enumOptions('genfu_plus')" compact @update="updateField" />
              </AppFieldStack>
            </div>
            <div v-if="hasField('tipo')" class="flex items-center gap-2">
              <AppFieldStack class="flex-1" label="体魄">
                <SaveFieldEditor :field-view="fieldView('tipo')" :enum-options="enumOptions('tipo')" compact @update="updateField" />
              </AppFieldStack>
              <AppFieldStack class="flex-1" label="额外体魄">
                <SaveFieldEditor :field-view="fieldView('tipo_plus')" :enum-options="enumOptions('tipo_plus')" compact @update="updateField" />
              </AppFieldStack>
            </div>
            <div v-if="hasField('shenfa')" class="flex items-center gap-2">
              <AppFieldStack class="flex-1" label="身法">
                <SaveFieldEditor :field-view="fieldView('shenfa')" :enum-options="enumOptions('shenfa')" compact @update="updateField" />
              </AppFieldStack>
              <AppFieldStack class="flex-1" label="额外身法">
                <SaveFieldEditor :field-view="fieldView('shenfa_plus')" :enum-options="enumOptions('shenfa_plus')" compact @update="updateField" />
              </AppFieldStack>
            </div>
          </div>
        </div>

        <div v-if="hasMartialFields" class="grid gap-3">
          <div class="text-sm font-medium">武艺</div>
          <div class="grid auto-rows-min gap-3 grid-cols-2 xl:grid-cols-4">
            <AppFieldStack v-if="hasField('wuxuexiuwei')" label="武学修为">
              <SaveFieldEditor :field-view="fieldView('wuxuexiuwei')" :enum-options="enumOptions('wuxuexiuwei')" compact @update="updateField" />
            </AppFieldStack>
            <AppFieldStack v-if="hasField('quanzhang')" label="拳掌">
              <SaveFieldEditor :field-view="fieldView('quanzhang')" :enum-options="enumOptions('quanzhang')" compact @update="updateField" />
            </AppFieldStack>
            <AppFieldStack v-if="hasField('daojian')" label="刀剑">
              <SaveFieldEditor :field-view="fieldView('daojian')" :enum-options="enumOptions('daojian')" compact @update="updateField" />
            </AppFieldStack>
            <AppFieldStack v-if="hasField('qiangbang')" label="枪棒">
              <SaveFieldEditor :field-view="fieldView('qiangbang')" :enum-options="enumOptions('qiangbang')" compact @update="updateField" />
            </AppFieldStack>
            <AppFieldStack v-if="hasField('anqi')" label="暗器">
              <SaveFieldEditor :field-view="fieldView('anqi')" :enum-options="enumOptions('anqi')" compact @update="updateField" />
            </AppFieldStack>
            <AppFieldStack v-if="hasField('neigong')" label="内功">
              <SaveFieldEditor :field-view="fieldView('neigong')" :enum-options="enumOptions('neigong')" compact @update="updateField" />
            </AppFieldStack>
            <AppFieldStack v-if="hasField('wxexp')" label="武学经验">
              <SaveFieldEditor :field-view="fieldView('wxexp')" :enum-options="enumOptions('wxexp')" compact @update="updateField" />
            </AppFieldStack>
            <AppFieldStack v-if="hasField('maxwugongqty')" label="武功上限">
              <SaveFieldEditor :field-view="fieldView('maxwugongqty')" :enum-options="enumOptions('maxwugongqty')" compact @update="updateField" />
            </AppFieldStack>
          </div>
        </div>

        <div v-if="hasLifeFields" class="grid gap-3">
          <div class="text-sm font-medium">技艺</div>
          <div class="grid auto-rows-min gap-3 grid-cols-2 xl:grid-cols-2">
            <div v-if="hasField('wakuang')" class="grid gap-1">
              <LifeSkillFieldEditor
                type="mining"
                :initial-value="fieldInitialText('wakuang')"
                :model-value="fieldCurrentText('wakuang')"
                label="挖矿"
                @update="setField('wakuang', $event)"
              />
            </div>
            <div v-if="hasField('duanzao')" class="grid gap-1">
              <LifeSkillFieldEditor
                type="forging"
                :initial-value="fieldInitialText('duanzao')"
                :model-value="fieldCurrentText('duanzao')"
                label="锻造"
                @update="setField('duanzao', $event)"
              />
            </div>
            <div v-if="hasField('caiyao')" class="grid gap-1">
              <LifeSkillFieldEditor
                type="herbGathering"
                :initial-value="fieldInitialText('caiyao')"
                :model-value="fieldCurrentText('caiyao')"
                label="采药"
                @update="setField('caiyao', $event)"
              />
            </div>
            <div v-if="hasField('liandan')" class="grid gap-1">
              <LifeSkillFieldEditor
                type="alchemy"
                :initial-value="fieldInitialText('liandan')"
                :model-value="fieldCurrentText('liandan')"
                label="炼丹"
                @update="setField('liandan', $event)"
              />
            </div>
            <div v-if="hasField('dalie')" class="grid gap-1">
              <LifeSkillFieldEditor
                type="hunting"
                :initial-value="fieldInitialText('dalie')"
                :model-value="fieldCurrentText('dalie')"
                label="打猎"
                @update="setField('dalie', $event)"
              />
            </div>
            <div v-if="hasField('caifeng')" class="grid gap-1">
              <LifeSkillFieldEditor
                type="sewing"
                :initial-value="fieldInitialText('caifeng')"
                :model-value="fieldCurrentText('caifeng')"
                label="裁缝"
                @update="setField('caifeng', $event)"
              />
            </div>
          </div>
        </div>
      </div>
    </AppCardContent>
  </AppCard>
</template>
