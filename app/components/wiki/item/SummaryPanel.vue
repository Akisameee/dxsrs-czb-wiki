<script setup lang="ts">
import { computed } from "vue";
import type { ItemRecipeSummary, ItemSummary } from "~/lib/wiki/item";
import GameImage from "~/components/wiki/WikiImage.vue";
import ItemHoverLink from "~/components/wiki/item/HoverLink.vue";
import WikiSummaryPanel from "~/components/wiki/WikiSummaryPanel.vue";
import WikiText from "~/components/wiki/WikiText.vue";

const props = defineProps<{
  summary: ItemSummary | null;
  recipe?: ItemRecipeSummary | null;
  pending?: boolean;
  error?: Error | null;
}>();

const recipeMetaRows = computed(() =>
  Object.fromEntries((props.recipe?.metaRows || []).map((row) => [row.key, row])),
);
const recipeAttributeRows = computed(() =>
  Object.fromEntries((props.recipe?.attributeRows || []).map((row) => [row.key, row])),
);
</script>

<template>
  <WikiSummaryPanel
    :summary="summary"
    :pending="pending"
    :error="error"
    empty-label="未找到道具"
    :title="summary?.name"
    :description="summary?.type"
    :badges="summary ? [{ label: summary.rarity, variant: 'outline' }] : []"
  >
    <template #avatar="{ summary: currentSummary }">
      <GameImage
        :id="currentSummary.imageId"
        :alt="currentSummary.name"
        :fallback="currentSummary.initial"
        :size="40"
      />
    </template>
    <template #default="{ summary: currentSummary }">
      <div class="grid gap-2 grid-cols-2 text-sm">
        <AppInfoRow label="价值" :value="currentSummary.cost" value-class="tabular-nums" />
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
        <AppInfoRow v-if="recipeMetaRows.unlock_item" label="制作书">
          <ItemHoverLink
            v-if="recipeMetaRows.unlock_item.itemId"
            :id="recipeMetaRows.unlock_item.itemId"
            :label="recipeMetaRows.unlock_item.value"
          />
          <span v-else>{{ recipeMetaRows.unlock_item.value }}</span>
        </AppInfoRow>
      </div>

      <div
        v-if="recipe?.materials.length"
        class="grid gap-2 border-t pt-3 text-sm"
      >
        <div class="text-muted-foreground">制作材料</div>
        <div class="grid gap-2 grid-cols-2">
          <div
            v-for="material in recipe.materials"
            :key="material.key"
            class="flex items-center justify-between rounded-md border px-3 py-2"
          >
            <ItemHoverLink
              v-if="material.itemId"
              :id="material.itemId"
              :label="material.name"
            />
            <span v-else>{{ material.name }}</span>
            <span class="text-muted-foreground tabular-nums">x{{ material.quantity }}</span>
          </div>
        </div>
      </div>

      <div
        v-if="currentSummary.requirements.length"
        class="grid gap-2 border-t pt-3 text-sm"
      >
        <div class="text-muted-foreground">需求</div>
        <div class="grid gap-2 grid-cols-2">
          <div
            v-for="requirement in currentSummary.requirements"
            :key="requirement.key"
            class="flex items-center justify-between rounded-md border px-3 py-2"
          >
            <span>{{ requirement.label }}</span>
            <span class="tabular-nums">{{ requirement.value }}</span>
          </div>
        </div>
      </div>

      <div v-if="currentSummary.descriptionParts.length" class="grid gap-2 border-t pt-3 text-sm">
        <div class="text-muted-foreground">说明</div>
        <div>
          <WikiText :parts="currentSummary.descriptionParts" />
        </div>
      </div>

      <div
        v-if="currentSummary.useEffectText !== '无' || currentSummary.useValues.length"
        class="grid gap-2 border-t pt-3 text-sm"
      >
        <div class="text-muted-foreground">使用</div>
        <div><WikiText :parts="currentSummary.useEffectParts" /></div>
      </div>
    </template>
  </WikiSummaryPanel>
</template>
