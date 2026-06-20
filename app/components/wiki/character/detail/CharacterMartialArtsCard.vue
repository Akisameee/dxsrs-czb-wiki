<script setup lang="ts">
import { CircleHelp } from "@lucide/vue";
import MartialArtCard from "~/components/wiki/martial-art/Card.vue";
import WikiCardGrid from "~/components/wiki/WikiCardGrid.vue";
import { martialArtDetailUrl } from "~/lib/wiki/martial-art";
import type { CharacterMartialArtCard } from "~/lib/wiki/character-martial-arts";

type CharacterMartialArtView = "initial" | "all";

const props = defineProps<{
  initialCards: CharacterMartialArtCard[];
  allCards: CharacterMartialArtCard[];
}>();

const view = ref<CharacterMartialArtView>("initial");
const viewOptions = [
  { value: "initial", label: "初始" },
  { value: "all", label: "全部" },
] satisfies Array<{ value: CharacterMartialArtView; label: string }>;

const activeCards = computed(() => (
  view.value === "all"
    ? props.allCards
    : props.initialCards
));
</script>

<template>
  <AppCard>
    <AppCardHeader>
      <div class="flex flex-wrap items-center gap-3">
        <CardTitle>角色武学</CardTitle>
        <AppTooltip content-class="max-w-md border bg-white text-slate-950 shadow-md">
          <template #trigger>
            <AppButton
              type="button"
              variant="ghost"
              size="icon"
              class="size-6 text-muted-foreground"
            >
              <CircleHelp class="size-4" />
              <span class="sr-only">角色武学说明</span>
            </AppButton>
          </template>
          <div class="grid gap-2 text-sm">
            <p>随着角色等级提升，武学会逐渐解锁</p>
            <p>每次跨年会先结算角色升级和四维成长，再用当前膂力、根骨、体魄、身法的均值计算应有武学总数上限：</p>
            <p class="break-all rounded px-2 py-1 font-mono text-xs">
              targetCount = min(10, FloorToInt((RoundToInt((膂力 + 根骨 + 体魄 + 身法) / 4) - 300) / 50) + 2)
            </p>
            <p>得到上限后再按照角色武学池内顺序，从前往后补足武学</p>
          </div>
        </AppTooltip>
        <AppTabsToggle v-model="view" :options="viewOptions" />
      </div>
    </AppCardHeader>
    <AppCardContent>
      <WikiCardGrid
        :rows="activeCards"
        :total="activeCards.length"
        :page-size="Math.max(activeCards.length, 1)"
        :pagination="false"
        empty-label="暂无武学"
      >
        <MartialArtCard
          v-for="item in activeCards"
          :key="`${item.slot}-${item.id}`"
          role="link"
          :id="item.id"
          :name="item.name"
          :type="item.type"
          :type-id="item.typeId"
          :rarity-id="item.rarityId"
          :rarity-tone-id="item.rarityToneId"
          :sect-id="item.sectId"
          :sect-label="item.sectLabel"
          :styles="item.styles"
          :on-click="() => navigateTo(martialArtDetailUrl(item.id))"
        />
      </WikiCardGrid>
    </AppCardContent>
  </AppCard>
</template>
