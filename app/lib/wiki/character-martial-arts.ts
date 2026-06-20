import type { WikiEnums } from "./character";
import {
  martialArtName,
  martialArtRarityToneId,
  martialArtSectLabel,
  martialArtStyleLabel,
  martialArtTypeLabel,
  type MartialArtStyleRow,
  type MartialArtSummaryRow,
} from "./martial-art";

export type CharacterMartialArtCard = {
  slot: number;
  currentLevel: number;
  maxLevel: number;
  currentExp: number;
  maxExp: number;
  id: number;
  name: string;
  type: string;
  typeId: number | null;
  rarityId: number | null;
  rarityToneId: number | null;
  sectId: number | null;
  sectLabel: string;
  styles: Array<{ id: number; label: string }>;
};

export type CharacterMartialArtSourceRow = {
  slot: number;
  martial_art_id: number;
  current_level?: number;
  max_level?: number;
  current_exp?: number;
  max_exp?: number;
};

type MartialArtDetailLike = {
  martialArt: MartialArtSummaryRow | null;
  styles: MartialArtStyleRow[];
};

function styleItems(rows: MartialArtStyleRow[], wikiEnums: WikiEnums) {
  const seen = new Set<number | string | null | undefined>();
  return rows
    .map((row) => ({
      id: row.style_id,
      label: martialArtStyleLabel(row, wikiEnums),
    }))
    .filter((row) => {
      if (!row.label || seen.has(row.id)) return false;
      seen.add(row.id);
      return true;
    });
}

export function buildCharacterMartialArtCard(
  row: CharacterMartialArtSourceRow,
  martialArt: MartialArtSummaryRow,
  styles: MartialArtStyleRow[],
  wikiEnums: WikiEnums,
): CharacterMartialArtCard {
  return {
    slot: row.slot,
    currentLevel: row.current_level ?? 0,
    maxLevel: row.max_level ?? 0,
    currentExp: row.current_exp ?? 0,
    maxExp: row.max_exp ?? 0,
    id: martialArt.id,
    name: martialArtName(martialArt),
    type: martialArtTypeLabel(martialArt, wikiEnums),
    typeId: martialArt.type_id,
    rarityId: martialArt.rarity_id,
    rarityToneId: martialArtRarityToneId(martialArt.rarity_id),
    sectId: martialArt.sect_id,
    sectLabel: martialArtSectLabel(martialArt),
    styles: styleItems(styles, wikiEnums),
  };
}

export async function loadCharacterMartialArtCards(
  rows: readonly CharacterMartialArtSourceRow[],
  wikiEnums: WikiEnums,
  loadMartialArtDetail: (id: number) => Promise<MartialArtDetailLike>,
) {
  const cards = await Promise.all(rows.map(async (row): Promise<CharacterMartialArtCard | null> => {
    const detail = await loadMartialArtDetail(row.martial_art_id);
    if (!detail.martialArt) return null;
    return buildCharacterMartialArtCard(row, detail.martialArt, detail.styles, wikiEnums);
  }));
  return cards.filter((row): row is CharacterMartialArtCard => Boolean(row));
}
