<script setup lang="ts">
import MartialArtIcon from "~/components/wiki/martial-art/MartialArtIcon.vue";
import SectHoverLink from "~/components/wiki/sect/HoverLink.vue";
import StyleHoverLink from "~/components/wiki/style/HoverLink.vue";
import {
  formatMartialArtNumber,
  formatMartialArtPercent,
  martialArtAttackAreaLabel,
  martialArtEffectLabel,
  martialArtIsInternal,
  martialArtName,
  martialArtRarityLabel,
  martialArtRestrictionValue,
  martialArtSectLabel,
  martialArtStyleLabel,
  martialArtTypeLabel,
  type MartialArtEffectRow,
  type MartialArtStyleRow,
  type MartialArtSummaryRow,
  type WikiEnums,
} from "~/lib/wiki/martial-art";

const props = defineProps<{
  martialArt: MartialArtSummaryRow;
  styles: MartialArtStyleRow[];
  effects: MartialArtEffectRow[];
  enums: WikiEnums;
}>();

const isInternalMartialArt = computed(() => martialArtIsInternal(props.martialArt));
const styleItems = computed(() =>
  props.styles
    .map((row) => ({
      id: row.style_id,
      label: martialArtStyleLabel(row, props.enums),
    }))
    .filter((row) => row.label),
);
const effectBadges = computed(() =>
  props.effects
    .filter((item) => Number(item.level) > 0)
    .map((item) => ({
      id: `${item.martial_art_id}-${item.slot}`,
      text: martialArtEffectLabel(item, props.enums),
    })),
);
</script>

<template>
  <AppCard>
    <AppCardHeader>
      <CardTitle>基础信息</CardTitle>
    </AppCardHeader>
    <AppCardContent class="grid gap-6 text-sm md:grid-cols-[auto_1fr]">
      <div class="flex w-32 items-center justify-center justify-self-center rounded-md md:justify-self-start">
        <MartialArtIcon
          :name="martialArtName(martialArt)"
          :type-id="martialArt.type_id"
          :rarity-id="martialArt.rarity_id"
          class="w-full"
        />
      </div>
      <div class="grid content-start items-start gap-3 text-sm grid-cols-2">
        <AppInfoRow label="类型" :value="martialArtTypeLabel(martialArt, enums)" />
        <AppInfoRow label="门派">
          <template #default>
            <SectHoverLink
              mode="link"
              :id="martialArt.sect_id"
              :label="martialArtSectLabel(martialArt)"
            />
          </template>
        </AppInfoRow>
        <AppInfoRow label="稀有度" :value="martialArtRarityLabel(martialArt, enums)" />
        <AppInfoRow label="门派限制" :value="martialArtRestrictionValue(martialArt)" />
        <AppInfoRow
          v-if="!isInternalMartialArt"
          label="真气消耗"
          :value="formatMartialArtNumber(martialArt.cost)"
        />
        <AppInfoRow
          v-if="!isInternalMartialArt"
          label="攻击范围"
          :value="martialArtAttackAreaLabel(martialArt, enums)"
        />
        <AppInfoRow
          v-if="!isInternalMartialArt"
          label="出招间隔"
          :value="martialArt.interval === null || martialArt.interval === undefined ? '无间隔' : formatMartialArtNumber(martialArt.interval)"
        />
        <AppInfoRow
          v-if="!isInternalMartialArt"
          label="命中率"
          :value="martialArt.accuracy === null || martialArt.accuracy === undefined ? '无命中' : formatMartialArtPercent(martialArt.accuracy)"
        />
        <AppInfoRow label="风格">
          <div v-if="styleItems.length" class="flex flex-wrap justify-end gap-2">
            <StyleHoverLink
              v-for="style in styleItems"
              :key="style.id"
              :id="style.id"
              :label="style.label"
            />
          </div>
          <template v-else>无风格</template>
        </AppInfoRow>
        <AppInfoRow label="效果">
          <div v-if="effectBadges.length" class="flex flex-wrap justify-end gap-2">
            <Badge
              v-for="item in effectBadges"
              :key="item.id"
              variant="secondary"
            >
              {{ item.text }}
            </Badge>
          </div>
          <template v-else>无效果</template>
        </AppInfoRow>
      </div>
    </AppCardContent>
  </AppCard>
</template>
