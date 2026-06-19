export type SaveEditXingNangRow = Record<string, string>;

export type SaveEditXingNangRecipeInput = {
  name: string | null;
  legacy_name: string | null;
  type_id: number | null;
  rarity_id: number | null;
  template_name: string | null;
  showname: string | null;
  template_att: number | null;
  template_def: number | null;
  template_hp: number | null;
  template_weight: number | null;
  template_length: number | null;
  template_zhushuxing: number | null;
  lvli: number | null;
  gengu: number | null;
  tipo: number | null;
  shenfa: number | null;
  showlv: number | null;
  hidelv: number | null;
  mingkecitiao: string | null;
  mingke_fg: number | null;
  mingke_lvli: number | null;
  mingke_gengu: number | null;
  mingke_tipo: number | null;
  mingke_shenfa: number | null;
  recipe_item_id: number | null;
  recipe_quantity: number | null;
  length_min: number | null;
  length_max: number | null;
  weight_min: number | null;
  weight_max: number | null;
  att_min: number | null;
  att_max: number | null;
  def_min: number | null;
  def_max: number | null;
  hp_min: number | null;
  hp_max: number | null;
  main_attribute_min: number | null;
  main_attribute_max: number | null;
  bonus_value_min: number | null;
  bonus_value_max: number | null;
  fixed_strength: number | null;
  fixed_constitution: number | null;
  fixed_physique: number | null;
  fixed_agility: number | null;
};

export type SaveEditInventoryRecipeRepository<TQuery, TRow extends SaveEditXingNangRecipeInput = SaveEditXingNangRecipeInput> = {
  findInventoryItem: (query: TQuery) => Promise<TRow | null>;
};

export type CreateXingNangRowOptions = {
  owner?: string;
  quantity?: number;
  uid?: string;
};

const equipmentTypeIds = new Set([9, 10, 11, 12, 13, 14, 15]);
let inventoryUidSequence = 0;
let inventoryUidCounter = 0n;

export async function createXingNangRow<TQuery, TRow extends SaveEditXingNangRecipeInput = SaveEditXingNangRecipeInput>(
  query: TQuery,
  repository: SaveEditInventoryRecipeRepository<TQuery, TRow>,
  options: CreateXingNangRowOptions = {},
) {
  const item = await repository.findInventoryItem(query);
  return item ? buildXingNangRowFromRecipeRow(item, options) : null;
}

export function buildXingNangRowFromRecipeRow(
  item: SaveEditXingNangRecipeInput,
  options: CreateXingNangRowOptions = {},
): SaveEditXingNangRow {
  const uid = options.uid || createInventoryUid();
  const isEquipment = equipmentTypeIds.has(Number(item.type_id));
  const bonusValue = recipeIntRangeMid(item.bonus_value_min, item.bonus_value_max);
  const quantity = options.quantity ?? item.recipe_quantity ?? 1;

  return {
    name: item.template_name || item.legacy_name || item.name || uid,
    juesename: options.owner || "ZhuJue",
    daojuname: item.legacy_name || item.name || "",
    type: String(item.type_id || 0),
    zhuangbeiid: isEquipment ? uid : "0",
    qty: String(quantity),
    rare: String(item.rarity_id || 0),
    att: String(item.recipe_item_id ? recipeIntRangeMid(item.att_min, item.att_max) : item.template_att || 0),
    def: String(item.recipe_item_id ? recipeIntRangeMid(item.def_min, item.def_max) : item.template_def || 0),
    hp: String(item.recipe_item_id ? recipeIntRangeMid(item.hp_min, item.hp_max) : item.template_hp || 0),
    weight: String(item.recipe_item_id ? recipeRangeMid(item.weight_min, item.weight_max) : item.template_weight || 0),
    length: String(item.recipe_item_id ? recipeRangeMid(item.length_min, item.length_max) : item.template_length || 0),
    zhushuxing: String(item.recipe_item_id ? recipeIntRangeMid(item.main_attribute_min, item.main_attribute_max) : item.template_zhushuxing || 0),
    lvli: String(item.fixed_strength ? bonusValue : item.lvli || 0),
    gengu: String(item.fixed_constitution ? bonusValue : item.gengu || 0),
    tipo: String(item.fixed_physique ? bonusValue : item.tipo || 0),
    shenfa: String(item.fixed_agility ? bonusValue : item.shenfa || 0),
    iseuipped: "false",
    showlv: String(item.showlv || 0),
    hidelv: String(item.hidelv || 0),
    isnew: "true",
    showname: item.showname || item.name || "",
    mingkecitiao: item.mingkecitiao || "",
    mingke_fg: String(item.mingke_fg || 0),
    mingke_lvli: String(item.mingke_lvli || 0),
    mingke_gengu: String(item.mingke_gengu || 0),
    mingke_tipo: String(item.mingke_tipo || 0),
    mingke_shenfa: String(item.mingke_shenfa || 0),
    redpoint: "false",
    selected: "false",
    uid,
  };
}

export function createInventoryUid(now = Date.now()) {
  inventoryUidSequence = (inventoryUidSequence + 1) % 10;
  inventoryUidCounter += 1n;
  const fileTime = (BigInt(now) + 11_644_473_600_000n) * 10_000n + inventoryUidCounter;
  return `${fileTime}${inventoryUidSequence}`;
}

function recipeRangeMid(min: number | null | undefined, max: number | null | undefined) {
  const minValue = Number(min);
  const maxValue = Number(max);
  if (Number.isFinite(minValue) && Number.isFinite(maxValue)) return (minValue + maxValue) / 2;
  if (Number.isFinite(minValue)) return minValue;
  if (Number.isFinite(maxValue)) return maxValue;
  return 0;
}

function recipeIntRangeMid(min: number | null | undefined, max: number | null | undefined) {
  return Math.round(recipeRangeMid(min, max));
}
