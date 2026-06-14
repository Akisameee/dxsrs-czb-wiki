<script setup lang="ts">
import { ChevronLeftIcon, ChevronRightIcon } from "@lucide/vue";
import {
  fieldDraftKey,
  formatSaveValue,
  saveEditCharacterName,
  type SaveEditDraft,
  type SaveEditFile,
} from "~/components/tools/save-edit/model";
import type { GameImageLayer, ComposedGameImage } from "~/composables/useGameImageAtlas";
import type { BgDatabaseField, BgDatabaseTable } from "~/lib/bgdatabase";

type PortraitOption = {
  name: string;
  display_name: string | null;
  type_id: number;
  sex_id: number;
  sort_order: number;
};

type PortraitAsset = {
  name: string;
  image_id: string | null;
  slot_id: number;
  sex: string | null;
  parent: string | null;
};

type PortraitControl = {
  key: string;
  label: string;
  typeId: number;
};

const props = defineProps<{
  save: SaveEditFile;
  table: BgDatabaseTable;
  draft: SaveEditDraft;
}>();

const emit = defineEmits<{
  updateField: [field: BgDatabaseField, value: string, rowIndex: number];
}>();

const controls: PortraitControl[] = [
  { key: "lianshi", label: "脸型", typeId: 1 },
  { key: "meimao", label: "眉毛", typeId: 5 },
  { key: "houfa", label: "眼睛", typeId: 6 },
  { key: "maozi", label: "嘴巴", typeId: 7 },
  { key: "qianfa", label: "头部", typeId: 10 },
  { key: "huzi", label: "胡子", typeId: 8 },
];

const layerOrder: Record<number, number> = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  10: 10,
  11: 11,
  12: 12,
  13: 13,
};

const { queryRows } = useWikiDb();
const { composeImageLayers, pending: atlasPending } = useGameImageAtlas();
const image = shallowRef<ComposedGameImage | null>(null);
const missingAssets = ref<string[]>([]);
const loading = ref(false);

const { data: portraitData } = await useAsyncData(
  "save-edit-character-portrait-data",
  async () => {
    const [options, assets] = await Promise.all([
      queryRows<PortraitOption>(
        `SELECT name, display_name, type_id, sex_id, sort_order
         FROM portrait_part_options
         WHERE is_player = 1
         ORDER BY sex_id, type_id, sort_order, name`,
      ),
      queryRows<PortraitAsset>(
        "SELECT name, image_id, slot_id, sex, parent FROM portrait_part_assets ORDER BY slot_id, name",
      ),
    ]);
    return { options, assets };
  },
  { server: false },
);

const options = computed(() => portraitData.value?.options || []);
const assetByName = computed(() => new Map((portraitData.value?.assets || []).map((asset) => [asset.name, asset])));
const sexId = computed(() => Number(fieldValue(props.table.fields.sex) || 0));
const sexLabel = computed(() => (sexId.value === 1 ? "女" : "男"));

const controlOptions = computed(() => {
  const result: Record<string, PortraitOption[]> = {};
  for (const control of controls) {
    result[control.key] = options.value.filter(
      (option) => option.type_id === control.typeId && option.sex_id === sexId.value,
    );
  }
  return result;
});

const selectedOptions = computed(() => {
  const result: Record<string, PortraitOption | null> = {};
  for (const control of controls) {
    const value = formatSaveValue(fieldValue(props.table.fields[control.key]));
    result[control.key] = controlOptions.value[control.key]?.find((option) => option.name === value) || null;
  }
  return result;
});

const characterName = computed(() => saveEditCharacterName(props.save, props.draft));

