import { enumMapFromRows } from "~/lib/utils";
import {
  buildMartialArtSummary,
  martialArtPassiveTemplateMap,
  type MartialArtEffectRow,
  type MartialArtAssetEffectLayerRow,
  type MartialArtAssetEffectRow,
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
  assetEffects: MartialArtAssetEffectRow[];
  assetEffectLayers: MartialArtAssetEffectLayerRow[];
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

  async function loadMartialArtAssetEffects(martialArt: MartialArtSummaryRow | null) {
    const slashEffectId = Number(martialArt?.slash_effect_id);
    const hitEffectId = Number(martialArt?.hit_effect_id);
    const pairs = [
      Number.isFinite(slashEffectId) && slashEffectId !== 999 ? { kind: "slash", id: slashEffectId } : null,
      Number.isFinite(hitEffectId) && hitEffectId !== 999 ? { kind: "hit", id: hitEffectId } : null,
    ].filter((item): item is { kind: "slash" | "hit"; id: number } => Boolean(item));

    if (!pairs.length) return { assetEffects: [], assetEffectLayers: [] };

    const conditions = pairs.map(() => "(kind = ? AND effect_id = ?)").join(" OR ");
    const params = pairs.flatMap((pair) => [pair.kind, pair.id]);
    const assetEffects = await queryRows<MartialArtAssetEffectRow>(
      `SELECT kind, effect_id, array_name, array_index, prefab_source, prefab_path_id, prefab_name,
        primary_texture_source, primary_texture_path_id, primary_texture_name, duration, layer_count
       FROM asset_effects
       WHERE ${conditions}
       ORDER BY kind, effect_id`,
      params,
    );
    const assetEffectLayers = await queryRows<MartialArtAssetEffectLayerRow>(
      `SELECT kind, effect_id, layer_index, texture_slot, game_object_name, depth,
        particle_system_path_id, renderer_path_id, renderer_type, sorting_order, material_name,
        texture_property, texture_source, texture_path_id, texture_name, texture_width,
        texture_height, duration, simulation_speed, looping, uv_enabled, tiles_x, tiles_y,
        frame_count, fps, cycles, row_mode, row_index, start_frame, frame_curve, start_size,
        start_lifetime, start_lifetime_curve, start_speed, start_speed_curve, start_color,
        start_rotation, gravity_modifier, gravity_modifier_curve, max_particles, size_curve,
        color_gradient, rotation_enabled, rotation_curve, burst_count, emission_rate,
        emission_rate_curve, emission_bursts, shape_enabled, shape_type, shape_angle,
        shape_radius, shape_arc, shape_length, shape_position_x, shape_position_y,
        shape_position_z, shape_rotation_x, shape_rotation_y, shape_rotation_z,
        shape_scale_x, shape_scale_y, shape_scale_z, random_direction_amount,
        spherical_direction_amount, random_position_amount, velocity_enabled, velocity_x,
        velocity_y, velocity_z, velocity_radial, velocity_orbital_x, velocity_orbital_y,
        velocity_orbital_z, force_enabled, force_x, force_y, force_z
       FROM asset_effect_layers
       WHERE ${conditions}
       ORDER BY kind, effect_id, sorting_order, layer_index, texture_slot`,
      params,
    );

    return { assetEffects, assetEffectLayers };
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
    const { assetEffects, assetEffectLayers } = await loadMartialArtAssetEffects(martialArt);

    const detail = { martialArt, styles, effects, assetEffects, assetEffectLayers, levels, passiveTemplates, enums };
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
    loadMartialArtAssetEffects,
    loadMartialArtLevels,
    loadMartialArtDetail,
    loadMartialArtSummary,
  };
}
