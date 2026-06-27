<script lang="ts">
export type PlayerPortraitPartKey =
  | "qianfa"
  | "houfa"
  | "maozi"
  | "meimao"
  | "lianshi"
  | "yifu"
  | "houbei"
  | "huzi";

export type PlayerPortraitValues = Partial<Record<PlayerPortraitPartKey, string>>;
</script>

<script setup lang="ts">
import EditableStepperField from "~/components/tools/save-edit/fields/EditableStepperField.vue";
import PlayerPortrait from "./PlayerPortrait.vue";

type PortraitOption = {
  name: string;
  display_name: string | null;
  type_id: number;
  sex_id: number;
  sort_order: number;
};

type PortraitControl = {
  key: PlayerPortraitPartKey;
  label: string;
  typeId: number;
};

const props = withDefaults(defineProps<{
  sex: number;
  values: PlayerPortraitValues;
  initialValues: PlayerPortraitValues;
  fallback?: string;
  disabled?: boolean;
  portraitClass?: string;
}>(), {
  fallback: "",
  disabled: false,
  portraitClass: "h-[260px] w-full max-w-[210px]",
});

const emit = defineEmits<{
  updateSex: [value: number];
  updatePart: [key: PlayerPortraitPartKey, value: string];
}>();

const portraitControls: PortraitControl[] = [
  { key: "lianshi", label: "脸型", typeId: 1 },
  { key: "meimao", label: "眉毛", typeId: 5 },
  { key: "houfa", label: "眼睛", typeId: 6 },
  { key: "maozi", label: "嘴巴", typeId: 7 },
  { key: "qianfa", label: "头部", typeId: 10 },
  { key: "huzi", label: "胡子", typeId: 8 },
];

const portraitPartTypeIds: Record<PlayerPortraitPartKey, number> = {
  qianfa: 10,
  houfa: 6,
  maozi: 7,
  meimao: 5,
  lianshi: 1,
  yifu: 9,
  houbei: 0,
  huzi: 8,
};

// 排序偏移：yifu 的序号从 100 起，其余从 0 起。减掉偏移后即“当前性别排序列表里的位置 N”。
const portraitSortOffsets: Record<PlayerPortraitPartKey, number> = {
  qianfa: 0,
  houfa: 0,
  maozi: 0,
  meimao: 0,
  lianshi: 0,
  yifu: 100,
  houbei: 0,
  huzi: 0,
};

const portraitPartKeys = Object.keys(portraitPartTypeIds) as PlayerPortraitPartKey[];

const { queryRows } = useWikiDb();
const { data: portraitData } = await useAsyncData(
  "save-edit-player-portrait-editor-options",
  () =>
    queryRows<PortraitOption>(
      `SELECT name, display_name, type_id, sex_id, sort_order
       FROM portrait_part_options
       WHERE is_player = 1
       ORDER BY sex_id, type_id, sort_order, name`,
    ),
  { server: false },
);

const portraitOptions = computed(() => portraitData.value || []);
// 胡子在女性下没有选项 → 控件禁用（不隐藏，否则无法切回）。
const visiblePortraitControls = computed(() => portraitControls);

// 展示组件按“当前性别排序列表里的位置 N”取部件，stepper 的值也是这个 N（与性别解耦）。
const portraitPartIds = computed(() =>
  Object.fromEntries(portraitPartKeys.map((key) => [key, portraitCurrentIndex(key)])) as Record<PlayerPortraitPartKey, number>,
);

// 某性别下该部位排序后的选项列表（与 PlayerPortrait 的排序一致，保证位置 N 对得上）。
function portraitOptionsFor(fieldName: PlayerPortraitPartKey, sex: number) {
  const typeId = portraitPartTypeIds[fieldName];
  return portraitOptions.value
    .filter((option) => option.type_id === typeId && option.sex_id === sex)
    .sort((left, right) =>
      portraitOptionSortNumber(fieldName, left) - portraitOptionSortNumber(fieldName, right) ||
      left.name.localeCompare(right.name),
    );
}

function portraitOptionSortNumber(fieldName: PlayerPortraitPartKey, option: PortraitOption) {
  const number = portraitFirstNumber(option.name);
  if (Number.isNaN(number)) return Number.MAX_SAFE_INTEGER;
  return number - portraitSortOffsets[fieldName];
}

// 取字符串里第一段数字（部位名本身不含数字，所以这就是部件序号）。与性别解耦。
function portraitFirstNumber(text: string) {
  const match = text.match(/(\d+)/);
  return match ? Number(match[1]) : NaN;
}

// 从字段值解出“当前性别排序列表里的位置 N”：按序号在列表里 findIndex 定位，对编号有缺口的部位也正确。
function portraitValueIndex(value: string, fieldName: PlayerPortraitPartKey, sex: number) {
  const number = portraitFirstNumber(value);
  if (Number.isNaN(number)) return -1;
  return portraitOptionsFor(fieldName, sex).findIndex(
    (option) => portraitFirstNumber(option.name) === number,
  );
}

function portraitCurrentIndex(fieldName: PlayerPortraitPartKey) {
  return portraitValueIndex(props.values[fieldName] || "", fieldName, props.sex);
}

