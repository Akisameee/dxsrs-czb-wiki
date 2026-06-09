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
    <Card>
      <CardHeader>
        <CardTitle>配装工具</CardTitle>
        <CardDescription>配装算法已接入，界面按新组件体系重建。</CardDescription>
      </CardHeader>
      <CardContent class="flex flex-wrap gap-2">
        <Badge variant="outline">最大武学数量：{{ MAX_SELECTION }}</Badge>
        <Badge variant="outline">已选：{{ selectedCount }}</Badge>
        <Badge variant="outline">锁定门派：{{ lockedSect || "无" }}</Badge>
        <Badge v-for="slot in EQUIPMENT_STYLE_SLOTS" :key="slot.key" variant="outline">
          {{ slot.label }}
        </Badge>
      </CardContent>
    </Card>
  </main>
</template>
