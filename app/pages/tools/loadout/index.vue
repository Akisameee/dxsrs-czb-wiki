<script setup lang="ts">
import { EQUIPMENT_STYLE_SLOTS, MAX_SELECTION } from "~/lib/constants";
import { getLockedSect, getMartialSelectionCount } from "~/lib/loadout";

useHead({ title: "配装工具" });

const emptyState = {
  wuxue: [],
  selected: new Set(),
  equipmentStyles: Object.fromEntries(EQUIPMENT_STYLE_SLOTS.map((slot) => [slot.key, ""])),
  customMartial: {
    enabled: false,
    sectId: "",
    styleId: "",
  },
};

const selectedCount = getMartialSelectionCount(emptyState);
const lockedSect = getLockedSect(emptyState);
</script>

<template>
  <main class="container mx-auto grid gap-6 p-6">
    <UiCard>
      <UiCardHeader>
        <UiCardTitle>配装工具</UiCardTitle>
        <UiCardDescription>配装算法已接入，界面按新组件体系重建。</UiCardDescription>
      </UiCardHeader>
      <UiCardContent class="flex flex-wrap gap-2">
        <UiBadge variant="outline">最大武学数量：{{ MAX_SELECTION }}</UiBadge>
        <UiBadge variant="outline">已选：{{ selectedCount }}</UiBadge>
        <UiBadge variant="outline">锁定门派：{{ lockedSect || "无" }}</UiBadge>
        <UiBadge v-for="slot in EQUIPMENT_STYLE_SLOTS" :key="slot.key" variant="outline">
          {{ slot.label }}
        </UiBadge>
      </UiCardContent>
    </UiCard>
  </main>
</template>
