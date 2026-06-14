import { enumLabel } from "../utils";

import {
  linkCharactersInText,
  type WikiEnums,
  type WikiTextPart,
  wikiStrong,
  wikiText,
} from "./text";

export type { WikiEnums } from "./text";

const INTERNAL_MARTIAL_ART_TYPE_ID = 6;

export type MartialArtSummaryRow = {
  id: number;
  name: string | null;
  sect_id: number | null;
  sect_name?: string | null;
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

export type MartialArtAssetEffectRow = {
  kind: "hit" | "slash";
  effect_id: number;
  array_name: string | null;
  array_index: number | null;
  prefab_name: string | null;
  image_id: string | null;
  duration: number | null;
  layer_count: number;
};

export type MartialArtAssetEffectLayerRow = {
  kind: "hit" | "slash";
  effect_id: number;
  layer_index: number;
  texture_slot: number;
  game_object_name: string | null;
  depth: number;
  renderer_type: string | null;
  sorting_order: number;
  material_name: string | null;
  texture_property: string | null;
  image_id: string;
  duration: number | null;
  simulation_speed: number | null;
  looping: number;
  uv_enabled: number;
  tiles_x: number;
  tiles_y: number;
  frame_count: number;
  fps: number | null;
  cycles: number | null;
  row_mode: number | null;
  row_index: number | null;
  start_frame: number | null;
  frame_curve: string | null;
  start_size: number | null;
  start_lifetime: number | null;
  start_lifetime_curve: string | null;
  start_speed: number | null;
  start_speed_curve: string | null;
  start_color: string | null;
  start_rotation: number | null;
  gravity_modifier: number | null;
  gravity_modifier_curve: string | null;
  max_particles: number | null;
  size_curve: string | null;
  color_gradient: string | null;
  rotation_enabled: number;
  rotation_curve: string | null;
  burst_count: number;
  emission_rate: number | null;
  emission_rate_curve: string | null;
  emission_bursts: string | null;
  shape_enabled: number;
  shape_type: number | null;
  shape_angle: number | null;
  shape_radius: number | null;
  shape_arc: number | null;
  shape_length: number | null;
  shape_position_x: number | null;
  shape_position_y: number | null;
  shape_position_z: number | null;
  shape_rotation_x: number | null;
  shape_rotation_y: number | null;
  shape_rotation_z: number | null;
  shape_scale_x: number | null;
  shape_scale_y: number | null;
  shape_scale_z: number | null;
  random_direction_amount: number | null;
  spherical_direction_amount: number | null;
  random_position_amount: number | null;
  velocity_enabled: number;
  velocity_x: string | null;
  velocity_y: string | null;
  velocity_z: string | null;
  velocity_radial: string | null;
  velocity_orbital_x: string | null;
  velocity_orbital_y: string | null;
  velocity_orbital_z: string | null;
  force_enabled: number;
  force_x: string | null;
  force_y: string | null;
  force_z: string | null;
};

export type MartialArtPassiveSlot = {
  slot: number;
  passive_id: number;
  value: number | null;
};

export type PassiveRow = {
  id: string;
  template: string;
  image_id?: string | null;
};

export type MartialArtPassiveTemplateMap = Record<string, string>;

export type MartialArtPassiveChainRow = {
  id: number;
  passive_type: "sect" | "style";
  count: number;
  passive_id?: string | null;
  template?: string | null;
  param1?: number | null;
  param2?: number | null;
  image_id?: string | null;
};

export type MartialArtEffectSummary = {
  id: string;
  text: string;
};

export type MartialArtSummary = {
  id: number;
  name: string;
  initial: string;
  detailUrl: string;
  typeId: number | null;
  rarityRawId: number | null;
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

export function martialArtName(item: Pick<MartialArtSummaryRow, "id" | "name">) {
  return item.name || `武学 ${item.id}`;
}

export function martialArtInitial(item: Pick<MartialArtSummaryRow, "id" | "name">) {
  return martialArtName(item).slice(0, 1);
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
  item: Pick<MartialArtSummaryRow, "sect_id" | "sect_name">,
) {
  return item.sect_name || "无门派";
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

export function martialArtPassiveTemplateMap(rows: PassiveRow[]) {
  return Object.fromEntries(rows.map((row) => [String(row.id), row.template || ""]));
}

function passiveTemplateValues(value: number | string | (number | string)[] | null | undefined) {
  const values = Array.isArray(value) ? value : [value];
  return values.map((item) => formatMartialArtDecimal(item));
}

export function formatMartialArtPassiveTemplate(
  template: string | null | undefined,
  value: number | string | (number | string)[] | null | undefined,
) {
  return formatMartialArtPassiveTemplateParts(template, value).map((part) => part.text).join("");
}

export function formatMartialArtPassiveTemplateParts(
  template: string | null | undefined,
  value: number | string | (number | string)[] | null | undefined,
): WikiTextPart[] {
  if (!template) return [];
  const values = passiveTemplateValues(value);
  const parts: WikiTextPart[] = [];
  let index = 0;
  const pattern = /\{param(\d*)\}/g;
  for (const match of template.matchAll(pattern)) {
    if (match.index === undefined) continue;
    if (match.index > index) parts.push(wikiText(template.slice(index, match.index)));
    const valueIndex = match[1] ? Number(match[1]) - 1 : 0;
    parts.push(wikiStrong(values[valueIndex] || "-"));
    index = match.index + match[0].length;
  }
  if (index < template.length) parts.push(wikiText(template.slice(index)));
  return parts;
}

export function martialArtPassiveChainDescription(
  row: MartialArtPassiveChainRow,
  _templates: MartialArtPassiveTemplateMap = {},
) {
  return martialArtPassiveChainDescriptionParts(row).map((part) => part.text).join("");
}

export function martialArtPassiveChainDescriptionParts(row: MartialArtPassiveChainRow) {
  const values = [row.param1, row.param2].filter((value) => value !== null && value !== undefined);
  const parts = formatMartialArtPassiveTemplateParts(row.template, values);
  return parts.length ? parts : [];
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

export function formatMartialArtDecimal(value: number | string | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  return String(Math.round(Number(value) * 100) / 100);
}

export function formatMartialArtPercent(value: number | null | undefined) {
  const text = formatMartialArtNumber(value);
  return text === "-" ? "-" : `${text}%`;
}

export async function buildMartialArtSummary(
  martialArt: MartialArtSummaryRow,
  styles: MartialArtStyleRow[],
  effects: MartialArtEffectRow[],
  levels: MartialArtLevelRow[],
  enums: WikiEnums,
  passiveTemplates: MartialArtPassiveTemplateMap = {},
): Promise<MartialArtSummary> {
  const highestLevel = levels.at(-1) || null;
  const obtainMethodParts = await linkCharactersInText(martialArt.obtain_method);

  return {
    id: martialArt.id,
    name: martialArtName(martialArt),
    initial: martialArtInitial(martialArt),
    detailUrl: martialArtDetailUrl(martialArt.id),
    typeId: martialArt.type_id ?? null,
    rarityRawId: martialArt.rarity_id ?? null,
    rarityId: martialArtRarityToneId(martialArt.rarity_id),
    type: martialArtTypeLabel(martialArt, enums),
    sect: martialArtSectLabel(martialArt),
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
