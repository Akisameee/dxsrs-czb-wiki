import { enumMapFromRows } from "~/lib/utils";
import {
  buildItemSummary,
  type ItemSummary,
  type ItemSummaryRow,
  type WikiEnums,
} from "~/lib/wiki/item";

type EnumRow = { type: string; id: number; label: string | null };

export type ItemDetailData = {
  item: ItemSummaryRow | null;
  summary: ItemSummary | null;
  enums: WikiEnums;
};

const summaryCache = new Map<number, ItemSummary | null>();
const detailCache = new Map<number, ItemDetailData>();
let enumsPromise: Promise<WikiEnums> | null = null;

export function useItemData() {
  const { queryRows } = useWikiDb();

  async function loadEnums() {
    enumsPromise ||= queryRows<EnumRow>("SELECT type, id, label FROM enums ORDER BY type, id")
      .then((rows) => enumMapFromRows(rows));
    return enumsPromise;
  }

  async function loadItem(id: number) {
    const rows = await queryRows<ItemSummaryRow>(
      `SELECT id, icon, description, type_id, rarity_id, use_type_id, use_text, use_value,
        use_value2, use_value3, cost, required_strength, required_constitution,
        required_physique, required_agility, required_cultivation, required_mastery, is_material
       FROM items
       WHERE id = ?`,
      [id],
    );
    return rows[0] || null;
  }

  async function loadItemDetail(id: number): Promise<ItemDetailData> {
    if (detailCache.has(id)) return detailCache.get(id)!;

    const [item, enums] = await Promise.all([
      loadItem(id),
      loadEnums(),
    ]);
    const summary = item ? buildItemSummary(item, enums) : null;
    const detail = { item, summary, enums };
    detailCache.set(id, detail);
    if (!summaryCache.has(id)) summaryCache.set(id, summary);
    return detail;
  }

  async function loadItemSummary(id: number) {
    if (summaryCache.has(id)) return summaryCache.get(id) || null;
    return (await loadItemDetail(id)).summary;
  }

  return {
    loadEnums,
    loadItem,
    loadItemDetail,
    loadItemSummary,
  };
}
