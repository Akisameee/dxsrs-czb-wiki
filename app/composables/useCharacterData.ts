import {
  buildCharacterSummary,
  buildInvitationRequirementSummaries,
  type CharacterInvitationRequirementRow,
  type CharacterInvitationRequirementSummary,
  type CharacterQuestRow,
  type CharacterQuestTargetRow,
  type CharacterSummary,
  type CharacterSummaryRow,
  type WikiEnums,
} from "~/lib/wiki/character";
import {
  createCharacterDefaultEquipmentResolver,
  type CharacterDefaultEquipmentIds,
  type CharacterDefaultEquipmentRecipeRow,
} from "~/lib/wiki/character-equipment";

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
  defaultEquipment: CharacterDefaultEquipmentIds | null;
  quests: CharacterQuestRow[];
  questTargets: CharacterQuestTargetRow[];
  invitationRequirements: CharacterInvitationRequirementRow[];
  invitationRequirementSummaries: CharacterInvitationRequirementSummary[];
  enums: WikiEnums;
};

export type CharacterFindQuery =
  | { id: number }
  | { name: string }
  | { legacyName: string };

const summaryCache = new Map<number, CharacterSummary | null>();
const detailCache = new Map<number, CharacterDetailData>();
const characterFindCache = new Map<string, CharacterDetailRow | null>();
let defaultEquipmentResolverPromise: Promise<ReturnType<typeof createCharacterDefaultEquipmentResolver>> | null = null;

export function useCharacterData() {
  const { queryRows } = useWikiDb();
  const { loadWikiEnums } = useWikiEnums();

  async function loadCharacter(id: number) {
    const rows = await queryRows<CharacterDetailRow>(
      `SELECT c.*, s.name AS sect_name
       FROM characters c
       LEFT JOIN sects s ON s.id = c.sect_id
       WHERE c.id = ?`,
      [id],
    );
    return rows[0] || null;
  }

  async function findCharacter(query: CharacterFindQuery) {
    if ("id" in query) return loadCharacter(query.id);

    const field = "legacyName" in query ? "legacy_name" : "name";
    const value = ("legacyName" in query ? query.legacyName : query.name).trim();
    if (!value) return null;

    const cacheKey = `${field}:${value}`;
    if (characterFindCache.has(cacheKey)) return characterFindCache.get(cacheKey) || null;

    const rows = await queryRows<CharacterDetailRow>(
      `SELECT c.*, s.name AS sect_name
       FROM characters c
       LEFT JOIN sects s ON s.id = c.sect_id
       WHERE c.${field} = ?
       LIMIT 1`,
      [value],
    );
    const character = rows[0] || null;
    characterFindCache.set(cacheKey, character);
    return character;
  }

  function loadCharacterQuests(id: number) {
    return queryRows<CharacterQuestRow>(
      `SELECT q.id, q.character_id, q.stage, q.required_affinity, q.quest_type_id,
        q.reward_item_id, item.name AS reward_item_name
       FROM character_quests q
       LEFT JOIN items item ON item.id = q.reward_item_id
       WHERE q.character_id = ?
       ORDER BY q.stage`,
      [id],
    );
  }

  function loadCharacterQuestTargets(id: number) {
    return queryRows<CharacterQuestTargetRow>(
      `SELECT t.quest_id, t.slot, t.target_role, t.target_kind, t.target_id, t.target_region_id,
        COALESCE(character.name, item.name, sect.name) AS target_name
       FROM character_quest_targets t
       JOIN character_quests q ON q.id = t.quest_id
       LEFT JOIN characters character ON t.target_kind = 'character' AND character.id = t.target_id
       LEFT JOIN items item ON t.target_kind = 'item' AND item.id = t.target_id
       LEFT JOIN sects sect ON t.target_kind = 'sect' AND sect.id = t.target_id
       WHERE q.character_id = ?
       ORDER BY t.quest_id, t.slot`,
      [id],
    );
  }

  function loadCharacterInvitationRequirements(id: number) {
    return queryRows<CharacterInvitationRequirementRow>(
      `SELECT r.character_id, r.slot, r.legacy_name, r.type_id, r.int_value, r.string_value
       FROM character_invitation_requirements r
       WHERE r.character_id = ?
       ORDER BY r.slot`,
      [id],
    );
  }

  function loadCharacterDefaultEquipmentResolver() {
    defaultEquipmentResolverPromise ||= queryRows<CharacterDefaultEquipmentRecipeRow>(
      `SELECT item_id, template_name, rarity_id
       FROM item_recipes
       WHERE template_name IS NOT NULL
       ORDER BY template_name, rarity_id, item_id`,
    ).then((rows) => createCharacterDefaultEquipmentResolver(rows));
    return defaultEquipmentResolverPromise;
  }

  async function loadCharacterDetail(id: number): Promise<CharacterDetailData> {
    if (detailCache.has(id)) return detailCache.get(id)!;

    const [character, quests, questTargets, invitationRequirements, enums, defaultEquipmentResolver] = await Promise.all([
      loadCharacter(id),
      loadCharacterQuests(id),
      loadCharacterQuestTargets(id),
      loadCharacterInvitationRequirements(id),
      loadWikiEnums(),
      loadCharacterDefaultEquipmentResolver(),
    ]);

    const invitationRequirementSummaries = await buildInvitationRequirementSummaries(invitationRequirements, enums);
    const defaultEquipment = character ? defaultEquipmentResolver(character) : null;
    const detail = {
      character,
      defaultEquipment,
      quests,
      questTargets,
      invitationRequirements,
      invitationRequirementSummaries,
      enums,
    };
    detailCache.set(id, detail);
    return detail;
  }

  async function loadCharacterSummary(id: number) {
    if (summaryCache.has(id)) return summaryCache.get(id) || null;

    const detail = await loadCharacterDetail(id);
    const nextSummary = detail.character
      ? await buildCharacterSummary(
          detail.character,
          detail.quests,
          detail.questTargets,
          detail.invitationRequirements,
          detail.enums,
        )
      : null;
    summaryCache.set(id, nextSummary);
    return nextSummary;
  }

  return {
    loadCharacter,
    findCharacter,
    loadCharacterQuests,
    loadCharacterQuestTargets,
    loadCharacterInvitationRequirements,
    loadCharacterDetail,
    loadCharacterSummary,
  };
}
