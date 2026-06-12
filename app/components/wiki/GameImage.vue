<script setup lang="ts">
import type { GameImageRenderEntry } from "~/composables/useGameImageAtlas";
import { cn } from "~/lib/utils";

const props = withDefaults(defineProps<{
  name: string | null | undefined;
  source?: string | null;
  pathId?: number | null;
  image?: GameImageRenderEntry | null;
  alt?: string;
  size?: number;
  fit?: "trim" | "canvas";
  class?: string;
  style?: Record<string, string | number> | string;
}>(), {
  alt: "",
  size: 64,
  fit: "trim",
});

const { getRenderEntry } = useGameImageAtlas();
const image = computed(() => props.image || getRenderEntry(props.name, props.source, props.pathId));
const scale = computed(() => {
  const value = image.value;
  if (!value) return 1;
  if (props.fit === "canvas") return props.size / value.canvasWidth;
  return props.size / Math.max(value.width, value.height);
});

const outerStyle = computed(() => {
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
    ? (props.size - width) / 2
    : value.offsetX * currentScale;
  const top = props.fit === "trim"
    ? (props.size - height) / 2
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
  <span
    v-if="image"
    role="img"
    :aria-label="alt || undefined"
    :class="cn('relative inline-block overflow-hidden', props.class)"
    :style="[outerStyle, props.style]"
  >
    <span class="absolute bg-no-repeat" :style="spriteStyle" />
  </span>
  <span
    v-else
    :class="cn('inline-block', props.class)"
    :style="[outerStyle, props.style]"
    aria-hidden="true"
  />
</template>
