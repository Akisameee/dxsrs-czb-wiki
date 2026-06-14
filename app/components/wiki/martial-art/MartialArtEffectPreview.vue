<script setup lang="ts">
import type { CSSProperties } from "vue";
import type {
  MartialArtAssetEffectLayerRow,
  MartialArtAssetEffectRow,
} from "~/lib/wiki/martial-art";
import type { GameImageAtlasEntry } from "~/composables/useGameImageAtlas";

type EffectRenderLayer = {
  layer: MartialArtAssetEffectLayerRow;
  entry: GameImageAtlasEntry;
  tilesX: number;
  tilesY: number;
  frameWidth: number;
  frameHeight: number;
};

const props = withDefaults(defineProps<{
  effect?: MartialArtAssetEffectRow | null;
  layers: MartialArtAssetEffectLayerRow[];
  size?: number;
}>(), {});

const { findImage, imageAssetUrl } = useGameImageAtlas();
const root = ref<HTMLElement | null>(null);
const tick = ref(0);
const measuredSize = ref(96);
let timer: number | null = null;
let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  timer = window.setInterval(() => {
    tick.value = performance.now();
  }, 1000 / 24);

  resizeObserver = new ResizeObserver(([entry]) => {
    const width = entry?.contentRect.width;
    if (width && Number.isFinite(width)) {
      measuredSize.value = width;
    }
  });
  if (root.value) resizeObserver.observe(root.value);
});

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer);
  resizeObserver?.disconnect();
});

const previewSize = computed(() => props.size || measuredSize.value);
const rootStyle = computed(() => props.size
  ? { width: `${props.size}px`, height: `${props.size}px` }
  : { width: "100%", aspectRatio: "1 / 1" });

const fallbackLayers = computed<MartialArtAssetEffectLayerRow[]>(() => {
  if (props.layers.length || !props.effect?.image_id) {
    return props.layers;
  }

  return [{
    kind: props.effect.kind,
    effect_id: props.effect.effect_id,
    layer_index: 0,
    texture_slot: 0,
    game_object_name: props.effect.prefab_name,
    depth: 0,
    renderer_type: null,
    sorting_order: 0,
    material_name: null,
    texture_property: null,
    image_id: props.effect.image_id,
    duration: props.effect.duration,
    simulation_speed: 1,
    looping: 1,
    uv_enabled: 0,
    tiles_x: 1,
    tiles_y: 1,
    frame_count: 1,
    fps: null,
    cycles: 1,
    row_mode: null,
    row_index: null,
    start_frame: 0,
    frame_curve: null,
    start_size: 1,
    start_lifetime: props.effect.duration || 1,
    start_lifetime_curve: null,
    start_speed: 0,
    start_speed_curve: null,
    start_color: null,
    start_rotation: 0,
    gravity_modifier: 0,
    gravity_modifier_curve: null,
    max_particles: null,
    size_curve: null,
    color_gradient: null,
    rotation_enabled: 0,
    rotation_curve: null,
    burst_count: 0,
    emission_rate: 0,
    emission_rate_curve: null,
    emission_bursts: null,
    shape_enabled: 0,
    shape_type: null,
    shape_angle: null,
    shape_radius: null,
    shape_arc: null,
    shape_length: null,
    shape_position_x: null,
    shape_position_y: null,
    shape_position_z: null,
    shape_rotation_x: null,
    shape_rotation_y: null,
    shape_rotation_z: null,
    shape_scale_x: null,
    shape_scale_y: null,
    shape_scale_z: null,
    random_direction_amount: null,
    spherical_direction_amount: null,
    random_position_amount: null,
    velocity_enabled: 0,
    velocity_x: null,
    velocity_y: null,
    velocity_z: null,
    velocity_radial: null,
    velocity_orbital_x: null,
    velocity_orbital_y: null,
    velocity_orbital_z: null,
    force_enabled: 0,
    force_x: null,
    force_y: null,
    force_z: null,
  }];
});

