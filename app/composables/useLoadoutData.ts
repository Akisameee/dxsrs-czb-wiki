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
  martialArtPassiveChainDescriptionParts,
  martialArtRarityToneId,
  martialArtSectLabel,
  martialArtStyleLabel,
  martialArtTypeLabel,
  type MartialArtPassiveChainRow,
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

function groupChainRows(rows: MartialArtPassiveChainRow[]) {
  const sectGroups = new Map<number, LoadoutPassiveChainRecord[]>();
  const styleGroups = new Map<number, LoadoutPassiveChainRecord[]>();

  for (const row of rows) {
    const id = numberValue(row.id);
    const count = numberValue(row.count);
    if (id === null || count === null) continue;

    const effect = martialArtPassiveChainDescription(row);
    const effectParts = martialArtPassiveChainDescriptionParts(row);
    const target = row.passive_type === "sect" ? sectGroups : styleGroups;
    target.set(id, [...(target.get(id) || []), {
      count,
      effect,
      effectParts,
      imageId: row.image_id || null,
    }]);
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
      groups.set(id, [...(groups.get(id) || []), {
        count,
        effect: row.effect || "",
        effectParts: [{ type: "text", text: row.effect || "" }],
      }]);
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
      sectRows,
      enumRows,
    ] = await Promise.all([
      queryRows<MartialArtSummaryRow>(
        `SELECT art.id, art.name, art.sect_id, sect.name AS sect_name, art.type_id,
          art.rarity_id, art.power, art.cost, art.obtain_method, art.is_sect_restricted
         FROM martial_arts art
         LEFT JOIN sects sect ON sect.id = art.sect_id
         ORDER BY art.id`,
      ),
      queryRows<MartialArtStyleRow>(
        "SELECT martial_art_id, slot, style_id FROM martial_art_styles ORDER BY martial_art_id, slot",
      ),
      queryRows<{ id: number; name: string | null }>("SELECT id, name FROM sects ORDER BY id"),
      queryRows<EnumRow>("SELECT type, id, label FROM enums ORDER BY type, id"),
    ]);

    const enums = enumMapFromRows(enumRows);
    const sectNames = Object.fromEntries(sectRows.map((row) => [String(row.id), row.name]));
    const stylesByMartialArt = new Map<number, MartialArtStyleRow[]>();
    for (const row of styles) {
      const rows = stylesByMartialArt.get(row.martial_art_id) || [];
      rows.push(row);
      stylesByMartialArt.set(row.martial_art_id, rows);
    }

    const passiveChains = await optionalRows<MartialArtPassiveChainRow>(
      `SELECT chain.id, chain.passive_type, chain.count, chain.passive_id,
        chain.param1, chain.param2, passive.template, passive.image_id
       FROM passive_chains chain
       JOIN passives passive ON passive.id = chain.passive_id
       ORDER BY chain.passive_type, chain.id, chain.count`,
    );

    const chainGroups = passiveChains
      ? groupChainRows(passiveChains)
      : legacyChainGroups(
        await queryRows("SELECT sect_id, count, effect FROM sect_chains ORDER BY sect_id, count"),
        await queryRows("SELECT style_id, count, effect FROM style_chains ORDER BY style_id, count"),
      );

    return {
      enums,
      sectNames,
      ...chainGroups,
      wuxue: martialArts.map((item) => {
        const itemStyles = stylesByMartialArt.get(item.id) || [];
        const typeId = numberValue(item.type_id);
        const sectId = numberValue(item.sect_id);
        const rarity = numberValue(item.rarity_id);
        return {
          id: item.id,
          name: martialArtName(item),
          initial: martialArtName(item).slice(0, 1),
          sectId,
          sect: martialArtSectLabel(item),
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

export function loadoutSectLabel(
  sectNames: Record<string, string | null>,
  id: number | string | null | undefined,
  fallback = "未知",
) {
  if (id === null || id === undefined || id === "") return fallback;
  return sectNames[String(id)] || fallback;
}
