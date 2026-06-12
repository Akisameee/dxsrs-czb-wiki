<script setup lang="ts">
import GameImage from "~/components/wiki/GameImage.vue";
import { cn } from "~/lib/utils";

const props = withDefaults(defineProps<{
  name: string;
  typeId: number | string | null | undefined;
  rarityId: number | string | null | undefined;
  size?: number;
  class?: string;
}>(), {
  size: 80,
});

const typeIconNames: Record<number, string> = {
  0: "拳法icon",
  1: "刀法icon",
  2: "剑法icon",
  3: "枪法icon",
  4: "棍法icon",
  5: "暗器icon",
  6: "内功icon",
};

const bookName = computed(() => {
  const value = Number(props.rarityId);
  const rarity = Number.isFinite(value) ? Math.min(5, Math.max(1, Math.round(value))) : 1;
  return `秘笈r${rarity}`;
});

const typeIconName = computed(() => {
  const value = Number(props.typeId);
  return Number.isFinite(value) ? typeIconNames[value] || null : null;
});

const rootStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
}));

const iconSize = computed(() => Math.round(props.size * 0.3));
const textSize = computed(() => Math.round(props.size * 0.12));
const typeIconStyle = {
  filter: "brightness(0) saturate(100%) invert(15%) sepia(90%) saturate(3600%) hue-rotate(350deg) brightness(60%) contrast(100%)",
};
</script>

<template>
  <span
    role="img"
    :aria-label="name"
    :class="cn('relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden', props.class)"
    :style="rootStyle"
  >
    <GameImage
      :name="bookName"
      :alt="name"
      :size="size"
      fit="trim"
      class="absolute inset-0"
    />
    <GameImage
      v-if="typeIconName"
      :name="typeIconName"
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
