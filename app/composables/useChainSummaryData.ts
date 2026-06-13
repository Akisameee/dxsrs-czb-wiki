import {
  martialArtPassiveChainDescription,
  martialArtPassiveChainDescriptionParts,
  type MartialArtPassiveChainRow,
} from "~/lib/wiki/martial-art";
import type { WikiTextPart } from "~/lib/wiki/text";

export type ChainSummaryBlock = {
  value: number;
  class: string;
  tooltip: string;
};

export type ChainSummaryDescription = {
  count: number;
  parts: WikiTextPart[];
};

export type BasicChainSummary = {
  label: string;
  typeLabel: string;
  icon?: string | null;
  blocks: ChainSummaryBlock[];
  descriptions: ChainSummaryDescription[];
};

export function useChainSummaryData() {
  const { queryRows } = useWikiDb();

  async function loadChainSummary(type: "sect" | "style", id: number | string, label: string): Promise<BasicChainSummary> {
    const chainRows = await queryRows<MartialArtPassiveChainRow>(
      `SELECT chain.id, chain.passive_type, chain.count, chain.passive_id,
        chain.param1, chain.param2, passive.template, passive.icon
       FROM passive_chains chain
       JOIN passives passive ON passive.id = chain.passive_id
       WHERE chain.passive_type = ? AND chain.id = ?
       ORDER BY chain.count`,
      [type, Number(id)],
    );
    const maxCount = Math.max(0, ...chainRows.map((row) => Number(row.count) || 0));
    const rowsByCount = new Map(chainRows.map((row) => [Number(row.count), row]));

    return {
      label,
      typeLabel: type === "sect" ? "门派" : "风格",
      icon: chainRows.find((row) => row.icon)?.icon || null,
      descriptions: chainRows
        .map((row) => ({
          count: Number(row.count) || 0,
          parts: martialArtPassiveChainDescriptionParts(row),
        }))
        .filter((description) => description.parts.length),
      blocks: Array.from({ length: maxCount }, (_, index) => {
        const value = index + 1;
        const row = rowsByCount.get(value);
        const effect = row ? martialArtPassiveChainDescription(row) : "";
        return {
          value,
          class: row ? "bg-muted ring-1 ring-border" : "bg-muted/60",
          tooltip: effect ? `${value}: ${effect}` : String(value),
        };
      }),
    };
  }

  return { loadChainSummary };
}
