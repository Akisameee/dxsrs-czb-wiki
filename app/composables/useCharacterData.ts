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
} from "~/lib/wiki/character/equipment";
import {
  characterYearlyPurchaseRarityId,
  characterYearlyPurchaseTypeIds,
  resolveCharacterYearlyPurchaseItemIds,
  type CharacterYearlyPurchaseItemRow as CharacterYearlyPurchaseSourceItemRow,
} from "~/lib/wiki/character/yearly-purchases";

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
  martial_type_id: number;
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
  defaultEquipmentItems: {
    weapon: CharacterItemRow | null;
    armor: CharacterItemRow | null;
  };
  shopItems: CharacterShopItemRow[];
  martialArts: CharacterMartialArtRow[];
  martialArtPool: CharacterMartialArtPoolRow[];
  yearlyPurchaseItems: CharacterYearlyPurchaseItemRow[];
  inventoryPresets: CharacterInventoryPresetRow[];
  quests: CharacterQuestRow[];
  questTargets: CharacterQuestTargetRow[];
  invitationRequirements: CharacterInvitationRequirementRow[];
  invitationRequirementSummaries: CharacterInvitationRequirementSummary[];
  enums: WikiEnums;
};

export type CharacterItemRow = {
  id: number;
  name: string | null;
  legacy_name: string | null;
  image_id: string | null;
  type_id: number | null;
  rarity_id: number | null;
};

export type CharacterMartialArtRow = {
  slot: number;
  martial_art_id: number;
  current_level: number;
  max_level: number;
  current_exp: number;
  max_exp: number;
};

export type CharacterMartialArtPoolRow = {
  slot: number;
  martial_art_id: number;
};

export type CharacterInventoryPresetRow = {
  source_row_index: number;
  item_id: number;
  quantity: number;
  type_id: number | null;
  rarity_id: number | null;
  show_name: string | null;
  item_name: string | null;
  item_legacy_name: string | null;
  item_image_id: string | null;
};

export type CharacterYearlyPurchaseItemRow = {
  id: number;
  name: string | null;
  legacy_name: string | null;
  image_id: string | null;
  type_id: number | null;
  rarity_id: number | null;
  cost: number | null;
};

