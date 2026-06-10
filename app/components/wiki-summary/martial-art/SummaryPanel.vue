<script setup lang="ts">
import type { MartialArtSummaryData } from "~/composables/useMartialArtSummary";
import {
  formatMartialArtNumber,
  martialArtEffectLabel,
  martialArtLevelPassiveDescriptions,
  martialArtName,
  martialArtPassiveDescription,
  martialArtPassiveSlots,
  martialArtRarityLabel,
  martialArtRestrictionLabel,
  martialArtSectLabel,
  martialArtStyleLabel,
  martialArtTypeLabel,
} from "~/lib/wiki/martial-art";

const props = defineProps<{
  summary: MartialArtSummaryData | null;
  pending?: boolean;
  error?: Error | null;
}>();

const item = computed(() => props.summary?.martialArt || null);
const enums = computed(() => props.summary?.enums || {});
const name = computed(() => item.value ? martialArtName(item.value, enums.value) : "");
const typeLabel = computed(() => item.value ? martialArtTypeLabel(item.value, enums.value) : "未知类型");
const sectLabel = computed(() => item.value ? martialArtSectLabel(item.value, enums.value) : "无门派");
const rarityLabel = computed(() => item.value ? martialArtRarityLabel(item.value, enums.value) : "稀有度");
const power = computed(() => formatMartialArtNumber(item.value?.power));
const cost = computed(() => formatMartialArtNumber(item.value?.cost));
const highestLevel = computed(() => props.summary?.levels?.at(-1) || null);
const styles = computed(() =>
  (props.summary?.styles || [])
    .map((row) => martialArtStyleLabel(row, enums.value))
    .filter(Boolean),
);
const effects = computed(() =>
  (props.summary?.effects || []).map((row) => ({
    id: `${row.martial_art_id}-${row.slot}`,
    text: martialArtEffectLabel(row, enums.value),
  })),
);
const passives = computed(() => [
  ...martialArtPassiveSlots(item.value)
    .map((row) => martialArtPassiveDescription(row, enums.value))
    .filter(Boolean),
  ...martialArtLevelPassiveDescriptions(highestLevel.value),
]);
</script>

<template>
  <div v-if="pending" class="text-sm text-muted-foreground">
    读取中...
  </div>
  <div v-else-if="error" class="text-sm text-destructive">
    {{ error.message }}
  </div>
  <div v-else-if="summary && item" class="grid gap-3">
    <div class="grid gap-1">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="font-medium">{{ name }}</div>
          <div class="text-sm text-muted-foreground">
            {{ typeLabel }} / {{ sectLabel }}
          </div>
        </div>
        <Badge variant="outline">{{ rarityLabel }}</Badge>
      </div>
      <div class="flex flex-wrap gap-2">
        <Badge variant="secondary">{{ martialArtRestrictionLabel(item) }}</Badge>
      </div>
    </div>

    <div class="grid gap-2 text-sm">
      <div class="flex justify-between gap-3">
        <span class="text-muted-foreground">威力</span>
        <span class="tabular-nums">{{ power }}</span>
      </div>
      <div class="flex justify-between gap-3">
        <span class="text-muted-foreground">真气</span>
        <span class="tabular-nums">{{ cost }}</span>
      </div>
      <div class="flex justify-between gap-3">
        <span class="text-muted-foreground">获取</span>
        <span class="min-w-0 flex-1 text-right">{{ item.obtain_method || "-" }}</span>
      </div>
    </div>

    <div v-if="styles.length" class="grid gap-2 border-t pt-3 text-sm">
      <div class="text-muted-foreground">风格</div>
      <div class="flex flex-wrap gap-2">
        <Badge
          v-for="style in styles"
          :key="style"
          variant="outline"
        >
          {{ style }}
        </Badge>
      </div>
    </div>

    <div v-if="effects.length" class="grid gap-2 border-t pt-3 text-sm">
      <div class="text-muted-foreground">效果</div>
      <div class="grid gap-1">
        <div
          v-for="effect in effects"
          :key="effect.id"
          class="rounded-md border px-3 py-2"
        >
          {{ effect.text }}
        </div>
      </div>
    </div>

    <div v-if="passives.length" class="grid gap-2 border-t pt-3 text-sm">
      <div class="text-muted-foreground">被动</div>
      <div class="grid gap-1">
        <div
          v-for="passive in passives"
          :key="passive"
          class="rounded-md border px-3 py-2"
        >
          {{ passive }}
        </div>
      </div>
    </div>
  </div>
  <div v-else class="text-sm text-muted-foreground">
    未找到武学
  </div>
</template>
