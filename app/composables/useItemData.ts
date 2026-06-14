import {
  buildItemSummary,
  type ItemSummary,
  type ItemSummaryRow,
  type WikiEnums,
} from "~/lib/wiki/item";

export type ItemDetailData = {
  item: ItemSummaryRow | null;
  summary: ItemSummary | null;
  enums: WikiEnums;
};

export type ItemFindQuery =
  | { id: number }
  | { name: string }
  | { legacyName: string };

const summaryCache = new Map<number, ItemSummary | null>();
const detailCache = new Map<number, ItemDetailData>();
const itemFindCache = new Map<string, ItemSummaryRow | null>();

export function useItemData() {
  const { queryRows } = useWikiDb();
  const { loadWikiEnums } = useWikiEnums();

  async function loadItem(id: number) {
    const rows = await queryRows<ItemSummaryRow>(
      `SELECT id, name, image_id, description, type_id, rarity_id, use_type_id, use_text, use_value,
        use_value2, use_value3, cost, required_strength, required_constitution,
        required_physique, required_agility, required_cultivation, required_mastery, is_material
       FROM items
       WHERE id = ?`,
      [id],
    );
    return rows[0] || null;
  }

  async function findItem(query: ItemFindQuery) {
    if ("id" in query) return loadItem(query.id);

    const field = "legacyName" in query ? "legacy_name" : "name";
    const value = ("legacyName" in query ? query.legacyName : query.name).trim();
    if (!value) return null;

    const cacheKey = `${field}:${value}`;
    if (itemFindCache.has(cacheKey)) return itemFindCache.get(cacheKey) || null;

    const rows = await queryRows<ItemSummaryRow>(
      `SELECT id, name, image_id, description, type_id, rarity_id, use_type_id, use_text, use_value,
        use_value2, use_value3, cost, required_strength, required_constitution,
        required_physique, required_agility, required_cultivation, required_mastery, is_material
       FROM items
       WHERE ${field} = ?
       LIMIT 1`,
      [value],
    );
    const item = rows[0] || null;
    itemFindCache.set(cacheKey, item);
    return item;
  }

  async function loadItemDetail(id: number): Promise<ItemDetailData> {
    if (detailCache.has(id)) return detailCache.get(id)!;

    const [item, enums] = await Promise.all([
      loadItem(id),
      loadWikiEnums(),
    ]);
    const summary = item ? await buildItemSummary(item, enums) : null;
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
    loadItem,
    findItem,
    loadItemDetail,
    loadItemSummary,
  };
}
