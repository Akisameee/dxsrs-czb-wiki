<script setup lang="ts">
import GameImage from "~/components/wiki/WikiImage.vue";
import { lifeSkillImageId, type LifeSkillType } from "~/lib/wiki/life-skills";

const props = withDefaults(defineProps<{
  type: LifeSkillType;
  value: number | null | undefined;
  label?: string;
  size?: number;
  max?: number;
}>(), {
  label: "",
  size: 20,
  max: 5,
});

const slots = computed(() => Array.from({ length: props.max }, (_, index) => index + 1));
</script>

<template>
  <span class="inline-flex items-center gap-1">
    <GameImage
      v-for="index in slots"
      :key="index"
      :id="lifeSkillImageId(type, value, index)"
      :alt="label ? `${label}${index}` : undefined"
      :fallback="label.slice(0, 1)"
      :size="size"
      class="rounded-none"
    />
  </span>
</template>
