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

const portraitLegacyPrefixes: Record<PlayerPortraitPartKey, string> = {
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
const visiblePortraitControls = computed(() =>
  portraitControls.filter((control) => props.sex !== 1 || control.key !== "huzi"),
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
const portraitControlOptions = computed(() => {
  const result: Partial<Record<PlayerPortraitPartKey, PortraitOption[]>> = {};
  for (const control of portraitControls) {
    result[control.key] = portraitOptionsFor(control.key, control.typeId);
  }
  return result;
});

function portraitOptionsFor(fieldName: PlayerPortraitPartKey, typeId: number) {
  return portraitOptions.value
    .filter((option) => option.type_id === typeId && option.sex_id === props.sex)
    .sort((left, right) =>
      portraitOptionSortNumber(fieldName, left) - portraitOptionSortNumber(fieldName, right) ||
      left.name.localeCompare(right.name),
    );
}

function portraitOptionSortNumber(fieldName: PlayerPortraitPartKey, option: PortraitOption) {
  const prefix = portraitLegacyPrefixes[fieldName];
  const number = Number(option.name.match(/(\d+)/)?.[1] ?? NaN);
  if (Number.isNaN(number)) return Number.MAX_SAFE_INTEGER;
  return prefix === "yfa" ? number - 100 : number;
}

function portraitLegacyIndex(fieldName: PlayerPortraitPartKey, typeId: number) {
  return portraitValueLegacyIndex(props.values[fieldName] || "", fieldName, typeId);
}

function portraitInitialLegacyIndex(fieldName: PlayerPortraitPartKey, typeId: number) {
  return portraitValueLegacyIndex(props.initialValues[fieldName] || "", fieldName, typeId);
}

function portraitValueLegacyIndex(value: string, fieldName: PlayerPortraitPartKey, typeId: number) {
  const legacyMatch = value.match(/_(\d+)$/);
  if (legacyMatch) return Number(legacyMatch[1]);

  const rows = portraitOptionsFor(fieldName, typeId);
  return rows.findIndex((option) => option.name === value);
}

function portraitOptionNumber(control: PortraitControl) {
  const index = portraitLegacyIndex(control.key, control.typeId);
  return index >= 0 ? String(index) : "-";
}

function portraitInitialOptionNumber(control: PortraitControl) {
  const index = portraitInitialLegacyIndex(control.key, control.typeId);
  return index >= 0 ? String(index) : "-";
}

function portraitLegacyCode(fieldName: PlayerPortraitPartKey, index: number) {
  const prefix = portraitLegacyPrefixes[fieldName] || fieldName;
  return `${prefix}_${String(index).padStart(2, "0")}`;
}

function setSex(value: number) {
  if (props.disabled || value === props.sex) return;
  emit("updateSex", value);
}

function setPortraitOption(control: PortraitControl, value: string) {
  const next = Number(value);
  if (!Number.isFinite(next)) return;
  emit("updatePart", control.key, portraitLegacyCode(control.key, next));
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
          :min="0"
          :max="Math.max(0, (portraitControlOptions[control.key] || []).length - 1)"
          :disabled="disabled || !(portraitControlOptions[control.key] || []).length"
          compact
          @update="setPortraitOption(control, $event)"
        />
      </AppFieldStack>
    </div>
  </div>
</template>