export type CharacterShopItemRow = {
  source_row_index: number;
  item_id: number;
  type_id: number | null;
  rarity_id: number | null;
  min_quantity: number | null;
  max_quantity: number | null;
  chance: number | null;
  item_name: string | null;
  item_legacy_name: string | null;
  item_image_id: string | null;
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

  function loadCharacterMartialArts(id: number) {
    return queryRows<CharacterMartialArtRow>(
      `SELECT cm.slot, cm.martial_art_id, cm.current_level, cm.max_level, cm.current_exp, cm.max_exp
       FROM character_martial_arts cm
       WHERE cm.character_id = ?
       ORDER BY cm.slot`,
      [id],
    );
  }

  function loadCharacterMartialArtPool(martialTypeId: number | null | undefined) {
    const typeId = Number(martialTypeId);
    if (!Number.isFinite(typeId)) {
      return Promise.resolve<CharacterMartialArtPoolRow[]>([]);
    }
    return queryRows<CharacterMartialArtPoolRow>(
      `SELECT pool_index - 1 AS slot, martial_art_id
       FROM npc_martial_art_pools
       WHERE martial_type_id = ?
       ORDER BY pool_index`,
      [typeId],
    );
  }

  function loadCharacterInventoryPresets(id: number) {
    return queryRows<CharacterInventoryPresetRow>(
      `SELECT preset.source_row_index, preset.item_id, preset.quantity, preset.type_id, preset.rarity_id,
        preset.show_name,
        item.name AS item_name, item.legacy_name AS item_legacy_name, item.image_id AS item_image_id
       FROM inventory_presets preset
       JOIN items item ON item.id = preset.item_id
       WHERE preset.character_id = ?
       ORDER BY preset.source_row_index`,
      [id],
    );
  }

  function loadCharacterShopItems(id: number) {
    return queryRows<CharacterShopItemRow>(
      `SELECT shop.source_row_index, shop.item_id, shop.type_id, shop.rarity_id,
        shop.min_quantity, shop.max_quantity, shop.chance,
        item.name AS item_name, item.legacy_name AS item_legacy_name, item.image_id AS item_image_id
       FROM shop
       JOIN items item ON item.id = shop.item_id
       WHERE shop.character_id = ?
       ORDER BY shop.source_row_index`,
      [id],
    );
  }

  async function loadCharacterItems(ids: Array<number | null | undefined>) {
    const uniqueIds = [...new Set(
      ids.filter((id): id is number => Number.isFinite(id)),
    )];
    if (!uniqueIds.length) return [];

    const placeholders = uniqueIds.map(() => "?").join(", ");
    return queryRows<CharacterItemRow>(
      `SELECT id, name, legacy_name, image_id, type_id, rarity_id
       FROM items
       WHERE id IN (${placeholders})`,
      uniqueIds,
    );
  }

  async function loadCharacterYearlyPurchaseItems(character: CharacterDetailRow | null) {
    if (!character) return [];

    const typeIds = characterYearlyPurchaseTypeIds(character);
    const rarityId = characterYearlyPurchaseRarityId(character);
    if (!typeIds.length || rarityId === null) return [];

    const placeholders = typeIds.map(() => "?").join(", ");
    const items = await queryRows<CharacterYearlyPurchaseItemRow>(
      `SELECT id, name, legacy_name, image_id, type_id, rarity_id, cost
       FROM items
       WHERE type_id IN (${placeholders}) AND rarity_id = ?
       ORDER BY type_id, id`,
      [...typeIds, rarityId],
    );
    const itemIds = new Set(resolveCharacterYearlyPurchaseItemIds(
      character,
      items as CharacterYearlyPurchaseSourceItemRow[],
    ));
    return items.filter((item) => itemIds.has(item.id));
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

    const [character, quests, questTargets, invitationRequirements, martialArts, inventoryPresets, shopItems, enums, defaultEquipmentResolver] = await Promise.all([
      loadCharacter(id),
      loadCharacterQuests(id),
      loadCharacterQuestTargets(id),
      loadCharacterInvitationRequirements(id),
      loadCharacterMartialArts(id),
      loadCharacterInventoryPresets(id),
      loadCharacterShopItems(id),
      loadWikiEnums(),
      loadCharacterDefaultEquipmentResolver(),
    ]);
    const martialArtPool = await loadCharacterMartialArtPool(character?.martial_type_id);

    const invitationRequirementSummaries = await buildInvitationRequirementSummaries(invitationRequirements, enums);
    const yearlyPurchaseItems = await loadCharacterYearlyPurchaseItems(character);
    const defaultEquipment = character ? defaultEquipmentResolver(character) : null;
    const defaultEquipmentRows = await loadCharacterItems([
      defaultEquipment?.weaponItemId,
      defaultEquipment?.armorItemId,
    ]);
    const defaultEquipmentRowById = new Map(defaultEquipmentRows.map((row) => [row.id, row]));
    const defaultEquipmentItems = {
      weapon: defaultEquipment?.weaponItemId != null ? defaultEquipmentRowById.get(defaultEquipment.weaponItemId) || null : null,
      armor: defaultEquipment?.armorItemId != null ? defaultEquipmentRowById.get(defaultEquipment.armorItemId) || null : null,
    };
    const detail = {
      character,
      defaultEquipment,
      defaultEquipmentItems,
      shopItems,
      martialArts,
      martialArtPool,
      yearlyPurchaseItems,
      inventoryPresets,
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
    loadCharacterMartialArts,
    loadCharacterInventoryPresets,
    loadCharacterDetail,
    loadCharacterSummary,
  };
}
