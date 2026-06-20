<script setup lang="ts">
import { CircleHelp } from "@lucide/vue";
import ItemCard from "~/components/wiki/item/Card.vue";
import WikiCardGrid from "~/components/wiki/WikiCardGrid.vue";
import {
  itemDetailUrl,
  itemTypeLabel,
  type ItemSummaryRow,
} from "~/lib/wiki/item";
import type {
  CharacterInventoryPresetRow,
  CharacterItemRow,
  CharacterYearlyPurchaseItemRow,
} from "~/composables/useCharacterData";
import type { WikiEnums } from "~/lib/wiki/character";

const props = defineProps<{
  defaultEquipmentItems: {
    weapon: CharacterItemRow | null;
    armor: CharacterItemRow | null;
  };
  inventoryPresets: CharacterInventoryPresetRow[];
  yearlyPurchaseItems: CharacterYearlyPurchaseItemRow[];
  enums: WikiEnums;
}>();

const defaultEquipmentCards = computed(() => {
  const rows = [];
  if (props.defaultEquipmentItems.weapon) {
    rows.push({
      ...props.defaultEquipmentItems.weapon,
      description: "默认武器",
    });
  }
  if (props.defaultEquipmentItems.armor) {
    rows.push({
      ...props.defaultEquipmentItems.armor,
      description: "默认防具",
    });
  }
  return rows;
});

function inventoryPresetName(item: CharacterInventoryPresetRow) {
  return item.show_name || item.item_name || `道具 ${item.item_id}`;
}

function inventoryPresetType(item: CharacterInventoryPresetRow) {
  return itemTypeLabel(item as Pick<ItemSummaryRow, "type_id">, props.enums);
}

function yearlyPurchaseType(item: CharacterYearlyPurchaseItemRow) {
  return itemTypeLabel(item as Pick<ItemSummaryRow, "type_id">, props.enums);
}
</script>

<template>
  <AppCard>
    <AppCardHeader>
      <CardTitle>角色物品</CardTitle>
    </AppCardHeader>
    <AppCardContent class="grid gap-3">
      <div class="grid auto-rows-min content-start gap-3">
        <div class="flex items-center gap-1.5 text-sm font-medium">
          <span>默认装备</span>
          <AppTooltip content-class="max-w-md border bg-white text-slate-950 shadow-md">
            <template #trigger>
              <AppButton
                type="button"
                variant="ghost"
                size="icon"
                class="size-6 text-muted-foreground"
              >
                <CircleHelp class="size-4" />
                <span class="sr-only">默认装备规则</span>
              </AppButton>
            </template>
            <div class="grid gap-2 text-sm">
              <p>读取角色表里的默认武器名和默认防具名作为装备模板名，再把膂力、根骨、体魄、身法四项相加，按总和映射装备稀有度档位：</p>
              <p class="break-all rounded px-2 py-1 font-mono text-xs">
                total = 膂力 + 根骨 + 体魄 + 身法
              </p>
              <div class="grid gap-1 rounded px-2 py-1 font-mono text-xs">
                <p>total &lt; 1600 -&gt; rarity 0</p>
                <p>1600 &lt;= total &lt; 2200 -&gt; rarity 1</p>
                <p>2200 &lt;= total &lt; 2800 -&gt; rarity 2</p>
                <p>2800 &lt;= total &lt; 3400 -&gt; rarity 3</p>
                <p>3400 &lt;= total -&gt; rarity 4</p>
              </div>
              <p>使用模板名 + 稀有度去匹配得到默认装备对应的装备</p>
            </div>
          </AppTooltip>
        </div>
        <WikiCardGrid
          :rows="defaultEquipmentCards"
          :total="defaultEquipmentCards.length"
          :page-size="Math.max(defaultEquipmentCards.length, 1)"
          :pagination="false"
          empty-label="暂无默认装备"
        >
          <ItemCard
            v-for="item in defaultEquipmentCards"
            :key="`${item.description}-${item.id}`"
            :id="item.id"
            :name="item.name || `道具 ${item.id}`"
            :image-id="item.image_id"
            :description="item.description"
            :rarity-id="item.rarity_id"
            :on-click="() => navigateTo(itemDetailUrl(item.id))"
          />
        </WikiCardGrid>
      </div>

      <div class="grid auto-rows-min content-start gap-3">
        <div class="text-sm font-medium">初始物品</div>
        <WikiCardGrid
          :rows="inventoryPresets"
          :total="inventoryPresets.length"
          :page-size="Math.max(inventoryPresets.length, 1)"
          :pagination="false"
          empty-label="暂无初始物品"
        >
          <ItemCard
            v-for="item in inventoryPresets"
            :key="item.source_row_index"
            :id="item.item_id"
            :name="inventoryPresetName(item)"
            :image-id="item.item_image_id"
            :description="inventoryPresetType(item)"
            :rarity-id="item.rarity_id"
            :action-text="`x${item.quantity}`"
            :on-click="() => navigateTo(itemDetailUrl(item.item_id))"
          />
        </WikiCardGrid>
      </div>

      <div class="grid auto-rows-min content-start gap-3">
        <div class="flex items-center gap-1.5 text-sm font-medium">
          <span>购买物品</span>
          <AppTooltip content-class="max-w-sm border bg-white text-slate-950 shadow-md">
            <template #trigger>
              <AppButton
                type="button"
                variant="ghost"
                size="icon"
                class="size-6 text-muted-foreground"
              >
                <CircleHelp class="size-4" />
                <span class="sr-only">购买规则</span>
              </AppButton>
            </template>
            <div class="grid gap-2 text-sm">
              <p>每年有 20% 概率触发一次普通物品购买</p>
              <p>候选池只包含琴谱、棋谱、书法、绘画、茶类、酒类 6 种喜好物品，稀有度按角色资历对应到同阶筛选</p>
              <p>候选池经过打乱后角色购买 1 个第一个买得起的物品，并扣除相应货币</p>
            </div>
          </AppTooltip>
        </div>
        <WikiCardGrid
          :rows="yearlyPurchaseItems"
          :total="yearlyPurchaseItems.length"
          :page-size="Math.max(yearlyPurchaseItems.length, 1)"
          :pagination="false"
          empty-label="暂无购买物品"
        >
          <ItemCard
            v-for="item in yearlyPurchaseItems"
            :key="item.id"
            :id="item.id"
            :name="item.name || `道具 ${item.id}`"
            :image-id="item.image_id"
            :description="yearlyPurchaseType(item)"
            :rarity-id="item.rarity_id"
            :on-click="() => navigateTo(itemDetailUrl(item.id))"
          />
        </WikiCardGrid>
      </div>
    </AppCardContent>
  </AppCard>
</template>
