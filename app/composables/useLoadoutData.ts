import { enumLabel, enumMapFromRows } from "~/lib/utils";
import type {
  LoadoutChainGroup,
  LoadoutData,
  LoadoutMartialArt,
  LoadoutPassiveChainRecord,
} from "~/lib/loadout/types";
import {
  martialArtName,
  martialArtPassiveChainDescription,
  martialArtPassiveTemplateMap,
  martialArtRarityToneId,
  martialArtSectLabel,
  martialArtStyleLabel,
  martialArtTypeLabel,
  type MartialArtPassiveChainRow,
  type MartialArtPassiveTemplateRow,
  type MartialArtStyleRow,
  type MartialArtSummaryRow,
  type WikiEnums,
} from "~/lib/wiki/martial-art";

type EnumRow = { type: string; id: number; label: string | null };

export type { LoadoutChainGroup, LoadoutData, LoadoutMartialArt } from "~/lib/loadout/types";

function numberValue(value: number | string | null | undefined) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function groupChainRows(rows: MartialArtPassiveChainRow[], templates: Record<string, string>) {
  const sectGroups = new Map<number, LoadoutPassiveChainRecord[]>();
  const styleGroups = new Map<number, LoadoutPassiveChainRecord[]>();

  for (const row of rows) {
    const id = numberValue(row.id);
    const count = numberValue(row.count);
    if (id === null || count === null) continue;

    const effect = martialArtPassiveChainDescription(row, templates);
    const target = row.passive_type === "sect" ? sectGroups : styleGroups;
    target.set(id, [...(target.get(id) || []), { count, effect }]);
  }

  const sortChains = (chains: LoadoutPassiveChainRecord[]) => chains.sort((a, b) => a.count - b.count);

  return {
    sectChains: [...sectGroups.entries()]
      .map(([sectId, chains]) => ({ sectId, chains: sortChains(chains) }))
      .sort((a, b) => a.sectId - b.sectId),
    styleChains: [...styleGroups.entries()]
      .map(([styleId, chains]) => ({ styleId, chains: sortChains(chains) }))
      .sort((a, b) => a.styleId - b.styleId),
  };
}

function legacyChainGroups(
  sectRows: Array<{ sect_id: number; count: number; effect: string }>,
  styleRows: Array<{ style_id: number; count: number; effect: string }>,
) {
  const collect = <T extends { count: number; effect: string }>(
    rows: T[],
    idKey: keyof T,
    outputKey: "sectId" | "styleId",
  ) => {
    const groups = new Map<number, LoadoutPassiveChainRecord[]>();
    for (const row of rows) {
      const id = numberValue(row[idKey] as number);
      const count = numberValue(row.count);
      if (id === null || count === null) continue;
      groups.set(id, [...(groups.get(id) || []), { count, effect: row.effect || "" }]);
    }
    return [...groups.entries()]
      .map(([id, chains]) => ({
        [outputKey]: id,
        chains: chains.sort((a, b) => a.count - b.count),
      }))
      .sort((a, b) => Number(a[outputKey]) - Number(b[outputKey]));
  };

  return {
    sectChains: collect(sectRows, "sect_id", "sectId"),
    styleChains: collect(styleRows, "style_id", "styleId"),
  };
}

export function useLoadoutData() {
  const { queryRows } = useWikiDb();

  async function optionalRows<T>(sql: string) {
    try {
      return await queryRows<T>(sql);
    } catch {
      return null;
    }
  }

  return useAsyncData("loadout-data", async (): Promise<LoadoutData> => {
    const [
      martialArts,
      styles,
      enumRows,
      templateRows,
    ] = await Promise.all([
      queryRows<MartialArtSummaryRow>(
        `SELECT id, sect_id, type_id, rarity_id, power, cost, obtain_method, is_sect_restricted
         FROM martial_arts
         ORDER BY id`,
      ),
      queryRows<MartialArtStyleRow>(
        "SELECT martial_art_id, slot, style_id FROM martial_art_styles ORDER BY martial_art_id, slot",
      ),
      queryRows<EnumRow>("SELECT type, id, label FROM enums ORDER BY type, id"),
      queryRows<MartialArtPassiveTemplateRow>("SELECT id, template FROM martial_art_passive_templates"),
    ]);

    const enums = enumMapFromRows(enumRows);
    const templates = martialArtPassiveTemplateMap(templateRows);
    const stylesByMartialArt = new Map<number, MartialArtStyleRow[]>();
    for (const row of styles) {
      const rows = stylesByMartialArt.get(row.martial_art_id) || [];
      rows.push(row);
      stylesByMartialArt.set(row.martial_art_id, rows);
    }

    const passiveChains = await optionalRows<MartialArtPassiveChainRow>(
      "SELECT id, passive_type, count, value FROM passive_chains ORDER BY passive_type, id, count",
    );

    const chainGroups = passiveChains
      ? groupChainRows(passiveChains, templates)
      : legacyChainGroups(
        await queryRows("SELECT sect_id, count, effect FROM sect_chains ORDER BY sect_id, count"),
        await queryRows("SELECT style_id, count, effect FROM style_chains ORDER BY style_id, count"),
      );

    return {
      enums,
      ...chainGroups,
      wuxue: martialArts.map((item) => {
        const itemStyles = stylesByMartialArt.get(item.id) || [];
        const typeId = numberValue(item.type_id);
        const sectId = numberValue(item.sect_id);
        const rarity = numberValue(item.rarity_id);
        return {
          id: item.id,
          name: martialArtName(item, enums),
          initial: martialArtName(item, enums).slice(0, 1),
          sectId,
          sect: martialArtSectLabel(item, enums),
          styleIds: itemStyles.map((row) => row.style_id),
          styles: itemStyles.map((row) => martialArtStyleLabel(row, enums)),
          typeId,
          type: martialArtTypeLabel(item, enums),
          rare: rarity,
          rarityToneId: martialArtRarityToneId(rarity),
          power: numberValue(item.power),
          cost: numberValue(item.cost),
          obtainMethod: item.obtain_method,
          sectRestricted: Boolean(Number(item.is_sect_restricted)),
        };
      }),
    };
  }, { server: false });
}

export function loadoutEnumLabel(enums: WikiEnums, type: string, id: number | string | null | undefined, fallback = "未知") {
  return enumLabel(enums, type, id, fallback);
}
