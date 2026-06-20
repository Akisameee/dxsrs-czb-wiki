<script setup lang="ts">
import { rarityCardClass } from "~/lib/rarity";
import WikiDetailHeaderCard from "~/components/wiki/WikiDetailHeaderCard.vue";
import MartialArtBasicInfoCard from "~/components/wiki/martial-art/detail/MartialArtBasicInfoCard.vue";
import MartialArtLevelGrowthCard from "~/components/wiki/martial-art/detail/MartialArtLevelGrowthCard.vue";
import MartialArtObtainMethodCard from "~/components/wiki/martial-art/detail/MartialArtObtainMethodCard.vue";
import MartialArtPassiveOrEffectCard from "~/components/wiki/martial-art/detail/MartialArtPassiveOrEffectCard.vue";
import {
  martialArtName,
  martialArtRarityToneId,
  martialArtTypeLabel,
} from "~/lib/wiki/martial-art";
import { useMartialArtData } from "~/composables/useMartialArtData";

useHead({ title: "武学详情" });

const route = useRoute();
const { loadMartialArtDetail } = useMartialArtData();

const martialArtId = computed(() => Number(route.query.id));

const { data, pending, error } = useLazyAsyncData(
  () => `martial-arts-detail-${route.query.id || "empty"}`,
  async () => {
    const id = Number(route.query.id);
    if (!Number.isFinite(id)) {
      return {
        martialArt: null,
        styles: [],
        effects: [],
        assetEffects: [],
        assetEffectLayers: [],
        levels: [],
        passiveTemplates: {},
        enums: {},
        obtainMethodParts: [],
      };
    }

    return loadMartialArtDetail(id);
  },
  { server: false, watch: [martialArtId] },
);

const martialArt = computed(() => data.value?.martialArt || null);
const enums = computed(() => data.value?.enums || {});
const passiveTemplates = computed(() => data.value?.passiveTemplates || {});
const effects = computed(() => data.value?.effects || []);
const assetEffects = computed(() => data.value?.assetEffects || []);
const assetEffectLayers = computed(() => data.value?.assetEffectLayers || []);
const levels = computed(() => data.value?.levels || []);
const obtainMethodParts = computed(() => data.value?.obtainMethodParts || []);
</script>

<template>
  <AppPageContainer>
    <AppCard v-if="error">
      <AppCardContent class="text-destructive">{{ error.message }}</AppCardContent>
    </AppCard>

    <AppCard v-else-if="pending">
      <AppCardHeader>
        <CardTitle>武学详情</CardTitle>
        <CardDescription>读取中...</CardDescription>
      </AppCardHeader>
    </AppCard>

    <AppCard v-else-if="!martialArt">
      <AppCardHeader>
        <CardTitle>武学详情</CardTitle>
        <CardDescription>没有找到 id: {{ route.query.id || "-" }}</CardDescription>
      </AppCardHeader>
    </AppCard>

    <template v-else>
      <WikiDetailHeaderCard
        :title="martialArtName(martialArt)"
        :description="martialArtTypeLabel(martialArt, enums)"
        :color-class="rarityCardClass(martialArtRarityToneId(martialArt.rarity_id))"
      />

      <div class="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <MartialArtBasicInfoCard
          :martial-art="martialArt"
          :styles="data?.styles || []"
          :effects="effects"
          :enums="enums"
        />
        <MartialArtPassiveOrEffectCard
          :martial-art="martialArt"
          :levels="levels"
          :passive-templates="passiveTemplates"
          :asset-effects="assetEffects"
          :asset-effect-layers="assetEffectLayers"
          :enums="enums"
        />
      </div>

      <MartialArtObtainMethodCard :parts="obtainMethodParts" />
      <MartialArtLevelGrowthCard
        :martial-art="martialArt"
        :levels="levels"
        :passive-templates="passiveTemplates"
        :enums="enums"
      />

    </template>
  </AppPageContainer>
</template>
