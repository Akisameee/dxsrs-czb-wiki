<script setup lang="ts">
import type { ComposedGameImage, GameImageLayer } from "~/composables/useGameImageAtlas";
import { cn } from "~/lib/utils";

type PortraitOption = {
  name: string;
  display_name: string | null;
  type_id: number;
  sex_id: number;
};

type PortraitAsset = {
  name: string;
  image_id: string | null;
  slot_id: number;
};

type PortraitPartKey =
  | "qianfa"
  | "houfa"
  | "maozi"
  | "meimao"
  | "lianshi"
  | "yifu"
  | "houbei"
  | "huzi";

type PortraitPartConfig = {
  typeId: number;
  sortOffset?: number;
};

const props = withDefaults(defineProps<{
  sex: number;
  qianfa?: number | null;
  houfa?: number | null;
  maozi?: number | null;
  meimao?: number | null;
  lianshi?: number | null;
  yifu?: number | null;
  houbei?: number | null;
  huzi?: number | null;
  fallback?: string;
  class?: string;
}>(), {
  fallback: "",
});

const partConfigs: Record<PortraitPartKey, PortraitPartConfig> = {
  qianfa: { typeId: 10 },
  houfa: { typeId: 6 },
  maozi: { typeId: 7 },
  meimao: { typeId: 5 },
  lianshi: { typeId: 1 },
  yifu: { typeId: 9, sortOffset: 100 },
  houbei: { typeId: 0 },
  huzi: { typeId: 8 },
};

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
const loading = ref(false);
const active = ref(false);

const { data: portraitData } = await useAsyncData(
  "save-edit-player-portrait-data",
  async () => {
    const [options, assets] = await Promise.all([
      queryRows<PortraitOption>(
        `SELECT name, display_name, type_id, sex_id
         FROM portrait_part_options
         WHERE is_player = 1
         ORDER BY sex_id, type_id, sort_order, name`,
      ),
      queryRows<PortraitAsset>(
        "SELECT name, image_id, slot_id FROM portrait_part_assets ORDER BY slot_id, name",
      ),
    ]);
    return { options, assets };
  },
  { server: false },
);

const options = computed(() => portraitData.value?.options || []);
const assetByName = computed(() => new Map((portraitData.value?.assets || []).map((asset) => [asset.name, asset])));
const sexLabel = computed(() => (props.sex === 1 ? "女" : "男"));

watch(
  [() => props.sex, () => props.qianfa, () => props.houfa, () => props.maozi, () => props.meimao, () => props.lianshi, () => props.yifu, () => props.houbei, () => props.huzi, atlasPending, active],
  async () => {
    if (!active.value || atlasPending.value) {
      if (!active.value) {
        image.value = null;
        loading.value = false;
      }
      return;
    }

    const requestKey = portraitRequestKey();
    loading.value = true;
    image.value = null;

    try {
      const nextImage = await composeImageLayers(portraitLayers());
      if (requestKey === portraitRequestKey()) image.value = nextImage;
    } finally {
      if (requestKey === portraitRequestKey()) loading.value = false;
    }
  },
  { immediate: true },
);

function portraitRequestKey() {
  return JSON.stringify({
    sex: props.sex,
    qianfa: props.qianfa,
    houfa: props.houfa,
    maozi: props.maozi,
    meimao: props.meimao,
    lianshi: props.lianshi,
    yifu: props.yifu,
    houbei: props.houbei,
    huzi: props.huzi,
  });
}

function partOptions(key: PortraitPartKey) {
  const config = partConfigs[key];
  return options.value
    .filter((option) => option.type_id === config.typeId && option.sex_id === props.sex)
    .sort((left, right) =>
      optionNumber(left, config) - optionNumber(right, config) ||
      left.name.localeCompare(right.name),
    );
}

function optionNumber(option: PortraitOption, config: PortraitPartConfig) {
  const number = Number(option.name.match(/(\d+)/)?.[1] ?? NaN);
  if (Number.isNaN(number)) return Number.MAX_SAFE_INTEGER;
  return number - (config.sortOffset || 0);
}

function selectedOption(key: PortraitPartKey) {
  if (props.sex === 1 && key === "huzi") return null;

  const index = props[key];
  if (typeof index !== "number" || index < 0) return null;
  return partOptions(key)[index] || null;
}

function parentName(option: PortraitOption | null) {
  const displayName = option?.display_name || "";
  if (!displayName || displayName === "无") return "";

  if (displayName.startsWith(`${sexLabel.value}_`)) {
    return displayName.split("_")[1] || "";
  }
  return displayName.split("_")[0] || displayName;
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
  if (!parent || props.sex === 1) return [];
  return [
    `${sexLabel.value}_${parent}_黑胡子`,
    `${sexLabel.value}_${parent}_黑胡子-下`,
  ].filter((name) => assetByName.value.has(name));
}

function clothesAssetNames() {
  const option = selectedOption("yifu");
  const displayName = option?.display_name || "";
  const [parent, level] = displayName.split("_");
  if (!parent || !level) return [];
  return [`${sexLabel.value}_${parent}_${level}衣服`].filter((name) => assetByName.value.has(name));
}

function weaponAssetName() {
  const parent = parentName(selectedOption("houbei"));
  if (!parent || parent === "无") return null;
  const name = `${sexLabel.value}_${parent}_武器`;
  return assetByName.value.has(name) ? name : null;
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

  const layerAssets = names
    .map((name) => assetByName.value.get(name))
    .filter((asset): asset is PortraitAsset => Boolean(asset?.image_id))
    .sort((left, right) => (layerOrder[left.slot_id] ?? 99) - (layerOrder[right.slot_id] ?? 99));

  return layerAssets.map((asset) => ({
    imageId: asset.image_id,
    opacity: 1,
    x: 0,
    y: 0,
  })) satisfies GameImageLayer[];
}
</script>

<template>
  <AppImageFrame
    v-model:active="active"
    role="img"
    :aria-label="fallback"
    :class="cn('grid size-full place-items-center overflow-hidden bg-background text-muted-foreground', props.class)"
  >
    <img
      v-if="image"
      :src="image.src"
      :alt="fallback"
      class="max-h-full max-w-full object-contain"
      draggable="false"
    >
    <div v-else class="px-4 text-center text-sm">
      {{ loading ? "" : fallback }}
    </div>
    <template #fallback>
      <div class="px-4 text-center text-sm">{{ fallback }}</div>
    </template>
  </AppImageFrame>
</template>
