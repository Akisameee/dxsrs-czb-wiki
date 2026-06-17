<script setup lang="ts">
import type { GameImageRenderEntry } from "~/composables/useGameImageAtlas";
import { cn } from "~/lib/utils";

const props = withDefaults(defineProps<{
  id: string | null | undefined;
  image?: GameImageRenderEntry | null;
  alt?: string;
  fallback?: string;
  size?: number;
  fit?: "trim" | "canvas";
  eager?: boolean;
  class?: string;
  style?: Record<string, string | number> | string;
}>(), {
  alt: "",
  fit: "trim",
  eager: false,
});

const active = ref(false);
const measuredSize = ref(64);

const { renderImage } = useGameImageAtlas();
const image = computed(() => (active.value ? props.image || renderImage({ id: props.id }) : null));
const currentSize = computed(() => props.size || measuredSize.value);
const scale = computed(() => {
  const value = image.value;
  if (!value) return 1;
  if (props.fit === "canvas") return currentSize.value / value.canvasWidth;
  return currentSize.value / Math.max(value.width, value.height);
});

const outerStyle = computed(() => {
  if (!props.size) {
    return { width: "100%", aspectRatio: "1 / 1" };
  }

  const value = image.value;
  if (!value) {
    return {
      width: `${props.size}px`,
      height: `${props.size}px`,
    };
  }

  const currentScale = scale.value;
  if (props.fit === "trim") {
    return {
      width: `${props.size}px`,
      height: `${props.size}px`,
    };
  }

  return {
    width: `${value.canvasWidth * currentScale}px`,
    height: `${value.canvasHeight * currentScale}px`,
  };
});

const spriteStyle = computed(() => {
  const value = image.value;
  if (!value) return {};

  const currentScale = scale.value;
  const width = value.width * currentScale;
  const height = value.height * currentScale;
  const left = props.fit === "trim"
    ? (currentSize.value - width) / 2
    : value.offsetX * currentScale;
  const top = props.fit === "trim"
    ? (currentSize.value - height) / 2
    : value.offsetY * currentScale;

  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
    backgroundImage: `url(${value.src})`,
    backgroundPosition: `-${value.x * currentScale}px -${value.y * currentScale}px`,
    backgroundSize: `${value.atlasWidth * currentScale}px ${value.atlasHeight * currentScale}px`,
  };
});
</script>

<template>
  <AppImageFrame
    v-model:active="active"
    v-model:measured-size="measuredSize"
    role="img"
    :aria-label="alt"
    :eager="eager"
    :class="cn(
      image ? 'rounded-md' : 'rounded-md bg-muted text-sm font-medium text-muted-foreground',
      props.class,
    )"
    :style="[outerStyle, props.style]"
  >
    <span v-if="image" class="absolute bg-no-repeat" :style="spriteStyle" />
    <template v-else>{{ fallback }}</template>
    <template #fallback>{{ fallback }}</template>
  </AppImageFrame>
</template>