const renderLayers = computed(() =>
  fallbackLayers.value
    .map((layer) => {
      const entry = findImage({ id: layer.image_id });
      if (!entry) return null;
      const tilesX = Math.max(1, Number(layer.tiles_x) || 1);
      const tilesY = Math.max(1, Number(layer.tiles_y) || 1);
      return {
        layer,
        entry,
        tilesX,
        tilesY,
        frameWidth: entry.textureWidth / tilesX,
        frameHeight: entry.textureHeight / tilesY,
      };
    })
    .filter((item): item is EffectRenderLayer => Boolean(item)),
);

const previewScale = computed(() => {
  const maxFrame = renderLayers.value.reduce(
    (size, item) => Math.max(size, item.frameWidth, item.frameHeight),
    1,
  );
  return previewSize.value / maxFrame;
});

function currentFrame(layer: MartialArtAssetEffectLayerRow) {
  const frameCount = Math.max(1, Number(layer.frame_count) || 1);
  if (!layer.uv_enabled || frameCount <= 1) return 0;

  const duration = Math.max(0.2, Number(layer.duration) || Number(props.effect?.duration) || 1);
  const cycles = Math.max(0.1, Number(layer.cycles) || 1);
  const startFrame = Number(layer.start_frame) || 0;
  const progress = ((tick.value || 0) / 1000 % duration) / duration;
  const frameProgress = (startFrame + progress * cycles) % 1;
  return Math.min(frameCount - 1, Math.floor(frameProgress * frameCount));
}

function layerStyle(item: EffectRenderLayer): CSSProperties {
  const scale = previewScale.value;
  const frame = currentFrame(item.layer);
  const col = frame % item.tilesX;
  const row = Math.floor(frame / item.tilesX);
  const frameLeft = col * item.frameWidth;
  const frameTop = row * item.frameHeight;
  const frameRight = frameLeft + item.frameWidth;
  const frameBottom = frameTop + item.frameHeight;
  const trimLeft = item.entry.trim.x;
  const trimTop = item.entry.trim.y;
  const trimRight = trimLeft + item.entry.width;
  const trimBottom = trimTop + item.entry.height;
  const visibleLeft = Math.max(frameLeft, trimLeft);
  const visibleTop = Math.max(frameTop, trimTop);
  const visibleRight = Math.min(frameRight, trimRight);
  const visibleBottom = Math.min(frameBottom, trimBottom);

  if (visibleRight <= visibleLeft || visibleBottom <= visibleTop) {
    return { display: "none" };
  }

  const frameBoxWidth = item.frameWidth * scale;
  const frameBoxHeight = item.frameHeight * scale;
  const width = (visibleRight - visibleLeft) * scale;
  const height = (visibleBottom - visibleTop) * scale;
  const left = (previewSize.value - frameBoxWidth) / 2 + (visibleLeft - frameLeft) * scale;
  const top = (previewSize.value - frameBoxHeight) / 2 + (visibleTop - frameTop) * scale;
  const atlasX = item.entry.x + visibleLeft - trimLeft;
  const atlasY = item.entry.y + visibleTop - trimTop;

  return {
    zIndex: item.layer.sorting_order * 10 + item.layer.layer_index,
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
    backgroundImage: `url(${imageAssetUrl(item.entry.atlas)})`,
    backgroundPosition: `-${atlasX * scale}px -${atlasY * scale}px`,
    backgroundSize: `${item.entry.atlasWidth * scale}px ${item.entry.atlasHeight * scale}px`,
  };
}
</script>

<template>
  <span
    ref="root"
    class="relative inline-block overflow-hidden rounded-md border bg-black"
    :style="rootStyle"
    :title="effect?.prefab_name || undefined"
  >
    <span
      v-for="item in renderLayers"
      :key="`${item.layer.layer_index}-${item.layer.texture_slot}-${item.layer.image_id}`"
      class="absolute bg-no-repeat"
      :style="layerStyle(item)"
    />
  </span>
</template>
