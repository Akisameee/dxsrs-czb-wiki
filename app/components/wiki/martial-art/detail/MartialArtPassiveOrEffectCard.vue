<script setup lang="ts">
import MartialArtEffectPreview from "~/components/wiki/martial-art/MartialArtEffectPreview.vue";
import {
  martialArtIsInternal,
  martialArtLevelPassiveDescriptions,
  martialArtPassiveDescription,
  martialArtPassiveSlots,
  type MartialArtAssetEffectLayerRow,
  type MartialArtAssetEffectRow,
  type MartialArtLevelRow,
  type MartialArtPassiveTemplateMap,
  type MartialArtSummaryRow,
  type WikiEnums,
} from "~/lib/wiki/martial-art";

const props = defineProps<{
  martialArt: MartialArtSummaryRow;
  levels: MartialArtLevelRow[];
  passiveTemplates: MartialArtPassiveTemplateMap;
  assetEffects: MartialArtAssetEffectRow[];
  assetEffectLayers: MartialArtAssetEffectLayerRow[];
  enums: WikiEnums;
}>();

const isInternalMartialArt = computed(() => martialArtIsInternal(props.martialArt));
const highestLevel = computed(() => props.levels[props.levels.length - 1] || null);
const passiveLines = computed(() => [
  ...martialArtPassiveSlots(props.martialArt)
    .map((item) => martialArtPassiveDescription(item, props.enums, props.passiveTemplates))
    .filter(Boolean),
  ...martialArtLevelPassiveDescriptions(highestLevel.value, props.passiveTemplates),
]);

function assetEffect(kind: "slash" | "hit", effectId: number | null | undefined) {
  const id = Number(effectId);
  if (!Number.isFinite(id)) return null;
  return props.assetEffects.find((item) => item.kind === kind && Number(item.effect_id) === id) || null;
}

function assetEffectPreviewLayers(kind: "slash" | "hit", effectId: number | null | undefined) {
  const id = Number(effectId);
  if (!Number.isFinite(id)) return [];
  return props.assetEffectLayers.filter((item) => item.kind === kind && Number(item.effect_id) === id);
}
</script>

<template>
  <AppCard v-if="isInternalMartialArt">
    <AppCardHeader>
      <CardTitle>被动</CardTitle>
    </AppCardHeader>
    <AppCardContent class="grid gap-2 text-sm">
      <div v-if="passiveLines.length" class="grid gap-1">
        <div
          v-for="item in passiveLines"
          :key="item"
          class="rounded-md border px-3 py-2"
        >
          {{ item }}
        </div>
      </div>
      <div v-else class="text-muted-foreground">无被动</div>
    </AppCardContent>
  </AppCard>

  <AppCard v-else>
    <AppCardHeader>
      <CardTitle>招式特效</CardTitle>
    </AppCardHeader>
    <AppCardContent class="grid justify-items-center gap-2">
      <MartialArtEffectPreview
        :effect="assetEffect('slash', martialArt.slash_effect_id)"
        :layers="assetEffectPreviewLayers('slash', martialArt.slash_effect_id)"
        class="w-full max-w-36"
      />
    </AppCardContent>
  </AppCard>
</template>
