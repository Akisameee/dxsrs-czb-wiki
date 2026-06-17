<script setup lang="ts">
import { useMediaQuery } from "@vueuse/core";
import GameImage from "~/components/wiki/WikiImage.vue";
import { lifeSkillIconSize, lifeSkillImageId, type LifeSkillIconSizeValue, type LifeSkillType } from "~/lib/wiki/life-skills";

const props = withDefaults(defineProps<{
  type: LifeSkillType;
  value: number | null | undefined;
  label?: string;
  size?: LifeSkillIconSizeValue;
  max?: number;
}>(), {
  label: "",
  max: 5,
});

const slots = computed(() => Array.from({ length: props.max }, (_, index) => index + 1));
const isSm = useMediaQuery("(min-width: 640px)");
const isLg = useMediaQuery("(min-width: 1024px)");
const autoSize = computed(() => {
  if (isLg.value) return "lg";
  if (isSm.value) return "md";
  return "sm";
});
const iconSize = computed(() => lifeSkillIconSize(props.size ?? autoSize.value));
</script>

<template>
  <span class="inline-flex items-center gap-1">
    <GameImage
      v-for="index in slots"
      :key="index"
      :id="lifeSkillImageId(type, value, index)"
      :alt="label ? `${label}${index}` : undefined"
      :fallback="label.slice(0, 1)"
      :size="iconSize"
      class="rounded-none"
    />
  </span>
</template>
