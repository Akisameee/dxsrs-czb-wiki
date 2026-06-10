import { enumLabel } from "../utils";

import {
  linkCharactersInText,
  type WikiEnums,
  type WikiTextPart,
  wikiText,
} from "./text";

export type { WikiEnums } from "./text";

const INTERNAL_MARTIAL_ART_TYPE_ID = 6;

export type MartialArtSummaryRow = {
  id: number;
  sect_id: number | null;
  type_id: number | null;
  rarity_id: number;
  attack_area_id?: number | null;
  slash_effect_id?: number | null;
  hit_effect_id?: number | null;
  power: number | null;
  cost: number | null;
  interval?: number | null;
  accuracy?: number | null;
  obtain_method: string | null;
  is_sect_restricted: number;
  is_custom_source?: number;
  passive_1_id?: number | null;
  passive_1_value?: number | null;
  passive_2_id?: number | null;
  passive_2_value?: number | null;
  passive_3_id?: number | null;
  passive_3_value?: number | null;
};

export type MartialArtStyleRow = {
  martial_art_id: number;
  slot: number;
  style_id: number;
};

export type MartialArtEffectRow = {
  martial_art_id: number;
  slot: number;
  effect_id: number;
  target_id?: number | null;
  level: number;
};

export type MartialArtLevelRow = {
  martial_art_id: number;
  level: number;
  training_exp: number | null;
  required_strength: number | null;
  required_constitution: number | null;
  required_physique: number | null;
  required_agility: number | null;
  required_mastery: number | null;
  power: number | null;
  effect_1_level: number | null;
  effect_2_level: number | null;
  effect_3_level: number | null;
  hp: number | null;
  qi_recovery: number | null;
};

export type MartialArtPassiveSlot = {
  slot: number;
  passive_id: number;
  value: number | null;
};

export type MartialArtPassiveTemplateRow = {
  id: string;
  template: string;
};

export type MartialArtPassiveTemplateMap = Record<string, string>;

export type MartialArtEffectSummary = {
  id: string;
  text: string;
};

export type MartialArtSummary = {
  id: number;
  name: string;
  initial: string;
  detailUrl: string;
  rarityId: number | null;
  type: string;
  sect: string;
  rarity: string;
  styles: string[];
  effects: MartialArtEffectSummary[];
  passives: string[];
  obtainMethodParts: WikiTextPart[];
};

export function martialArtRarityToneId(id: number | string | null | undefined) {
  const value = Number(id);
  if (!Number.isFinite(value)) return null;
  return Math.max(0, value - 1);
}

export function martialArtIsInternal(item: Pick<MartialArtSummaryRow, "type_id">) {
  return Number(item.type_id) === INTERNAL_MARTIAL_ART_TYPE_ID;
}

export function martialArtName(item: Pick<MartialArtSummaryRow, "id">, enums: WikiEnums) {
  return enumLabel(enums, "MartialArt", item.id, `武学 ${item.id}`);
}

export function martialArtInitial(item: Pick<MartialArtSummaryRow, "id">, enums: WikiEnums) {
  return martialArtName(item, enums).slice(0, 1);
}

export function martialArtDetailUrl(id: number) {
  return `/martial-arts/detail/?id=${id}`;
}

export function martialArtTypeLabel(
  item: Pick<MartialArtSummaryRow, "type_id">,
  enums: WikiEnums,
) {
  return enumLabel(enums, "BingQiType", item.type_id, "未知类型");
}

export function martialArtSectLabel(
  item: Pick<MartialArtSummaryRow, "sect_id">,
  enums: WikiEnums,
) {
  return enumLabel(enums, "LianSuo_MP", item.sect_id, "无门派");
}

export function martialArtRarityLabel(
  item: Pick<MartialArtSummaryRow, "rarity_id">,
  enums: WikiEnums,
) {
  return enumLabel(enums, "WuGongRare", martialArtRarityToneId(item.rarity_id), "稀有度");
}

export function martialArtPassiveLabel(
  item: Pick<MartialArtPassiveSlot, "passive_id">,
  enums: WikiEnums,
) {
  return enumLabel(enums, "BeiDongType", item.passive_id, "无");
}

export function martialArtPassiveTemplateMap(rows: MartialArtPassiveTemplateRow[]) {
  return Object.fromEntries(rows.map((row) => [String(row.id), row.template || ""]));
}

export function formatMartialArtPassiveTemplate(
  template: string | null | undefined,
  value: number | null | undefined,
) {
  if (!template) return "";
  const param = formatMartialArtDecimal(value);
  return template.replaceAll("{param}", param);
}

export function martialArtPassiveDescription(
  item: Pick<MartialArtPassiveSlot, "passive_id" | "value">,
  enums: WikiEnums,
  templates: MartialArtPassiveTemplateMap = {},
) {
  const id = Number(item.passive_id);
  if (!Number.isFinite(id) || id <= 0) return "";

  const text = formatMartialArtPassiveTemplate(templates[String(id)], item.value);
  if (text) return text;

  const label = martialArtPassiveLabel(item, enums);
  const param = Number(item.value ?? 0);
  return Number.isFinite(param) && param > 0 ? `${label}（参数 ${param}）` : label;
}

