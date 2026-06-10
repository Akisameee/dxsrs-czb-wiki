import type { MaybeRefOrGetter } from "vue";
import { computed, ref, shallowRef, toValue, watch } from "vue";
import { enumMapFromRows } from "~/lib/utils";
import {
  buildCharacterSummary,
  type CharacterQuestRow,
  type CharacterQuestTargetRow,
  type CharacterSummary,
  type CharacterSummaryRow,
  type WikiEnums,
} from "~/lib/wiki/character";

type EnumRow = { type: string; id: number; label: string | null };

const summaryCache = new Map<number, CharacterSummary | null>();
let enumsPromise: Promise<WikiEnums> | null = null;

export function useCharacterSummary(id: MaybeRefOrGetter<number | string | null | undefined>) {
  const { queryRows } = useWikiDb();
  const summary = shallowRef<CharacterSummary | null>(null);
  const pending = ref(false);
  const error = shallowRef<Error | null>(null);

  const characterId = computed(() => {
    const value = Number(toValue(id));
    return Number.isFinite(value) ? value : null;
  });

  async function loadEnums() {
    enumsPromise ||= queryRows<EnumRow>("SELECT type, id, label FROM enums ORDER BY type, id")
      .then((rows) => enumMapFromRows(rows));
    return enumsPromise;
  }

  async function load() {
    const value = characterId.value;
    if (value === null) return null;

    if (summaryCache.has(value)) {
      summary.value = summaryCache.get(value) || null;
      return summary.value;
    }

    pending.value = true;
    error.value = null;
    try {
      const [characters, quests, questTargets, enums] = await Promise.all([
        queryRows<CharacterSummaryRow>(
          "SELECT id, region_id, location_id, sect_id, rarity_id, weapon_type_id FROM characters WHERE id = ?",
          [value],
        ),
        queryRows<CharacterQuestRow>(
          "SELECT id, character_id, stage, required_affinity, quest_type_id, reward_item_id FROM character_quests WHERE character_id = ? ORDER BY stage",
          [value],
        ),
        queryRows<CharacterQuestTargetRow>(
          `SELECT t.quest_id, t.slot, t.target_role, t.target_kind, t.target_id, t.target_region_id
           FROM character_quest_targets t
           JOIN character_quests q ON q.id = t.quest_id
           WHERE q.character_id = ?
           ORDER BY t.quest_id, t.slot`,
          [value],
        ),
        loadEnums(),
      ]);

      const character = characters[0] || null;
      const nextSummary = character
        ? buildCharacterSummary(character, quests, questTargets, enums)
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

  watch(characterId, () => {
    const value = characterId.value;
    summary.value = value === null ? null : summaryCache.get(value) || null;
    error.value = null;
  });

  return { summary, pending, error, load };
}