watch(
  [selectedOptions, () => props.draft, atlasPending],
  async () => {
    if (atlasPending.value) return;

    const requestKey = JSON.stringify({
      sex: sexId.value,
      qianfa: selectedOptions.value.qianfa?.name,
      lianshi: selectedOptions.value.lianshi?.name,
      houfa: selectedOptions.value.houfa?.name,
      maozi: selectedOptions.value.maozi?.name,
      meimao: selectedOptions.value.meimao?.name,
      yifu: formatSaveValue(fieldValue(props.table.fields.yifu)),
      huzi: selectedOptions.value.huzi?.name,
      houbei: formatSaveValue(fieldValue(props.table.fields.houbei)),
    });

    loading.value = true;
    image.value = null;
    missingAssets.value = [];

    try {
      const { layers, missing } = portraitLayers();
      const nextImage = await composeImageLayers(layers);
      if (requestKey === currentPortraitKey()) {
        image.value = nextImage;
        missingAssets.value = missing;
      }
    } finally {
      if (requestKey === currentPortraitKey()) loading.value = false;
    }
  },
  { deep: true, immediate: true },
);

function currentPortraitKey() {
  return JSON.stringify({
    sex: sexId.value,
    qianfa: selectedOptions.value.qianfa?.name,
    lianshi: selectedOptions.value.lianshi?.name,
    houfa: selectedOptions.value.houfa?.name,
    maozi: selectedOptions.value.maozi?.name,
    meimao: selectedOptions.value.meimao?.name,
    yifu: formatSaveValue(fieldValue(props.table.fields.yifu)),
    huzi: selectedOptions.value.huzi?.name,
    houbei: formatSaveValue(fieldValue(props.table.fields.houbei)),
  });
}

function fieldValue(field: BgDatabaseField | undefined) {
  if (!field) return null;
  const key = fieldDraftKey(field, 0);
  return props.draft[key] ?? field.values[0] ?? null;
}

function setField(fieldName: string, value: string) {
  const field = props.table.fields[fieldName];
  if (field) emit("updateField", field, value, 0);
}

function setSex(value: number) {
  setField("sex", String(value));
}

function optionIndex(control: PortraitControl) {
  const value = formatSaveValue(fieldValue(props.table.fields[control.key]));
  return controlOptions.value[control.key]?.findIndex((option) => option.name === value) ?? -1;
}

function optionNumber(control: PortraitControl) {
  const index = optionIndex(control);
  return index >= 0 ? index : formatSaveValue(fieldValue(props.table.fields[control.key]));
}

function stepOption(control: PortraitControl, offset: number) {
  const rows = controlOptions.value[control.key] || [];
  if (!rows.length) return;

  const current = optionIndex(control);
  const next = (current < 0 ? 0 : current + offset + rows.length) % rows.length;
  setField(control.key, rows[next]!.name);
}

function portraitLayers() {
  const names = [
    ...headAssetNames(selectedOption("qianfa")),
    assetName(selectedOption("lianshi"), "脸型"),
    assetName(selectedOption("houfa"), "眼睛"),
    assetName(selectedOption("maozi"), "嘴巴"),
    assetName(selectedOption("meimao"), "黑眉毛") || assetName(selectedOption("meimao"), "眉毛"),
    ...beardAssetNames(selectedOption("huzi")),
    ...clothesAssetNames(),
    weaponAssetName(),
  ].filter((name): name is string => Boolean(name));

  const missing: string[] = [];
  const layerAssets: PortraitAsset[] = [];
  for (const name of names) {
    const asset = assetByName.value.get(name);
    if (!asset || !asset.image_id) {
      missing.push(name);
      continue;
    }
    layerAssets.push(asset);
  }

  layerAssets.sort((left, right) =>
    (layerOrder[left.slot_id] ?? 99) - (layerOrder[right.slot_id] ?? 99),
  );

  const layers: GameImageLayer[] = layerAssets.map((asset) => ({
    imageId: asset.image_id,
    opacity: 1,
    x: 0,
    y: 0,
  }));

  return { layers, missing };
}

function parentName(option: PortraitOption | null) {
  const displayName = option?.display_name || "";
  if (!displayName || displayName === "无") return "";

  if (displayName.startsWith(`${sexLabel.value}_`)) {
    return displayName.split("_")[1] || "";
  }
  return displayName.split("_")[0] || displayName;
}

