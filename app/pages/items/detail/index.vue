<script setup lang="ts">
import { rarityCardClass } from "~/lib/rarity";
import { useItemData } from "~/composables/useItemData";
import ItemHoverLink from "~/components/wiki/item/HoverLink.vue";
import GameImage from "~/components/wiki/WikiImage.vue";
import WikiText from "~/components/wiki/WikiText.vue";
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
const recipeAttributeRows = computed(() =>
  Object.fromEntries((recipe.value?.attributeRows || []).map((row) => [row.key, row])),
);
const recipeMetaRows = computed(() =>
  Object.fromEntries((recipe.value?.metaRows || []).map((row) => [row.key, row])),
);
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
      <AppCard :class="rarityCardClass(summary.rarityId)">
        <AppCardHeader>
          <div class="grid gap-2">
            <div>
              <CardTitle class="text-2xl">{{ summary.name }}</CardTitle>
              <CardDescription>{{ summary.type }}</CardDescription>
            </div>
          </div>
        </AppCardHeader>
      </AppCard>

      <div class="grid gap-6">
        <AppCard>
          <AppCardHeader>
            <CardTitle>基础信息</CardTitle>
          </AppCardHeader>
          <AppCardContent class="grid gap-6 text-sm md:grid-cols-[auto_1fr]">
            <div class="flex w-32 items-center justify-center justify-self-center rounded-md md:justify-self-start">
              <GameImage
                :id="summary.imageId"
                :alt="summary.name"
                :fallback="summary.initial"
                class="w-full text-2xl"
              />
            </div>
            <div class="grid content-start items-start gap-3 text-sm grid-cols-2">
              <AppInfoRow label="类型" :value="summary.type" />
              <AppInfoRow label="稀有度" :value="summary.rarity" />
              <AppInfoRow label="材料" :value="summary.materialText" />
              <AppInfoRow label="价值" :value="summary.cost" value-class="tabular-nums" />
              <AppInfoRow
                v-if="recipeAttributeRows.att"
                label="攻击"
                :value="recipeAttributeRows.att.value"
                value-class="tabular-nums"
              />
              <AppInfoRow
                v-if="recipeAttributeRows.def"
                label="防御"
                :value="recipeAttributeRows.def.value"
                value-class="tabular-nums"
              />
              <AppInfoRow
                v-if="recipeAttributeRows.hp"
                label="体力"
                :value="recipeAttributeRows.hp.value"
                value-class="tabular-nums"
              />
              <AppInfoRow
                v-if="recipeAttributeRows.weight"
                label="重量"
                :value="recipeAttributeRows.weight.value"
                value-class="tabular-nums"
              />
              <AppInfoRow
                v-if="recipeAttributeRows.length"
                label="攻击距离"
                :value="recipeAttributeRows.length.value"
                value-class="tabular-nums"
              />
              <AppInfoRow
                v-if="recipeAttributeRows.main_attribute"
                label="主属性"
                :value="recipeAttributeRows.main_attribute.value"
                value-class="tabular-nums"
              />
              <AppInfoRow
                v-if="recipeAttributeRows.bonus_count"
                label="附加属性数量"
                :value="recipeAttributeRows.bonus_count.value"
                value-class="tabular-nums"
              />
              <AppInfoRow
                v-if="recipeAttributeRows.bonus_value"
                label="附加属性数值"
                :value="recipeAttributeRows.bonus_value.value"
                value-class="tabular-nums"
              />
              <AppInfoRow
                v-if="recipeAttributeRows.fixed_attributes"
                label="固定属性"
                :value="recipeAttributeRows.fixed_attributes.value"
              />
              <AppInfoRow
                v-if="recipeMetaRows.required_level"
                label="需求等级"
                :value="recipeMetaRows.required_level.value"
                value-class="tabular-nums"
              />
              <AppInfoRow
                v-if="recipeMetaRows.unlock_item"
                label="制作书"
              >
                <ItemHoverLink
                  v-if="recipeMetaRows.unlock_item.itemId"
                  :id="recipeMetaRows.unlock_item.itemId"
                />
                <template v-else>
                  {{ recipeMetaRows.unlock_item.value }}
                </template>
              </AppInfoRow>
              <AppInfoRow
                v-if="recipeMetaRows.can_buy"
                label="可购买"
                :value="recipeMetaRows.can_buy.value"
              />
            </div>
            <div
              v-if="recipe?.materials.length || summary.requirements.length"
              class="grid gap-4 md:col-span-2"
            >
              <div v-if="recipe?.materials.length" class="grid gap-2">
                <span class="text-muted-foreground">材料</span>
                <div class="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                  <div
                    v-for="material in recipe.materials"
                    :key="material.key"
                    class="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <ItemHoverLink
                      :id="material.itemId"
                      :label="material.name"
                    />
                    <span class="text-muted-foreground tabular-nums">x{{ material.quantity }}</span>
                  </div>
                </div>
              </div>
              <div v-if="summary.requirements.length" class="grid gap-2">
                <span class="text-muted-foreground">需求</span>
                <div class="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                  <div
                    v-for="requirement in summary.requirements"
                    :key="requirement.key"
                    class="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <span>{{ requirement.label }}</span>
                    <span class="text-muted-foreground tabular-nums">{{ requirement.value }}</span>
                  </div>
                </div>
              </div>
            </div>
          </AppCardContent>
        </AppCard>
      </div>

      <AppCard>
        <AppCardHeader>
          <CardTitle>说明</CardTitle>
        </AppCardHeader>
        <AppCardContent class="text-sm leading-7">
          <WikiText :parts="summary.descriptionParts" />
        </AppCardContent>
      </AppCard>

      <AppCard>
        <AppCardHeader>
          <CardTitle>使用效果</CardTitle>
        </AppCardHeader>
        <AppCardContent class="grid gap-4 text-sm">
          <div><WikiText :parts="summary.useEffectParts" /></div>
        </AppCardContent>
      </AppCard>
    </template>
  </AppPageContainer>
</template>
