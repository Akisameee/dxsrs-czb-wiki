<script setup lang="ts">
import GameImage from "~/components/wiki/WikiImage.vue";
import { cn } from "~/lib/utils";

const props = withDefaults(defineProps<{
  name: string;
  typeId: number | string | null | undefined;
  rarityId: number | string | null | undefined;
  size?: number;
  class?: string;
}>(), {});

const root = ref<HTMLElement | null>(null);
const measuredSize = ref(80);
let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  resizeObserver = new ResizeObserver(([entry]) => {
    const width = entry?.contentRect.width;
    if (width && Number.isFinite(width)) {
      measuredSize.value = width;
    }
  });
  if (root.value) resizeObserver.observe(root.value);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
});

const typeIconIds: Record<number, string> = {
  0: "a95224fc19f8ed940ad0babc27a52282:1",
  1: "c8784c1861027634db8b38e394760910:1",
  2: "d4502c61b675ad741917d00211ea14e3:1",
  3: "4624fd114b20e4c42ada0bfa37971e49:1",
  4: "9bd3232a5ab7fa74fa26a96f50f6c2c8:1",
  5: "7ef736d2aba9b8e4483fafb3909e613e:1",
  6: "ac0c1b47eed252c4298be28fe8ee8e74:1",
};

const bookImageIds: Record<number, string> = {
  1: "fe05587b476f9704491d6aa4575e6efa:1",
  2: "f76c17a81d11185489b41c364ce85401:1",
  3: "f188223b87a976c4a889c80aaa58e504:1",
  4: "d1c1cd60913b75f4388539ece64d114b:1",
  5: "eb48f570edb73074d8c4d9eee4c77008:1",
};

const bookImageId = computed(() => {
  const value = Number(props.rarityId);
  const rarity = Number.isFinite(value) ? Math.min(5, Math.max(1, Math.round(value))) : 1;
  return bookImageIds[rarity] || null;
});

const typeIconImageId = computed(() => {
  const value = Number(props.typeId);
  return Number.isFinite(value) ? typeIconIds[value] || null : null;
});
const fallbackText = computed(() => props.name.slice(0, 1));

const currentSize = computed(() => props.size || measuredSize.value);
const rootStyle = computed(() => props.size
  ? { width: `${props.size}px`, height: `${props.size}px` }
  : { width: "100%", aspectRatio: "1 / 1" });

const iconSize = computed(() => Math.round(currentSize.value * 0.3));
const textSize = computed(() => Math.round(currentSize.value * 0.12));
const typeIconStyle = {
  filter: "brightness(0) saturate(100%) invert(15%) sepia(90%) saturate(3600%) hue-rotate(350deg) brightness(60%) contrast(100%)",
};
</script>

<template>
  <span
    ref="root"
    role="img"
    :aria-label="name"
    :class="cn('relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden', props.class)"
    :style="rootStyle"
  >
    <GameImage
      :id="bookImageId"
      :alt="name"
      :fallback="fallbackText"
      :size="currentSize"
      fit="trim"
      class="absolute inset-0"
    />
    <GameImage
      v-if="typeIconImageId"
      :id="typeIconImageId"
      :alt="name"
      :size="iconSize"
      fit="trim"
      :style="typeIconStyle"
      class="absolute inset-x-[55%] bottom-[15%] -translate-x-1/2"
    />
    <span
      class="absolute left-[24%] top-[-3%] h-[100%] text-center leading-none"
      :style="{
        fontSize: `${textSize}px`,
        writingMode: 'vertical-rl',
        textOrientation: 'upright',
        fontFamily: `'KaiTi', 'STKaiti', serif`
      }"
    >
      {{ name }}
    </span>
  </span>
</template>
