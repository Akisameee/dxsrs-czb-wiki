import { enumMapFromRows } from "~/lib/utils";
import {
  buildMartialArtSummary,
  martialArtPassiveTemplateMap,
  type MartialArtEffectRow,
  type MartialArtLevelRow,
  type MartialArtPassiveTemplateMap,
  type MartialArtPassiveTemplateRow,
  type MartialArtStyleRow,
  type MartialArtSummary,
  type MartialArtSummaryRow,
  type WikiEnums,
} from "~/lib/wiki/martial-art";

type EnumRow = { type: string; id: number; label: string | null };

export type MartialArtDetailData = {
  martialArt: MartialArtSummaryRow | null;
  styles: MartialArtStyleRow[];
  effects: MartialArtEffectRow[];
  levels: MartialArtLevelRow[];
  passiveTemplates: MartialArtPassiveTemplateMap;
  enums: WikiEnums;
};

const summaryCache = new Map<number, MartialArtSummary | null>();
const detailCache = new Map<number, MartialArtDetailData>();
let enumsPromise: Promise<WikiEnums> | null = null;
let passiveTemplatesPromise: Promise<MartialArtPassiveTemplateMap> | null = null;

export function useMartialArtData() {
  const { queryRows } = useWikiDb();

  async function loadEnums() {
    enumsPromise ||= queryRows<EnumRow>("SELECT type, id, label FROM enums ORDER BY type, id")
      .then((rows) => enumMapFromRows(rows));
    return enumsPromise;
  }

  async function loadPassiveTemplates() {
    passiveTemplatesPromise ||= queryRows<MartialArtPassiveTemplateRow>(
      "SELECT id, template FROM martial_art_passive_templates",
    ).then((rows) => martialArtPassiveTemplateMap(rows));
    return passiveTemplatesPromise;
  }

  async function loadMartialArt(id: number) {
    const rows = await queryRows<MartialArtSummaryRow>(
      `SELECT id, sect_id, type_id, rarity_id, attack_area_id, slash_effect_id, hit_effect_id,
        power, cost, interval, accuracy, obtain_method, is_sect_restricted, is_custom_source,
        passive_1_id, passive_1_value, passive_2_id, passive_2_value, passive_3_id, passive_3_value
       FROM martial_arts
       WHERE id = ?`,
      [id],
    );
    return rows[0] || null;
  }

  function loadMartialArtStyles(id: number) {
    return queryRows<MartialArtStyleRow>(
      "SELECT martial_art_id, slot, style_id FROM martial_art_styles WHERE martial_art_id = ? ORDER BY slot",
      [id],
    );
  }

  function loadMartialArtEffects(id: number) {
    return queryRows<MartialArtEffectRow>(
      "SELECT martial_art_id, slot, effect_id, target_id, level FROM martial_art_effects WHERE martial_art_id = ? ORDER BY slot",
      [id],
    );
  }

  function loadMartialArtLevels(id: number) {
    return queryRows<MartialArtLevelRow>(
      `SELECT martial_art_id, level, training_exp, required_strength, required_constitution,
        required_physique, required_agility, required_mastery, power, effect_1_level, effect_2_level,
        effect_3_level, hp, qi_recovery
       FROM martial_art_levels
       WHERE martial_art_id = ?
       ORDER BY level`,
      [id],
    );
  }

  async function loadMartialArtDetail(id: number): Promise<MartialArtDetailData> {
    if (detailCache.has(id)) return detailCache.get(id)!;

    const [martialArt, styles, effects, levels, passiveTemplates, enums] = await Promise.all([
      loadMartialArt(id),
      loadMartialArtStyles(id),
      loadMartialArtEffects(id),
      loadMartialArtLevels(id),
      loadPassiveTemplates(),
      loadEnums(),
    ]);

    const detail = { martialArt, styles, effects, levels, passiveTemplates, enums };
    detailCache.set(id, detail);
    return detail;
  }

  async function loadMartialArtSummary(id: number) {
    if (summaryCache.has(id)) return summaryCache.get(id) || null;

    const detail = await loadMartialArtDetail(id);
    const nextSummary = detail.martialArt
      ? buildMartialArtSummary(
        detail.martialArt,
        detail.styles,
        detail.effects,
        detail.levels,
        detail.enums,
        detail.passiveTemplates,
      )
      : null;
    summaryCache.set(id, nextSummary);
    return nextSummary;
  }

  return {
    loadEnums,
    loadPassiveTemplates,
    loadMartialArt,
    loadMartialArtStyles,
    loadMartialArtEffects,
    loadMartialArtLevels,
    loadMartialArtDetail,
    loadMartialArtSummary,
  };
}
