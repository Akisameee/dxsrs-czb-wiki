<script setup lang="ts">
import { rarityCardClass } from "~/lib/rarity";
import { useItemData } from "~/composables/useItemData";
import ItemBasicInfoCard from "~/components/wiki/item/detail/ItemBasicInfoCard.vue";
import ItemDescriptionCard from "~/components/wiki/item/detail/ItemDescriptionCard.vue";
import ItemUseEffectCard from "~/components/wiki/item/detail/ItemUseEffectCard.vue";
import WikiDetailHeaderCard from "~/components/wiki/WikiDetailHeaderCard.vue";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

useHead({ title: "道具详情" });

const route = useRoute();
const { loadItemDetail } = useItemData();

const itemId = computed(() => Number(route.query.id));

const { data, pending, error } = useLazyAsyncData(
  () => `items-detail-${route.query.id || "empty"}`,
  async () => {
    const id = Number(route.query.id);
    if (!Number.isFinite(id)) return { item: null, summary: null, recipe: null, enums: {} };

    return loadItemDetail(id);
  },
  { server: false, watch: [itemId] },
);

const summary = computed(() => data.value?.summary || null);
const recipe = computed(() => data.value?.recipe || null);
</script>

<template>
  <AppPageContainer>
    <AppCard v-if="error">
      <AppCardContent class="text-destructive">{{ error.message }}</AppCardContent>
    </AppCard>

    <AppCard v-else-if="pending">
      <AppCardHeader>
        <CardTitle>道具详情</CardTitle>
        <CardDescription>读取中...</CardDescription>
      </AppCardHeader>
    </AppCard>

    <AppCard v-else-if="!summary">
      <AppCardHeader>
        <CardTitle>道具详情</CardTitle>
        <CardDescription>没有找到 id: {{ route.query.id || "-" }}</CardDescription>
      </AppCardHeader>
    </AppCard>

    <template v-else>
      <WikiDetailHeaderCard
        :title="summary.name"
        :description="summary.type"
        :color-class="rarityCardClass(summary.rarityId)"
      />

      <ItemBasicInfoCard :summary="summary" :recipe="recipe" />
      <ItemDescriptionCard :summary="summary" />
      <ItemUseEffectCard :summary="summary" />
    </template>
  </AppPageContainer>
</template>
