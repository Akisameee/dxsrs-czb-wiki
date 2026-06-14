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
  class?: string;
  style?: Record<string, string | number> | string;
}>(), {
  alt: "",
  fit: "trim",
});

const root = ref<HTMLElement | null>(null);
const measuredSize = ref(64);
let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  resizeObserver = new ResizeObserver(([entry]) => {
    const width = entry?.contentRect.width;
    if (width && Number.isFinite(width)) measuredSize.value = width;
  });
  if (root.value) resizeObserver.observe(root.value);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
});

const { renderImage } = useGameImageAtlas();
const image = computed(() => props.image || renderImage({ id: props.id }));
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
  <span
    v-if="image"
    ref="root"
    role="img"
    :aria-label="alt || undefined"
    :class="cn('relative inline-block overflow-hidden rounded-md', props.class)"
    :style="[outerStyle, props.style]"
  >
    <span class="absolute bg-no-repeat" :style="spriteStyle" />
  </span>
  <span
    ref="root"
    v-else
    :class="cn('inline-flex items-center justify-center overflow-hidden rounded-md bg-muted text-sm font-medium text-muted-foreground', props.class)"
    :style="[outerStyle, props.style]"
    :aria-hidden="fallback ? undefined : true"
  >
    {{ fallback }}
  </span>
</template>
