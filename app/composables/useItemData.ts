import {
  buildItemRecipeUnlockSummaries,
  buildItemRecipeSummary,
  buildItemSummary,
  type ItemInventoryRecipeRow,
  type ItemRecipeRow,
  type ItemRecipeSummary,
  type ItemRecipeUnlockRow,
  type ItemSummary,
  type ItemSummaryRow,
  type WikiEnums,
} from "~/lib/wiki/item";

export type ItemDetailData = {
  item: ItemSummaryRow | null;
  summary: ItemSummary | null;
  recipe: ItemRecipeSummary | null;
  enums: WikiEnums;
};

export type ItemFindQuery =
  | { id: number }
  | { name: string }
  | { legacyName: string };

const summaryCache = new Map<number, ItemSummary | null>();
const detailCache = new Map<number, ItemDetailData>();
const itemFindCache = new Map<string, ItemSummaryRow | null>();
const inventoryItemFindCache = new Map<string, ItemInventoryRecipeRow | null>();

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

  async function loadItemRecipe(id: number) {
    const rows = await queryRows<ItemRecipeRow>(
      `SELECT recipe.id, recipe.item_id, recipe.recipe_name, recipe.product_name,
        recipe.type_id, recipe.quantity, recipe.rarity_id,
        recipe.material_1_name, recipe.material_1_item_id, recipe.material_1_quantity,
        recipe.material_2_name, recipe.material_2_item_id, recipe.material_2_quantity,
        recipe.material_3_name, recipe.material_3_item_id, recipe.material_3_quantity,
        recipe.length_min, recipe.length_max, recipe.weight_min, recipe.weight_max,
        recipe.att_min, recipe.att_max, recipe.def_min, recipe.def_max, recipe.hp_min, recipe.hp_max,
        recipe.main_attribute_min, recipe.main_attribute_max,
        recipe.bonus_count_min, recipe.bonus_count_max, recipe.bonus_value_min, recipe.bonus_value_max,
        recipe.fixed_strength, recipe.fixed_constitution, recipe.fixed_physique, recipe.fixed_agility,
        recipe.is_learned, recipe.required_level, recipe.is_basic,
        unlock_item.name AS unlock_item_name,
        unlock.unlock_item_id AS unlock_item_id,
        recipe.is_basic_material, recipe.can_buy
       FROM item_recipes recipe
       LEFT JOIN item_recipe_unlocks unlock ON unlock.recipe_id = recipe.id AND unlock.product_item_id = recipe.item_id
       LEFT JOIN items unlock_item ON unlock_item.id = unlock.unlock_item_id
       WHERE recipe.item_id = ?
       ORDER BY recipe.id
       LIMIT 1`,
      [id],
    );
    return rows[0] || null;
  }

  async function loadItemRecipeUnlocks(id: number) {
    const rows = await queryRows<ItemRecipeUnlockRow>(
      `SELECT unlock.unlock_item_id, unlock.recipe_id, unlock.product_item_id,
        product.name AS product_name
       FROM item_recipe_unlocks unlock
       INNER JOIN items product ON product.id = unlock.product_item_id
       WHERE unlock.unlock_item_id = ?
       ORDER BY unlock.recipe_id, unlock.product_item_id`,
      [id],
    );
    return rows;
  }

  async function findItem(query: ItemFindQuery) {
    if ("id" in query) return Number.isFinite(query.id) ? loadItem(query.id) : null;

    const queryInfo = itemFindQueryInfo(query);
    if (!queryInfo) return null;

    const cacheKey = `${queryInfo.field}:${queryInfo.value}`;
    if (itemFindCache.has(cacheKey)) return itemFindCache.get(cacheKey) || null;

    const rows = await queryRows<ItemSummaryRow>(
      `SELECT id, name, image_id, description, type_id, rarity_id, use_type_id, use_text, use_value,
        use_value2, use_value3, cost, required_strength, required_constitution,
        required_physique, required_agility, required_cultivation, required_mastery, is_material
       FROM items
       WHERE ${queryInfo.field} = ?
       LIMIT 1`,
      [queryInfo.value],
    );
    const item = rows[0] || null;
    itemFindCache.set(cacheKey, item);
    return item;
  }

  async function findInventoryItemSource(query: ItemFindQuery) {
    const queryInfo = itemFindQueryInfo(query);
    if (!queryInfo) return null;

    const cacheKey = `${queryInfo.field}:${queryInfo.value}`;
    if (inventoryItemFindCache.has(cacheKey)) return inventoryItemFindCache.get(cacheKey) || null;

    const rows = await queryRows<ItemInventoryRecipeRow>(
      `SELECT item.id, item.name, item.legacy_name, item.image_id,
        item.type_id, item.rarity_id, item.is_material,
        template.template_name, template.showname,
        template.att AS template_att, template.def AS template_def, template.hp AS template_hp,
        template.weight AS template_weight, template.length AS template_length,
        template.zhushuxing AS template_zhushuxing,
        template.lvli, template.gengu, template.tipo, template.shenfa,
        template.showlv, template.hidelv, template.mingkecitiao, template.mingke_fg,
        template.mingke_lvli, template.mingke_gengu, template.mingke_tipo, template.mingke_shenfa,
        recipe.item_id AS recipe_item_id,
        recipe.quantity AS recipe_quantity,
        recipe.length_min, recipe.length_max, recipe.weight_min, recipe.weight_max,
        recipe.att_min, recipe.att_max, recipe.def_min, recipe.def_max, recipe.hp_min, recipe.hp_max,
        recipe.main_attribute_min, recipe.main_attribute_max,
        recipe.bonus_value_min, recipe.bonus_value_max,
        recipe.fixed_strength, recipe.fixed_constitution, recipe.fixed_physique, recipe.fixed_agility
       FROM items item
       LEFT JOIN item_inventory_templates template ON template.item_id = item.id
       LEFT JOIN item_recipes recipe ON recipe.item_id = item.id
       WHERE item.${queryInfo.field} = ?
       LIMIT 1`,
      [queryInfo.value],
    );
    const item = rows[0] || null;
    inventoryItemFindCache.set(cacheKey, item);
    return item;
  }

  async function loadItemDetail(id: number): Promise<ItemDetailData> {
    if (detailCache.has(id)) return detailCache.get(id)!;

    const [item, recipe, recipeUnlockRows, enums] = await Promise.all([
      loadItem(id),
      loadItemRecipe(id),
      loadItemRecipeUnlocks(id),
      loadWikiEnums(),
    ]);
    const recipeUnlocks = buildItemRecipeUnlockSummaries(recipeUnlockRows);
    const summary = item ? await buildItemSummary(item, enums, recipeUnlocks) : null;
    const recipeSummary = recipe ? buildItemRecipeSummary(recipe, enums) : null;
    const detail = { item, summary, recipe: recipeSummary, enums };
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
    findInventoryItemSource,
    loadItemDetail,
    loadItemSummary,
    loadItemRecipe,
    loadItemRecipeUnlocks,
  };
}

function itemFindQueryInfo(query: ItemFindQuery) {
  if ("id" in query) return Number.isFinite(query.id) ? { field: "id", value: query.id } : null;

  const field = "legacyName" in query ? "legacy_name" : "name";
  const value = ("legacyName" in query ? query.legacyName : query.name).trim();
  return value ? { field, value } : null;
}