function selectedOption(key: string): PortraitOption | null {
  return selectedOptions.value[key] || null;
}

function assetName(option: PortraitOption | null, suffix: string) {
  const parent = parentName(option);
  return parent ? `${sexLabel.value}_${parent}_${suffix}` : null;
}

function headAssetNames(option: PortraitOption | null) {
  const parent = parentName(option);
  if (!parent) return [];
  return [
    `${sexLabel.value}_${parent}_黑头发-后`,
    `${sexLabel.value}_${parent}_黑马尾`,
    `${sexLabel.value}_${parent}_黑头发`,
    `${sexLabel.value}_${parent}_发冠`,
  ].filter((name) => assetByName.value.has(name));
}

function beardAssetNames(option: PortraitOption | null) {
  const parent = parentName(option);
  if (!parent) return [];
  return [
    `${sexLabel.value}_${parent}_黑胡子`,
    `${sexLabel.value}_${parent}_黑胡子-下`,
  ].filter((name) => assetByName.value.has(name));
}

function clothesAssetNames() {
  const optionName = formatSaveValue(fieldValue(props.table.fields.yifu));
  const option = options.value.find((row) => row.name === optionName) || null;
  const displayName = option?.display_name || "";
  const [parent, level] = displayName.split("_");
  if (!parent || !level) return [];
  return [`${sexLabel.value}_${parent}_${level}衣服`].filter((name) => assetByName.value.has(name));
}

function weaponAssetName() {
  const optionName = formatSaveValue(fieldValue(props.table.fields.houbei));
  const option = options.value.find((row) => row.name === optionName) || null;
  const parent = parentName(option);
  if (!parent || parent === "无") return null;
  const name = `${sexLabel.value}_${parent}_武器`;
  return assetByName.value.has(name) ? name : null;
}
</script>

<template>
  <div class="grid gap-5 rounded-md border bg-muted/10 p-4 md:grid-cols-[220px_1fr]">
    <div class="grid justify-items-center gap-3">
      <div class="flex h-[220px] w-[180px] items-end justify-center overflow-hidden rounded-md border bg-background">
        <img
          v-if="image"
          :src="image.src"
          :alt="characterName"
          class="max-h-full max-w-full object-contain"
          draggable="false"
        >
        <div v-else class="grid size-full place-items-center px-4 text-center text-sm text-muted-foreground">
          {{ loading ? "" : characterName.slice(0, 1) }}
        </div>
      </div>

      <div class="grid w-full grid-cols-2 gap-2">
        <Button
          type="button"
          :variant="sexId === 0 ? 'default' : 'outline'"
          size="sm"
          @click="setSex(0)"
        >
          男
        </Button>
        <Button
          type="button"
          :variant="sexId === 1 ? 'default' : 'outline'"
          size="sm"
          @click="setSex(1)"
        >
          女
        </Button>
      </div>
    </div>

    <div class="grid content-start gap-3">
      <div
        v-for="control in controls"
        :key="control.key"
        class="grid grid-cols-[4rem_2.5rem_4rem_2.5rem] items-center gap-2 sm:grid-cols-[5rem_2.5rem_5rem_2.5rem]"
      >
        <div class="text-sm font-medium">{{ control.label }}</div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          class="size-9"
          :disabled="!(controlOptions[control.key] || []).length"
          @click="stepOption(control, -1)"
        >
          <ChevronLeftIcon class="size-4" />
        </Button>
        <div class="text-center text-lg font-semibold tabular-nums text-primary">
          {{ optionNumber(control) }}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          class="size-9"
          :disabled="!(controlOptions[control.key] || []).length"
          @click="stepOption(control, 1)"
        >
          <ChevronRightIcon class="size-4" />
        </Button>
      </div>

      <div v-if="missingAssets.length" class="text-xs text-muted-foreground">
        部分头像贴图未在当前图片资源中命中：{{ missingAssets.length }} 项
      </div>
    </div>
  </div>
</template>
