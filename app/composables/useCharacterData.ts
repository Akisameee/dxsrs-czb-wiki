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

export type CharacterDetailRow = CharacterSummaryRow & {
  portrait: string | null;
  sex_id: number;
  rank_id: number;
  position_id: number;
  level: number;
  favorite_rarity_id: number;
  fame: number;
  chivalry: number;
  gold: number;
  is_instructor: number;
  is_manager: number;
  growth_type_id: number;
  equipment_weapon: string | null;
  equipment_armor: string | null;
  equipment_other_weapon: string | null;
  strength: number;
  constitution: number;
  physique: number;
  agility: number;
  cultivation: number;
  fist: number;
  blade_sword: number;
  spear_staff: number;
  hidden_weapon: number;
  internal: number;
  mining: number;
  herb_gathering: number;
  hunting: number;
  forging: number;
  alchemy: number;
  sewing: number;
  likes_tea: number;
  likes_wine: number;
  likes_music: number;
  likes_chess: number;
  likes_book: number;
  likes_painting: number;
  word: string | null;
};

export type CharacterDetailData = {
  character: CharacterDetailRow | null;
  quests: CharacterQuestRow[];
  questTargets: CharacterQuestTargetRow[];
  enums: WikiEnums;
};

const summaryCache = new Map<number, CharacterSummary | null>();
const detailCache = new Map<number, CharacterDetailData>();
let enumsPromise: Promise<WikiEnums> | null = null;

export function useCharacterData() {
  const { queryRows } = useWikiDb();

  async function loadEnums() {
    enumsPromise ||= queryRows<EnumRow>("SELECT type, id, label FROM enums ORDER BY type, id")
      .then((rows) => enumMapFromRows(rows));
    return enumsPromise;
  }

  async function loadCharacter(id: number) {
    const rows = await queryRows<CharacterDetailRow>("SELECT * FROM characters WHERE id = ?", [id]);
    return rows[0] || null;
  }

  function loadCharacterQuests(id: number) {
    return queryRows<CharacterQuestRow>(
      "SELECT id, character_id, stage, required_affinity, quest_type_id, reward_item_id FROM character_quests WHERE character_id = ? ORDER BY stage",
      [id],
    );
  }

  function loadCharacterQuestTargets(id: number) {
    return queryRows<CharacterQuestTargetRow>(
      `SELECT t.quest_id, t.slot, t.target_role, t.target_kind, t.target_id, t.target_region_id
       FROM character_quest_targets t
       JOIN character_quests q ON q.id = t.quest_id
       WHERE q.character_id = ?
       ORDER BY t.quest_id, t.slot`,
      [id],
    );
  }

  async function loadCharacterDetail(id: number): Promise<CharacterDetailData> {
    if (detailCache.has(id)) return detailCache.get(id)!;

    const [character, quests, questTargets, enums] = await Promise.all([
      loadCharacter(id),
      loadCharacterQuests(id),
      loadCharacterQuestTargets(id),
      loadEnums(),
    ]);

    const detail = { character, quests, questTargets, enums };
    detailCache.set(id, detail);
    return detail;
  }

  async function loadCharacterSummary(id: number) {
    if (summaryCache.has(id)) return summaryCache.get(id) || null;

    const detail = await loadCharacterDetail(id);
    const nextSummary = detail.character
      ? buildCharacterSummary(detail.character, detail.quests, detail.questTargets, detail.enums)
      : null;
    summaryCache.set(id, nextSummary);
    return nextSummary;
  }

  return {
    loadEnums,
    loadCharacter,
    loadCharacterQuests,
    loadCharacterQuestTargets,
    loadCharacterDetail,
    loadCharacterSummary,
  };
}
