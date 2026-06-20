export type CharacterYearlyPurchaseCharacterRow = {
  rank_id: number | null | undefined;
  likes_tea: number | null | undefined;
  likes_wine: number | null | undefined;
  likes_music: number | null | undefined;
  likes_chess: number | null | undefined;
  likes_book: number | null | undefined;
  likes_painting: number | null | undefined;
};

export type CharacterYearlyPurchaseItemRow = {
  id: number;
  type_id: number | null;
  rarity_id: number | null;
  cost: number | null;
};

const YEARLY_PURCHASE_TYPE_IDS = {
  music: 0,
  chess: 1,
  book: 2,
  painting: 3,
  tea: 4,
  wine: 5,
} as const;

export function characterYearlyPurchaseRarityId(character: CharacterYearlyPurchaseCharacterRow) {
  const rankId = Number(character.rank_id);
  if (!Number.isFinite(rankId)) return null;
  return Math.min(4, Math.max(0, Math.trunc(rankId)));
}

export function characterYearlyPurchaseTypeIds(character: CharacterYearlyPurchaseCharacterRow) {
  const ids: number[] = [];
  if (safeNumber(character.likes_music) > 0) ids.push(YEARLY_PURCHASE_TYPE_IDS.music);
  if (safeNumber(character.likes_chess) > 0) ids.push(YEARLY_PURCHASE_TYPE_IDS.chess);
  if (safeNumber(character.likes_book) > 0) ids.push(YEARLY_PURCHASE_TYPE_IDS.book);
  if (safeNumber(character.likes_painting) > 0) ids.push(YEARLY_PURCHASE_TYPE_IDS.painting);
  if (safeNumber(character.likes_tea) > 0) ids.push(YEARLY_PURCHASE_TYPE_IDS.tea);
  if (safeNumber(character.likes_wine) > 0) ids.push(YEARLY_PURCHASE_TYPE_IDS.wine);
  return ids;
}

export function resolveCharacterYearlyPurchaseItemIds(
  character: CharacterYearlyPurchaseCharacterRow,
  items: CharacterYearlyPurchaseItemRow[],
) {
  const typeIds = new Set(characterYearlyPurchaseTypeIds(character));
  const rarityId = characterYearlyPurchaseRarityId(character);

  if (!typeIds.size || rarityId === null) return [];

  return items
    .filter((item) =>
      item.type_id !== null
      && item.rarity_id === rarityId
      && typeIds.has(item.type_id))
    .map((item) => item.id);
}

function safeNumber(value: number | null | undefined) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}
