<script setup lang="ts">
import {
  formatMartialArtDecimal,
  formatMartialArtNumber,
  martialArtPassiveDescription,
  type MartialArtLevelRow,
  type MartialArtPassiveTemplateMap,
  type MartialArtSummaryRow,
  type WikiEnums,
} from "~/lib/wiki/martial-art";

const props = defineProps<{
  martialArt: MartialArtSummaryRow;
  levels: MartialArtLevelRow[];
  passiveTemplates: MartialArtPassiveTemplateMap;
  enums: WikiEnums;
}>();

const levelRows = computed(() =>
  props.levels.map((level) => {
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
  const passiveId = Number(props.martialArt[`passive_${slot}_id` as keyof MartialArtSummaryRow]);
  const value = Number(level[`effect_${slot}_level` as const] || 0);
  if (!Number.isFinite(passiveId) || passiveId <= 0 || value <= 0) return "";
  return martialArtPassiveDescription(
    { passive_id: passiveId, value },
    props.enums,
    props.passiveTemplates,
  );
}
</script>

<template>
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