export function martialArtPassiveSlots(item: MartialArtSummaryRow | null | undefined): MartialArtPassiveSlot[] {
  if (!item) return [];
  return [1, 2, 3].flatMap((slot) => {
    const passiveId = Number(item[`passive_${slot}_id` as keyof MartialArtSummaryRow]);
    if (!Number.isFinite(passiveId) || passiveId <= 0) return [];
    const value = Number(item[`passive_${slot}_value` as keyof MartialArtSummaryRow]);
    return [{
      slot,
      passive_id: passiveId,
      value: Number.isFinite(value) ? value : null,
    }];
  });
}

export function martialArtLevelPassiveDescriptions(
  level: Pick<MartialArtLevelRow, "hp" | "qi_recovery"> | null | undefined,
  templates: MartialArtPassiveTemplateMap = {},
) {
  if (!level) return [];
  const hp = Number(level.hp);
  const qiRecovery = Number(level.qi_recovery);
  return [
    Number.isFinite(hp) && hp > 0 ? formatMartialArtPassiveTemplate(templates.hp, hp) : "",
    Number.isFinite(qiRecovery) && qiRecovery > 0
      ? formatMartialArtPassiveTemplate(templates.qi_recovery, qiRecovery)
      : "",
  ].filter(Boolean);
}

export function martialArtRestrictionLabel(item: Pick<MartialArtSummaryRow, "is_sect_restricted">) {
  return item.is_sect_restricted ? "仅门派" : "可通用";
}

export function martialArtRestrictionValue(item: Pick<MartialArtSummaryRow, "is_sect_restricted">) {
  return item.is_sect_restricted ? "是" : "否";
}

export function martialArtAttackAreaLabel(
  item: Pick<MartialArtSummaryRow, "attack_area_id">,
  enums: WikiEnums,
) {
  return enumLabel(enums, "AttackArea", item.attack_area_id, "无范围");
}

export function martialArtStyleLabel(row: MartialArtStyleRow, enums: WikiEnums) {
  return enumLabel(enums, "LianSuo_FG", row.style_id, `风格 ${row.style_id}`);
}

export function martialArtEffectLabel(row: Pick<MartialArtEffectRow, "effect_id" | "level">, enums: WikiEnums) {
  const label = enumLabel(enums, "BuffType", row.effect_id, `效果 ${row.effect_id}`);
  return Number(row.level) > 0 ? `${label} ${row.level}` : label;
}

export function martialArtEffectName(
  row: Pick<MartialArtEffectRow, "effect_id"> | undefined,
  enums: WikiEnums,
  fallback: string,
) {
  if (!row) return fallback;
  return enumLabel(enums, "BuffType", row.effect_id, fallback);
}

export function martialArtAssetEffectLabel(value: number | null | undefined) {
  const number = Number(value);
  if (!Number.isFinite(number) || number === 999) return "无特效";
  return String(number);
}

export function formatMartialArtNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  return String(Math.round(Number(value)));
}

export function formatMartialArtDecimal(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  return String(Math.round(Number(value) * 100) / 100);
}

export function formatMartialArtPercent(value: number | null | undefined) {
  const text = formatMartialArtNumber(value);
  return text === "-" ? "-" : `${text}%`;
}

export function buildMartialArtSummary(
  martialArt: MartialArtSummaryRow,
  styles: MartialArtStyleRow[],
  effects: MartialArtEffectRow[],
  levels: MartialArtLevelRow[],
  enums: WikiEnums,
  passiveTemplates: MartialArtPassiveTemplateMap = {},
): MartialArtSummary {
  const highestLevel = levels.at(-1) || null;
  const obtainMethodParts = linkCharactersInText(martialArt.obtain_method, enums);

  return {
    id: martialArt.id,
    name: martialArtName(martialArt, enums),
    initial: martialArtInitial(martialArt, enums),
    detailUrl: martialArtDetailUrl(martialArt.id),
    rarityId: martialArtRarityToneId(martialArt.rarity_id),
    type: martialArtTypeLabel(martialArt, enums),
    sect: martialArtSectLabel(martialArt, enums),
    rarity: martialArtRarityLabel(martialArt, enums),
    styles: styles
      .map((row) => martialArtStyleLabel(row, enums))
      .filter(Boolean),
    effects: effects.map((row) => ({
      id: `${row.martial_art_id}-${row.slot}`,
      text: martialArtEffectLabel(row, enums),
    })),
    passives: [
      ...martialArtPassiveSlots(martialArt)
        .map((row) => martialArtPassiveDescription(row, enums, passiveTemplates))
        .filter(Boolean),
      ...martialArtLevelPassiveDescriptions(highestLevel, passiveTemplates),
    ],
    obtainMethodParts: obtainMethodParts.length ? obtainMethodParts : [wikiText("-")],
  };
}
