<script setup lang="ts">
import EditableTableCardHeader from "../EditableTableCardHeader.vue";
import PlayerPortrait from "./PlayerPortrait.vue";
import LifeSkillFieldEditor from "./LifeSkillFieldEditor.vue";
import EditableStepperField from "~/components/tools/save-edit/fields/EditableStepperField.vue";
import SaveFieldEditor from "~/components/tools/save-edit/fields/SaveFieldEditor.vue";
import {
  fieldDraftKey,
  formatSaveValue,
  parseFieldDraftKey,
  saveEditEnumOptions,
  saveEditCharacterName,
  type SaveEditDraft,
  type SaveEditFile,
} from "~/components/tools/save-edit/model";
import type { BgDatabaseField, BgDatabaseTable, BgDatabaseValue } from "~/lib/bgdatabase";
import type { WikiEnums } from "~/lib/wiki/text";

type PortraitOption = {
  name: string;
  display_name: string | null;
  type_id: number;
  sex_id: number;
  sort_order: number;
};

type PortraitControl = {
  key: string;
  label: string;
  typeId: number;
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

const portraitFieldKeys = ["qianfa", "houfa", "maozi", "meimao", "lianshi", "yifu", "houbei", "huzi"];
const basicFieldKeys = [
  "xing",
  "ming",
  "menpai",
  "diwei",
  "old",
  "maxold",
  "gold",
  "mingsheng",
  "xiayi",
  "gongxian",
  "xingdongli",
  "maxxingdongli",
  "chenghao",
];
const attributeFieldKeys = ["lvli", "gengu", "tipo", "shenfa", "lvli_plus", "genfu_plus", "tipo_plus", "shenfa_plus"];
const martialFieldKeys = ["wuxuexiuwei", "quanzhang", "daojian", "qiangbang", "anqi", "neigong", "maxwugongqty"];
const lifeFieldKeys = ["wakuang", "caiyao", "dalie", "duanzao", "liandan", "caifeng"];
const equipmentFieldKeys = ["wq1_uid", "wq2_uid", "fj_uid"];

const portraitControls: PortraitControl[] = [
  { key: "lianshi", label: "脸型", typeId: 1 },
  { key: "meimao", label: "眉毛", typeId: 5 },
  { key: "houfa", label: "眼睛", typeId: 6 },
  { key: "maozi", label: "嘴巴", typeId: 7 },
  { key: "qianfa", label: "头部", typeId: 10 },
  { key: "huzi", label: "胡子", typeId: 8 },
];

const portraitLegacyPrefixes: Record<string, string> = {
  qianfa: "qa",
  houfa: "ha",
  maozi: "mza",
  meimao: "mma",
  lianshi: "lsa",
  yifu: "yfa",
  houbei: "bha",
  huzi: "hz",
};

const { queryRows } = useWikiDb();

const { data: portraitData } = await useAsyncData(
  "save-edit-character-zhu-jue-portrait-options",
  async () => {
    return queryRows<PortraitOption>(
      `SELECT name, display_name, type_id, sex_id, sort_order
       FROM portrait_part_options
       WHERE is_player = 1
       ORDER BY sex_id, type_id, sort_order, name`,
    );
  },
  { server: false },
);

const hasPortraitFields = computed(() => groupHasFields(portraitFieldKeys));
const hasBasicFields = computed(() => groupHasFields(basicFieldKeys));
const hasAttributeFields = computed(() => groupHasFields(attributeFieldKeys));
const hasMartialFields = computed(() => groupHasFields(martialFieldKeys));
const hasLifeFields = computed(() => groupHasFields(lifeFieldKeys));
const hasEquipmentFields = computed(() => groupHasFields(equipmentFieldKeys));
const portraitOptions = computed(() => portraitData.value || []);
const sexId = computed(() => Number(formatSaveValue(fieldValue(props.table.fields.sex)) || 0));
const characterName = computed(() => saveEditCharacterName(props.save, props.draft));
const parsedFields = computed(() =>
  props.table.fieldNames
    .map((fieldName) => props.table.fields[fieldName])
    .filter((field): field is BgDatabaseField => Boolean(field?.parsed)),
);
const tableDirty = computed(() =>
  Object.keys(props.draft).some((key) => parseFieldDraftKey(key)?.tableIndex === props.table.tableIndex),
);

const portraitControlOptions = computed(() => {
  const result: Record<string, PortraitOption[]> = {};
  for (const control of portraitControls) {
    result[control.key] = portraitOptionsFor(control.key, control.typeId);
  }
  return result;
});
const visiblePortraitControls = computed(() =>
  portraitControls.filter((control) => sexId.value !== 1 || control.key !== "huzi"),
);
const portraitPartIds = computed(() => ({
  qianfa: portraitLegacyIndex("qianfa", 10),
  houfa: portraitLegacyIndex("houfa", 6),
  maozi: portraitLegacyIndex("maozi", 7),
  meimao: portraitLegacyIndex("meimao", 5),
  lianshi: portraitLegacyIndex("lianshi", 1),
  yifu: portraitLegacyIndex("yifu", 9),
  houbei: portraitLegacyIndex("houbei", 0),
  huzi: portraitLegacyIndex("huzi", 8),
}));

function fieldValue(field: BgDatabaseField | undefined): BgDatabaseValue {
  if (!field) return null;
  const key = fieldDraftKey(field, 0);
  return props.draft[key] ?? field.values[0] ?? null;
}

function fieldCurrentText(fieldName: string) {
  return formatSaveValue(fieldValue(props.table.fields[fieldName]));
}

function fieldInitialText(fieldName: string) {
  return formatSaveValue(props.table.fields[fieldName]?.values[0]);
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
  for (const field of parsedFields.value) {
    const initialValue = fieldInitialText(field.name);
    if (fieldDraftKey(field, 0) in props.draft) emitField(field, initialValue);
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

function portraitOptionIndex(control: PortraitControl) {
  return portraitLegacyIndex(control.key, control.typeId);
}

function portraitOptionNumber(control: PortraitControl) {
  const index = portraitOptionIndex(control);
  return index >= 0 ? index : "-";
}

function portraitInitialOptionNumber(control: PortraitControl) {
  const index = portraitInitialLegacyIndex(control.key, control.typeId);
  return index >= 0 ? String(index) : "-";
}

function portraitOptionsFor(fieldName: string, typeId: number) {
  return portraitOptions.value
    .filter((option) => option.type_id === typeId && option.sex_id === sexId.value)
    .sort((left, right) =>
      portraitOptionSortNumber(fieldName, left) - portraitOptionSortNumber(fieldName, right) ||
      left.name.localeCompare(right.name),
    );
}

function portraitOptionSortNumber(fieldName: string, option: PortraitOption) {
  const prefix = portraitLegacyPrefixes[fieldName];
  const number = Number(option.name.match(/(\d+)/)?.[1] ?? NaN);
  if (Number.isNaN(number)) return Number.MAX_SAFE_INTEGER;
  return prefix === "yfa" ? number - 100 : number;
}

function portraitLegacyIndex(fieldName: string, typeId: number) {
  const value = formatSaveValue(fieldValue(props.table.fields[fieldName]));
  const legacyMatch = value.match(/_(\d+)$/);
  if (legacyMatch) return Number(legacyMatch[1]);

  const rows = portraitOptionsFor(fieldName, typeId);
  return rows.findIndex((option) => option.name === value);
}

function portraitInitialLegacyIndex(fieldName: string, typeId: number) {
  const value = formatSaveValue(props.table.fields[fieldName]?.values[0]);
  const legacyMatch = value.match(/_(\d+)$/);
  if (legacyMatch) return Number(legacyMatch[1]);

  const rows = portraitOptionsFor(fieldName, typeId);
  return rows.findIndex((option) => option.name === value);
}

function portraitLegacyCode(fieldName: string, index: number) {
  const prefix = portraitLegacyPrefixes[fieldName] || fieldName;
  return `${prefix}_${String(index).padStart(2, "0")}`;
}

function setPortraitOption(control: PortraitControl, value: string) {
  const next = Number(value);
  if (!Number.isFinite(next)) return;
  setField(control.key, portraitLegacyCode(control.key, next));
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
      <div v-if="hasPortraitFields" class="grid auto-rows-min gap-4">
        <div class="grid justify-items-center gap-3 rounded-md border bg-muted/10 p-3">
          <PlayerPortrait
            class="h-[260px] w-full max-w-[210px]"
            :sex="sexId"
            :qianfa="portraitPartIds.qianfa"
            :houfa="portraitPartIds.houfa"
            :maozi="portraitPartIds.maozi"
            :meimao="portraitPartIds.meimao"
            :lianshi="portraitPartIds.lianshi"
            :yifu="portraitPartIds.yifu"
            :houbei="portraitPartIds.houbei"
            :huzi="portraitPartIds.huzi"
            :fallback="characterName.slice(0, 1)"
          />

          <div class="grid w-full grid-cols-2 gap-2">
            <AppButton
              type="button"
              :variant="sexId === 0 ? 'default' : 'outline'"
              size="sm"
              @click="setSex(0)"
            >
              男
            </AppButton>
            <AppButton
              type="button"
              :variant="sexId === 1 ? 'default' : 'outline'"
              size="sm"
              @click="setSex(1)"
            >
              女
            </AppButton>
          </div>
        </div>

        <div class="grid gap-3">
          <div
            v-for="control in visiblePortraitControls"
            :key="control.key"
            class="grid gap-1"
          >
            <Label class="text-muted-foreground">{{ control.label }}</Label>
            <EditableStepperField
              :initial-value="portraitInitialOptionNumber(control)"
              :model-value="String(portraitOptionNumber(control))"
              :min="0"
              :max="Math.max(0, (portraitControlOptions[control.key] || []).length - 1)"
              :disabled="!(portraitControlOptions[control.key] || []).length"
              compact
              @update="setPortraitOption(control, $event)"
            />
          </div>
        </div>
      </div>

      <div class="grid auto-rows-min gap-5">
        <div v-if="hasBasicFields" class="grid gap-3">
          <div class="text-sm font-medium">基础信息</div>
          <div class="grid auto-rows-min gap-3 grid-cols-2 xl:grid-cols-4">
            <div v-if="hasField('xing')" class="grid gap-1">
              <Label class="text-muted-foreground">姓 / 名</Label>
              <div class="flex items-center gap-2">
                <SaveFieldEditor
                  :field="field('xing')"
                  :draft="draft"
                  :enum-options="enumOptions('xing')"
                  compact
                  @update="updateField"
                />
                <SaveFieldEditor
                  :field="field('ming')"
                  :draft="draft"
                  :enum-options="enumOptions('ming')"
                  compact
                  @update="updateField"
                />
              </div>
            </div>
            <div v-if="hasField('old')" class="grid gap-1">
              <Label class="text-muted-foreground">年龄 / 寿命</Label>
              <div class="flex items-center gap-2">
                <SaveFieldEditor
                  :field="field('old')"
                  :draft="draft"
                  :enum-options="enumOptions('old')"
                  compact
                  @update="updateField"
                />
                <SaveFieldEditor
                  :field="field('maxold')"
                  :draft="draft"
                  :enum-options="enumOptions('maxold')"
                  compact
                  @update="updateField"
                />
              </div>
            </div>
            <div v-if="hasField('menpai')" class="grid gap-1">
              <Label class="text-muted-foreground">门派 / 地位</Label>
              <div class="flex items-center gap-2">
                <SaveFieldEditor
                  :field="field('menpai')"
                  :draft="draft"
                  :enum-options="enumOptions('menpai')"
                  compact
                  @update="updateField"
                />
                <SaveFieldEditor
                  :field="field('diwei')"
                  :draft="draft"
                  :enum-options="enumOptions('diwei')"
                  compact
                  @update="updateField"
                />
              </div>
            </div>
            <div v-if="hasField('mingsheng')" class="grid gap-1">
              <Label class="text-muted-foreground">名声 / 侠义</Label>
              <div class="flex items-center gap-2">
                <SaveFieldEditor
                  :field="field('mingsheng')"
                  :draft="draft"
                  :enum-options="enumOptions('mingsheng')"
                  compact
                  @update="updateField"
                />
                <SaveFieldEditor
                  :field="field('xiayi')"
                  :draft="draft"
                  :enum-options="enumOptions('xiayi')"
                  compact
                  @update="updateField"
                />
              </div>
            </div>
            <div v-if="hasField('xingdongli')" class="grid gap-1">
              <Label class="text-muted-foreground">行动力 / 最大行动力</Label>
              <div class="flex items-center gap-2">
                <SaveFieldEditor
                  :field="field('xingdongli')"
                  :draft="draft"
                  :enum-options="enumOptions('xingdongli')"
                  compact
                  @update="updateField"
                />
                <SaveFieldEditor
                  :field="field('maxxingdongli')"
                  :draft="draft"
                  :enum-options="enumOptions('maxxingdongli')"
                  compact
                  @update="updateField"
                />
              </div>
            </div>
            <div v-if="hasField('gold')" class="grid gap-1">
              <Label class="text-muted-foreground">银两</Label>
              <SaveFieldEditor
                :field="field('gold')"
                :draft="draft"
                :enum-options="enumOptions('gold')"
                compact
                @update="updateField"
              />
            </div>
            <div v-if="hasField('gongxian')" class="grid gap-1">
              <Label class="text-muted-foreground">贡献</Label>
              <SaveFieldEditor
                :field="field('gongxian')"
                :draft="draft"
                :enum-options="enumOptions('gongxian')"
                compact
                @update="updateField"
              />
            </div>
            <div v-if="hasField('chenghao')" class="grid gap-1">
              <Label class="text-muted-foreground">称号</Label>
              <SaveFieldEditor
                :field="field('chenghao')"
                :draft="draft"
                :enum-options="enumOptions('chenghao')"
                compact
                @update="updateField"
              />
            </div>
          </div>
        </div>

        <div v-if="hasAttributeFields" class="grid gap-3">
          <div class="text-sm font-medium">基础属性</div>
          <div class="grid auto-rows-min gap-3 grid-cols-2 xl:grid-cols-4">
            <div v-if="hasField('lvli')" class="grid gap-1">
              <Label class="text-muted-foreground">膂力 / 额外膂力</Label>
              <div class="flex items-center gap-2">
                <SaveFieldEditor
                  :field="field('lvli')"
                  :draft="draft"
                  :enum-options="enumOptions('lvli')"
                  compact
                  @update="updateField"
                />
                <SaveFieldEditor
                  :field="field('lvli_plus')"
                  :draft="draft"
                  :enum-options="enumOptions('lvli_plus')"
                  compact
                  @update="updateField"
                />
              </div>
            </div>
            <div v-if="hasField('gengu')" class="grid gap-1">
              <Label class="text-muted-foreground">根骨 / 额外根骨</Label>
              <div class="flex items-center gap-2">
                <SaveFieldEditor
                  :field="field('gengu')"
                  :draft="draft"
                  :enum-options="enumOptions('gengu')"
                  compact
                  @update="updateField"
                />
                <SaveFieldEditor
                  :field="field('genfu_plus')"
                  :draft="draft"
                  :enum-options="enumOptions('genfu_plus')"
                  compact
                  @update="updateField"
                />
              </div>
            </div>
            <div v-if="hasField('tipo')" class="grid gap-1">
              <Label class="text-muted-foreground">体魄 / 额外体魄</Label>
              <div class="flex items-center gap-2">
                <SaveFieldEditor
                  :field="field('tipo')"
                  :draft="draft"
                  :enum-options="enumOptions('tipo')"
                  compact
                  @update="updateField"
                />
                <SaveFieldEditor
                  :field="field('tipo_plus')"
                  :draft="draft"
                  :enum-options="enumOptions('tipo_plus')"
                  compact
                  @update="updateField"
                />
              </div>
            </div>
            <div v-if="hasField('shenfa')" class="grid gap-1">
              <Label class="text-muted-foreground">身法 / 额外身法</Label>
              <div class="flex items-center gap-2">
                <SaveFieldEditor
                  :field="field('shenfa')"
                  :draft="draft"
                  :enum-options="enumOptions('shenfa')"
                  compact
                  @update="updateField"
                />
                <SaveFieldEditor
                  :field="field('shenfa_plus')"
                  :draft="draft"
                  :enum-options="enumOptions('shenfa_plus')"
                  compact
                  @update="updateField"
                />
              </div>
            </div>
          </div>
        </div>

        <div v-if="hasMartialFields" class="grid gap-3">
          <div class="text-sm font-medium">武艺</div>
          <div class="grid auto-rows-min gap-3 grid-cols-2 xl:grid-cols-4">
            <div v-if="hasField('wuxuexiuwei')" class="grid gap-1">
              <Label class="text-muted-foreground">武学修为</Label>
              <SaveFieldEditor
                :field="field('wuxuexiuwei')"
                :draft="draft"
                :enum-options="enumOptions('wuxuexiuwei')"
                compact
                @update="updateField"
              />
            </div>
            <div v-if="hasField('quanzhang')" class="grid gap-1">
              <Label class="text-muted-foreground">拳掌</Label>
              <SaveFieldEditor
                :field="field('quanzhang')"
                :draft="draft"
                :enum-options="enumOptions('quanzhang')"
                compact
                @update="updateField"
              />
            </div>
            <div v-if="hasField('daojian')" class="grid gap-1">
              <Label class="text-muted-foreground">刀剑</Label>
              <SaveFieldEditor
                :field="field('daojian')"
                :draft="draft"
                :enum-options="enumOptions('daojian')"
                compact
                @update="updateField"
              />
            </div>
            <div v-if="hasField('qiangbang')" class="grid gap-1">
              <Label class="text-muted-foreground">枪棒</Label>
              <SaveFieldEditor
                :field="field('qiangbang')"
                :draft="draft"
                :enum-options="enumOptions('qiangbang')"
                compact
                @update="updateField"
              />
            </div>
            <div v-if="hasField('anqi')" class="grid gap-1">
              <Label class="text-muted-foreground">暗器</Label>
              <SaveFieldEditor
                :field="field('anqi')"
                :draft="draft"
                :enum-options="enumOptions('anqi')"
                compact
                @update="updateField"
              />
            </div>
            <div v-if="hasField('neigong')" class="grid gap-1">
              <Label class="text-muted-foreground">内功</Label>
              <SaveFieldEditor
                :field="field('neigong')"
                :draft="draft"
                :enum-options="enumOptions('neigong')"
                compact
                @update="updateField"
              />
            </div>
            <div v-if="hasField('wxexp')" class="grid gap-1">
              <Label class="text-muted-foreground">武学经验</Label>
              <SaveFieldEditor
                :field="field('wxexp')"
                :draft="draft"
                :enum-options="enumOptions('wxexp')"
                compact
                @update="updateField"
              />
            </div>
            <div v-if="hasField('maxwugongqty')" class="grid gap-1">
              <Label class="text-muted-foreground">武功上限</Label>
              <SaveFieldEditor
                :field="field('maxwugongqty')"
                :draft="draft"
                :enum-options="enumOptions('maxwugongqty')"
                compact
                @update="updateField"
              />
            </div>
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
