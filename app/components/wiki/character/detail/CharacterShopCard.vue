<script setup lang="ts">
import ItemCard from "~/components/wiki/item/Card.vue";
import WikiCardGrid from "~/components/wiki/WikiCardGrid.vue";
import { itemDetailUrl, itemTypeLabel, type ItemSummaryRow } from "~/lib/wiki/item";
import type { WikiEnums } from "~/lib/wiki/character";
import type { CharacterShopItemRow } from "~/composables/useCharacterData";

const props = defineProps<{
  shopItems: CharacterShopItemRow[];
  enums: WikiEnums;
}>();

function itemName(item: CharacterShopItemRow) {
  return item.item_name || item.item_legacy_name || `道具 ${item.item_id}`;
}

function itemType(item: CharacterShopItemRow) {
  return itemTypeLabel(item as Pick<ItemSummaryRow, "type_id">, props.enums);
}

function quantityText(item: CharacterShopItemRow) {
  const min = Number(item.min_quantity);
  const max = Number(item.max_quantity);
  if (Number.isFinite(min) && Number.isFinite(max)) {
    if (min === max) return String(min);
    return `${min}-${max}`;
  }
  if (Number.isFinite(min)) return String(min);
  if (Number.isFinite(max)) return String(max);
  return "-";
}
</script>

<template>
  <AppCard v-if="shopItems.length">
    <AppCardHeader>
      <CardTitle>商店商品</CardTitle>
    </AppCardHeader>
    <AppCardContent>
      <WikiCardGrid
        :rows="shopItems"
        :total="shopItems.length"
        :page-size="Math.max(shopItems.length, 1)"
        :pagination="false"
        empty-label="暂无商店商品"
      >
        <ItemCard
          v-for="item in shopItems"
          :key="item.source_row_index"
          :id="item.item_id"
          :name="itemName(item)"
          :image-id="item.item_image_id"
          :description="itemType(item)"
          :rarity-id="item.rarity_id"
          :action-text="`x${quantityText(item)}`"
          :on-click="() => navigateTo(itemDetailUrl(item.item_id))"
        />
      </WikiCardGrid>
    </AppCardContent>
  </AppCard>
</template>