function portraitInitialIndex(fieldName: PlayerPortraitPartKey) {
  return portraitValueIndex(props.initialValues[fieldName] || "", fieldName, props.sex);
}

// 把位置 N 在指定性别下编码回字段值，越界返回 null。
// 关键：保持与原值相同的格式——原值是纯数字（裸索引）就写裸数字，否则写 option 完整 name，
// 避免把名字串写进游戏期望整数索引的字段（或反之）导致存档字段不同步。
function portraitEncode(fieldName: PlayerPortraitPartKey, index: number, sex: number) {
  if (index < 0) return null;
  const option = portraitOptionsFor(fieldName, sex)[index];
  if (!option) return null;
  const current = props.values[fieldName] || props.initialValues[fieldName] || "";
  if (/^\d+$/.test(current)) return String(portraitFirstNumber(option.name));
  return option.name;
}

// 当前性别下该部位可选数量（决定 stepper 的 max 和胡子的禁用）。
function portraitOptionCount(control: PortraitControl) {
  return portraitOptionsFor(control.key, props.sex).length;
}

function portraitControlDisabled(control: PortraitControl) {
  return portraitOptionCount(control) === 0;
}

// stepper 如实显示字段里的位置 N（与性别解耦：不因切性别塌缩成 "-"）。
function portraitOptionNumber(control: PortraitControl) {
  const index = portraitCurrentIndex(control.key);
  return index >= 0 ? String(index) : "-";
}

function portraitInitialOptionNumber(control: PortraitControl) {
  const index = portraitInitialIndex(control.key);
  return index >= 0 ? String(index) : "-";
}

// dirty 以位置 N 为准，与字段字符串级 dirty 解耦：切性别只改后缀、N 不变 → stepper 不 dirty。
function portraitControlDirty(control: PortraitControl) {
  return portraitCurrentIndex(control.key) !== portraitInitialIndex(control.key);
}

// 当前 N 超出该性别可选范围时给出错误（不隐藏控件）；该部位本就无选项（女胡子）时只禁用不报错。
function portraitOptionError(control: PortraitControl) {
  if (portraitControlDisabled(control)) return "";
  const count = portraitOptionCount(control);
  const index = portraitCurrentIndex(control.key);
  if (index < 0 || index >= count) return `超出当前性别范围（0-${count - 1}）`;
  return "";
}

function setSex(value: number) {
  if (props.disabled || value === props.sex) return;
  // 切性别时保持每个部位的位置 N 不变，按新性别重新编码字段值（toubu3nan → toubu3nv）。
  // 新性别没有对应位置（如索引越界）则保留原值，由 stepper 的 error 提示。
  for (const key of portraitPartKeys) {
    const index = portraitCurrentIndex(key);
    if (index < 0) continue;
    const next = portraitEncode(key, index, value);
    if (next != null && next !== (props.values[key] || "")) {
      emit("updatePart", key, next);
    }
  }
  emit("updateSex", value);
}

function setPortraitOption(control: PortraitControl, value: string) {
  const next = Number(value);
  if (!Number.isFinite(next)) return;
  const name = portraitEncode(control.key, next, props.sex);
  if (name == null) return;
  emit("updatePart", control.key, name);
}
</script>

<template>
  <div class="grid auto-rows-min gap-4">
    <div class="grid justify-items-center gap-3 rounded-md border bg-muted/10 p-3">
      <PlayerPortrait
        :class="portraitClass"
        :sex="sex"
        :qianfa="portraitPartIds.qianfa"
        :houfa="portraitPartIds.houfa"
        :maozi="portraitPartIds.maozi"
        :meimao="portraitPartIds.meimao"
        :lianshi="portraitPartIds.lianshi"
        :yifu="portraitPartIds.yifu"
        :houbei="portraitPartIds.houbei"
        :huzi="portraitPartIds.huzi"
        :fallback="fallback"
      />

      <div class="grid w-full grid-cols-2 gap-2">
        <AppButton
          type="button"
          :variant="sex === 0 ? 'default' : 'outline'"
          size="sm"
          :disabled="disabled"
          @click="setSex(0)"
        >
          男
        </AppButton>
        <AppButton
          type="button"
          :variant="sex === 1 ? 'default' : 'outline'"
          size="sm"
          :disabled="disabled"
          @click="setSex(1)"
        >
          女
        </AppButton>
      </div>
    </div>

    <div class="grid gap-3 grid-cols-2 lg:grid-cols-1">
      <AppFieldStack
        v-for="control in visiblePortraitControls"
        :key="control.key"
        :label="control.label"
      >
        <EditableStepperField
          :initial-value="portraitInitialOptionNumber(control)"
          :model-value="portraitOptionNumber(control)"
          :dirty="portraitControlDirty(control)"
          :error="portraitOptionError(control)"
          :min="0"
          :max="Math.max(0, portraitOptionCount(control) - 1)"
          :disabled="disabled || portraitControlDisabled(control)"
          compact
          @update="setPortraitOption(control, $event)"
        />
      </AppFieldStack>
    </div>
  </div>
</template>
