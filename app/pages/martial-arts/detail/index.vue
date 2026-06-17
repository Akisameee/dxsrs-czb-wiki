<script setup lang="ts">
import { rarityCardClass } from "~/lib/rarity";
import MartialArtEffectPreview from "~/components/wiki/martial-art/MartialArtEffectPreview.vue";
import MartialArtIcon from "~/components/wiki/martial-art/MartialArtIcon.vue";
import SectHoverLink from "~/components/wiki/sect/HoverLink.vue";
import StyleHoverLink from "~/components/wiki/style/HoverLink.vue";
import WikiText from "~/components/wiki/WikiText.vue";
import {
  formatMartialArtDecimal,
  formatMartialArtNumber,
  formatMartialArtPercent,
  martialArtAttackAreaLabel,
  martialArtEffectLabel,
  martialArtName,
  martialArtIsInternal,
  martialArtLevelPassiveDescriptions,
  martialArtPassiveDescription,
  martialArtPassiveSlots,
  martialArtRarityToneId,
  martialArtRarityLabel,
  martialArtRestrictionValue,
  martialArtSectLabel,
  martialArtStyleLabel,
  martialArtTypeLabel,
  type MartialArtLevelRow,
  type MartialArtSummaryRow,
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
const isInternalMartialArt = computed(() => martialArt.value ? martialArtIsInternal(martialArt.value) : false);
const styleItems = computed(() =>
  (data.value?.styles || [])
    .map((row) => ({
      id: row.style_id,
      label: martialArtStyleLabel(row, enums.value),
    }))
    .filter((row) => row.label),
);
const effects = computed(() => data.value?.effects || []);
const assetEffects = computed(() => data.value?.assetEffects || []);
const assetEffectLayers = computed(() => data.value?.assetEffectLayers || []);
const levels = computed(() => data.value?.levels || []);
const highestLevel = computed(() => levels.value[levels.value.length - 1] || null);
const effectBadges = computed(() =>
  effects.value
    .filter((item) => Number(item.level) > 0)
    .map((item) => ({
      id: `${item.martial_art_id}-${item.slot}`,
      text: martialArtEffectLabel(item, enums.value),
    })),
);
const passiveLines = computed(() => [
  ...martialArtPassiveSlots(martialArt.value)
    .map((item) => martialArtPassiveDescription(item, enums.value, passiveTemplates.value))
    .filter(Boolean),
  ...martialArtLevelPassiveDescriptions(highestLevel.value, passiveTemplates.value),
]);
const obtainMethodParts = computed(() => {
  const parts = data.value?.obtainMethodParts || [];
  return parts.length ? parts : [{ type: "text" as const, text: "-" }];
});
const levelRows = computed(() =>
  levels.value.map((level) => {
    const effectsText = [1, 2, 3]
      .map((slot) => levelEffectText(level, slot as 1 | 2 | 3))
      .filter(Boolean)
      .join(" / ");
    return {
      ...level,
      powerText: formatMartialArtDecimal(level.power),
      hpText: formatMartialArtNumber(level.hp),
      qiRecoveryText: formatMartialArtDecimal(level.qi_recovery),
      trainingExpText: formatMartialArtNumber(level.training_exp),
      strengthText: formatMartialArtNumber(level.required_strength),
      constitutionText: formatMartialArtNumber(level.required_constitution),
      physiqueText: formatMartialArtNumber(level.required_physique),
      agilityText: formatMartialArtNumber(level.required_agility),
      masteryText: formatMartialArtNumber(level.required_mastery),
      effectsText: effectsText || "-",
    };
  }),
);

function levelEffectText(level: MartialArtLevelRow, slot: 1 | 2 | 3) {
  const passiveId = Number(martialArt.value?.[`passive_${slot}_id` as keyof MartialArtSummaryRow]);
  const value = Number(level[`effect_${slot}_level` as const] || 0);
  if (!Number.isFinite(passiveId) || passiveId <= 0 || value <= 0) return "";
  return martialArtPassiveDescription(
    { passive_id: passiveId, value },
    enums.value,
    passiveTemplates.value,
  );
}

function assetEffect(kind: "slash" | "hit", effectId: number | null | undefined) {
  const id = Number(effectId);
  if (!Number.isFinite(id)) return null;
  return assetEffects.value.find((item) => item.kind === kind && Number(item.effect_id) === id) || null;
}

function assetEffectPreviewLayers(kind: "slash" | "hit", effectId: number | null | undefined) {
  const id = Number(effectId);
  if (!Number.isFinite(id)) return [];
  return assetEffectLayers.value.filter((item) => item.kind === kind && Number(item.effect_id) === id);
}
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
      <AppCard :class="rarityCardClass(martialArtRarityToneId(martialArt.rarity_id))">
        <AppCardHeader>
          <div class="grid gap-2">
            <div>
              <CardTitle class="text-2xl">{{ martialArtName(martialArt) }}</CardTitle>
              <CardDescription class="truncate">
                {{ martialArtTypeLabel(martialArt, enums) }}
              </CardDescription>
            </div>
          </div>
        </AppCardHeader>
      </AppCard>

      <div class="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
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
              <div class="flex items-start justify-between gap-3">
                <span class="text-muted-foreground">类型</span>
                <span>{{ martialArtTypeLabel(martialArt, enums) }}</span>
              </div>
              <div class="flex items-start justify-between gap-3">
                <span class="text-muted-foreground">门派</span>
                <SectHoverLink
                  mode="link"
                  :id="martialArt.sect_id"
                  :label="martialArtSectLabel(martialArt)"
                />
              </div>
              <div class="flex items-start justify-between gap-3">
                <span class="text-muted-foreground">稀有度</span>
                <span>{{ martialArtRarityLabel(martialArt, enums) }}</span>
              </div>
              <div class="flex items-start justify-between gap-3">
                <span class="text-muted-foreground">门派限制</span>
                <span>{{ martialArtRestrictionValue(martialArt) }}</span>
              </div>
              <div v-if="!isInternalMartialArt" class="flex items-start justify-between gap-3">
                <span class="text-muted-foreground">真气消耗</span>
                <span>{{ formatMartialArtNumber(martialArt.cost) }}</span>
              </div>
              <div v-if="!isInternalMartialArt" class="flex items-start justify-between gap-3">
                <span class="text-muted-foreground">攻击范围</span>
                <span>{{ martialArtAttackAreaLabel(martialArt, enums) }}</span>
              </div>
              <div v-if="!isInternalMartialArt" class="flex items-start justify-between gap-3">
                <span class="text-muted-foreground">出招间隔</span>
                <span>{{ martialArt.interval === null || martialArt.interval === undefined ? "无间隔" : formatMartialArtNumber(martialArt.interval) }}</span>
              </div>
              <div v-if="!isInternalMartialArt" class="flex items-start justify-between gap-3">
                <span class="text-muted-foreground">命中率</span>
                <span>{{ martialArt.accuracy === null || martialArt.accuracy === undefined ? "无命中" : formatMartialArtPercent(martialArt.accuracy) }}</span>
              </div>
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="text-muted-foreground">风格</span>
                <div v-if="styleItems.length" class="flex flex-wrap justify-end gap-2">
                  <StyleHoverLink
                    v-for="style in styleItems"
                    :key="style.id"
                    :id="style.id"
                    :label="style.label"
                  />
                </div>
                <span v-else>无风格</span>
              </div>
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="text-muted-foreground">效果</span>
                <div v-if="effectBadges.length" class="flex flex-wrap justify-end gap-2">
                  <Badge
                    v-for="item in effectBadges"
                    :key="item.id"
                    variant="secondary"
                  >
                    {{ item.text }}
                  </Badge>
                </div>
                <span v-else>无效果</span>
              </div>
            </div>
          </AppCardContent>
        </AppCard>

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
            <span v-else class="text-muted-foreground">无被动</span>
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
      </div>

      <AppCard>
        <AppCardHeader>
          <CardTitle>获取方式</CardTitle>
        </AppCardHeader>
        <AppCardContent class="text-sm leading-7">
          <WikiText :parts="obtainMethodParts" />
        </AppCardContent>
      </AppCard>

      <AppCard>
        <AppCardHeader>
          <CardTitle>等级成长</CardTitle>
        </AppCardHeader>
        <AppCardContent>
          <div v-if="levelRows.length" class="overflow-auto">
            <Table class="[&_td]:text-center [&_th]:text-center">
              <TableHeader>
                <TableRow>
                  <TableHead rowspan="2">境界</TableHead>
                  <TableHead rowspan="2">威力</TableHead>
                  <TableHead rowspan="2">体力</TableHead>
                  <TableHead rowspan="2">真气恢复</TableHead>
                  <TableHead rowspan="2">修炼经验</TableHead>
                  <TableHead colspan="5" class="text-center">属性加成</TableHead>
                  <TableHead rowspan="2">特殊被动</TableHead>
                </TableRow>
                <TableRow>
                  <TableHead>膂力</TableHead>
                  <TableHead>根骨</TableHead>
                  <TableHead>体魄</TableHead>
                  <TableHead>身法</TableHead>
                  <TableHead>武艺</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow
                  v-for="item in levelRows"
                  :key="`${item.martial_art_id}-${item.level}`"
                >
                  <TableCell>第 {{ item.level }} 重</TableCell>
                  <TableCell>{{ item.powerText }}</TableCell>
                  <TableCell>{{ item.hpText }}</TableCell>
                  <TableCell>{{ item.qiRecoveryText }}</TableCell>
                  <TableCell>{{ item.trainingExpText }}</TableCell>
                  <TableCell>{{ item.strengthText }}</TableCell>
                  <TableCell>{{ item.constitutionText }}</TableCell>
                  <TableCell>{{ item.physiqueText }}</TableCell>
                  <TableCell>{{ item.agilityText }}</TableCell>
                  <TableCell>{{ item.masteryText }}</TableCell>
                  <TableCell>{{ item.effectsText }}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <div v-else class="text-sm text-muted-foreground">
            无等级成长数据
          </div>
        </AppCardContent>
      </AppCard>

    </template>
  </AppPageContainer>
</template>
