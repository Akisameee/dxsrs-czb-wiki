export type CharacterDefaultEquipmentCharacterRow = {
  equipment_weapon: string | null;
  equipment_armor: string | null;
  strength: number | null;
  constitution: number | null;
  physique: number | null;
  agility: number | null;
};

export type CharacterDefaultEquipmentRecipeRow = {
  item_id: number;
  template_name: string | null;
  rarity_id: number | null;
};

export type CharacterDefaultEquipmentIds = {
  rarityId: number;
  weaponItemId: number | null;
  armorItemId: number | null;
};

type CharacterDefaultEquipmentLookup = Map<string, number>;

export function createCharacterDefaultEquipmentResolver(rows: CharacterDefaultEquipmentRecipeRow[]) {
  const lookup = buildCharacterDefaultEquipmentLookup(rows);
  return (character: CharacterDefaultEquipmentCharacterRow) => resolveCharacterDefaultEquipmentIds(character, lookup);
}

export function buildCharacterDefaultEquipmentLookup(rows: CharacterDefaultEquipmentRecipeRow[]) {
  const lookup: CharacterDefaultEquipmentLookup = new Map();

  for (const row of rows) {
    if (!row.template_name) continue;
    lookup.set(characterDefaultEquipmentKey(row.template_name, row.rarity_id), row.item_id);
  }

  return lookup;
}

export function resolveCharacterDefaultEquipmentIds(
  character: CharacterDefaultEquipmentCharacterRow,
  lookup: CharacterDefaultEquipmentLookup,
): CharacterDefaultEquipmentIds {
  const rarityId = characterDefaultEquipmentRarityId(character);

  return {
    rarityId,
    weaponItemId: character.equipment_weapon
      ? lookup.get(characterDefaultEquipmentKey(character.equipment_weapon, rarityId)) ?? null
      : null,
    armorItemId: character.equipment_armor
      ? lookup.get(characterDefaultEquipmentKey(character.equipment_armor, rarityId)) ?? null
      : null,
  };
}

export function characterDefaultEquipmentRarityId(character: CharacterDefaultEquipmentCharacterRow) {
  const total =
    safeNumber(character.strength)
    + safeNumber(character.constitution)
    + safeNumber(character.physique)
    + safeNumber(character.agility);

  if (total < 1600) return 0;
  if (total < 2200) return 1;
  if (total < 2800) return 2;
  if (total < 3400) return 3;
  return 4;
}

function characterDefaultEquipmentKey(name: string, rarityId: number | null | undefined) {
  return `${name}\u0000${safeNumber(rarityId)}`;
}

function safeNumber(value: number | null | undefined) {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}
