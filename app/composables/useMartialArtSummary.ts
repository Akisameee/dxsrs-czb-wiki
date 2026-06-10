import type { MaybeRefOrGetter } from "vue";
import { computed, ref, shallowRef, toValue, watch } from "vue";
import { enumMapFromRows } from "~/lib/utils";
import {
  buildMartialArtSummary,
  type MartialArtEffectRow,
  type MartialArtLevelRow,
  type MartialArtSummary,
  type MartialArtStyleRow,
  type MartialArtSummaryRow,
  type WikiEnums,
} from "~/lib/wiki/martial-art";

type EnumRow = { type: string; id: number; label: string | null };

const summaryCache = new Map<number, MartialArtSummary | null>();
let enumsPromise: Promise<WikiEnums> | null = null;

export function useMartialArtSummary(id: MaybeRefOrGetter<number | string | null | undefined>) {
  const { queryRows } = useWikiDb();
  const summary = shallowRef<MartialArtSummary | null>(null);
  const pending = ref(false);
  const error = shallowRef<Error | null>(null);

  const martialArtId = computed(() => {
    const value = Number(toValue(id));
    return Number.isFinite(value) ? value : null;
  });

  async function loadEnums() {
    enumsPromise ||= queryRows<EnumRow>("SELECT type, id, label FROM enums ORDER BY type, id")
      .then((rows) => enumMapFromRows(rows));
    return enumsPromise;
  }

  async function load() {
    const value = martialArtId.value;
    if (value === null) return null;

    if (summaryCache.has(value)) {
      summary.value = summaryCache.get(value) || null;
      return summary.value;
    }

    pending.value = true;
    error.value = null;
    try {
      const [martialArts, styles, effects, levels, enums] = await Promise.all([
        queryRows<MartialArtSummaryRow>(
          `SELECT id, sect_id, type_id, rarity_id, power, cost, obtain_method, is_sect_restricted,
            passive_1_id, passive_1_value, passive_2_id, passive_2_value, passive_3_id, passive_3_value
           FROM martial_arts
           WHERE id = ?`,
          [value],
        ),
        queryRows<MartialArtStyleRow>(
          "SELECT martial_art_id, slot, style_id FROM martial_art_styles WHERE martial_art_id = ? ORDER BY slot",
          [value],
        ),
        queryRows<MartialArtEffectRow>(
          "SELECT martial_art_id, slot, effect_id, level FROM martial_art_effects WHERE martial_art_id = ? ORDER BY slot",
          [value],
        ),
        queryRows<MartialArtLevelRow>(
          "SELECT martial_art_id, level, hp, qi_recovery FROM martial_art_levels WHERE martial_art_id = ? ORDER BY level",
          [value],
        ),
        loadEnums(),
      ]);

      const martialArt = martialArts[0] || null;
      const nextSummary = martialArt
        ? buildMartialArtSummary(martialArt, styles, effects, levels, enums)
        : null;
      summaryCache.set(value, nextSummary);
      summary.value = nextSummary;
      return nextSummary;
    } catch (caught) {
      error.value = caught instanceof Error ? caught : new Error(String(caught));
      return null;
    } finally {
      pending.value = false;
    }
  }

  watch(martialArtId, () => {
    const value = martialArtId.value;
    summary.value = value === null ? null : summaryCache.get(value) || null;
    error.value = null;
  });

  return { summary, pending, error, load };
}
