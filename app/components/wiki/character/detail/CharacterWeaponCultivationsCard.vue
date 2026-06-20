<script setup lang="ts">
import type { CharacterDetailRow } from "~/composables/useCharacterData";

const props = defineProps<{
  character: CharacterDetailRow;
}>();

const weaponCultivations = computed(() => [
  { label: "拳掌", value: props.character.fist },
  { label: "刀剑", value: props.character.blade_sword },
  { label: "枪棒", value: props.character.spear_staff },
  { label: "暗器", value: props.character.hidden_weapon },
  { label: "内功", value: props.character.internal },
]);

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  return String(Math.round(Number(value)));
}
</script>

<template>
  <AppCard>
    <AppCardHeader>
      <CardTitle>武器修为</CardTitle>
    </AppCardHeader>
    <AppCardContent class="grid gap-3 grid-cols-2">
      <div
        v-for="item in weaponCultivations"
        :key="item.label"
        class="flex items-center justify-between rounded-md border px-3 py-2"
      >
        <span>{{ item.label }}</span>
        <span class="tabular-nums">{{ formatNumber(item.value) }}/100</span>
      </div>
    </AppCardContent>
  </AppCard>
</template>
