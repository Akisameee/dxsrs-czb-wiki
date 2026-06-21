import { enumLabel } from "../../utils";

import {
  linkMartialArtsInText,
  wikiItem,
  type WikiEnums,
  type WikiTextPart,
  wikiText,
} from "../text";

export type { WikiEnums } from "../text";

export type ItemSummaryRow = {
  id: number;
  name: string | null;
  image_id: string | null;
  description: string | null;
  type_id: number | null;
  rarity_id: number | null;
  use_type_id: number | null;
  use_text: string | null;
  use_value: number | null;
  use_value2: number | null;
  use_value3: number | null;
  cost: number | null;
  required_strength: number | null;
  required_constitution: number | null;
  required_physique: number | null;
  required_agility: number | null;
  required_cultivation: number | null;
  required_mastery: number | null;
  is_material: number;
};

export type ItemRequirementSummary = {
  key: string;
  label: string;
  value: string;
};

export type ItemRecipeRow = {
  id: number;
  item_id: number;
  recipe_name: string | null;
  product_name: string | null;
  type_id: number | null;
  quantity: number | null;
  rarity_id: number | null;
  material_1_name: string | null;
  material_1_item_id: number | null;
  material_1_quantity: number | null;
  material_2_name: string | null;
  material_2_item_id: number | null;
  material_2_quantity: number | null;
  material_3_name: string | null;
  material_3_item_id: number | null;
  material_3_quantity: number | null;
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
  bonus_count_min: number | null;
  bonus_count_max: number | null;
  bonus_value_min: number | null;
  bonus_value_max: number | null;
  fixed_strength: number;
  fixed_constitution: number;
  fixed_physique: number;
  fixed_agility: number;
  is_learned: number;
  required_level: number | null;
  is_basic: number;
  unlock_item_name: string | null;
  unlock_item_id: number | null;
  is_basic_material: number;
  can_buy: number;
};

export type ItemInventoryRecipeRow = {
  id: number;
  name: string | null;
  legacy_name: string | null;
  image_id: string | null;
  type_id: number | null;
  rarity_id: number | null;
  is_material: number;
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

export type ItemRecipeSummaryRow = {
  key: string;
  label: string;
  value: string;
  itemId?: number | null;
};

export type ItemRecipeMaterialSummary = {
  key: string;
  itemId: number | null;
  name: string;
  quantity: string;
};

export type ItemRecipeUnlockRow = {
  unlock_item_id: number;
  recipe_id: number;
  product_item_id: number;
  product_name: string | null;
};

export type ItemRecipeUnlockSummary = {
  key: string;
  itemId: number;
  name: string;
};

export type ItemRecipeSummary = {
  id: number;
  recipeName: string;
  outputQuantity: string;
  type: string;
  rarity: string;
  materials: ItemRecipeMaterialSummary[];
  metaRows: ItemRecipeSummaryRow[];
  attributeRows: ItemRecipeSummaryRow[];
};

export type ItemSummary = {
  id: number;
  name: string;
  initial: string;
  detailUrl: string;
  rarityId: number | null;
  imageId: string | null;
  type: string;
  rarity: string;
  useType: string;
  materialText: string;
  cost: string;
  description: string;
  descriptionParts: WikiTextPart[];
  useText: string;
  useEffectText: string;
  useEffectParts: WikiTextPart[];
  useValues: string[];
  requirements: ItemRequirementSummary[];
};

export function itemRarityToneId(id: number | string | null | undefined) {
  const value = Number(id);
  return Number.isFinite(value) ? value : null;
}

export function itemName(item: Pick<ItemSummaryRow, "id" | "name">) {
  return item.name || `道具 ${item.id}`;
}

export function itemInitial(item: Pick<ItemSummaryRow, "id" | "name">) {
  return itemName(item).slice(0, 1);
}

export function itemDetailUrl(id: number) {
  return `/items/detail/?id=${id}`;
}

export function itemTypeLabel(item: Pick<ItemSummaryRow, "type_id">, enums: WikiEnums) {
  return enumLabel(enums, "ItemType", item.type_id, "未知类型");
}

export function itemRarityLabel(item: Pick<ItemSummaryRow, "rarity_id">, enums: WikiEnums) {
  return enumLabel(enums, "ItemRare", item.rarity_id, "稀有度");
}

export function itemUseTypeLabel(item: Pick<ItemSummaryRow, "use_type_id">, enums: WikiEnums) {
  return enumLabel(enums, "UseType", item.use_type_id, "无");
}

export function itemMaterialText(item: Pick<ItemSummaryRow, "is_material">) {
  return Number(item.is_material) ? "是" : "否";
}

export function formatItemNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  return String(Math.round(Number(value) * 100) / 100);
}

export function itemUseValues(item: Pick<ItemSummaryRow, "use_value" | "use_value2" | "use_value3">) {
  return [
    item.use_value,
    item.use_value2,
    item.use_value3,
  ]
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value !== 0)
    .map((value) => formatItemNumber(value));
}

function itemUseNumber(value: number | null | undefined) {
  const number = Number(value);
  return Number.isFinite(number) ? formatItemNumber(number) : "";
}

function recipeUnlockNames(recipeUnlocks: ItemRecipeUnlockSummary[]) {
  return recipeUnlocks.map((unlock) => unlock.name).join("、");
}

export function itemUseEffectText(
  item: Pick<ItemSummaryRow, "use_type_id" | "use_text" | "use_value" | "use_value2" | "use_value3">,
  recipeUnlocks: ItemRecipeUnlockSummary[],
) {
  const type = Number(item.use_type_id);
  const text = item.use_text || "";
  const value1 = itemUseNumber(item.use_value);
  const value2 = itemUseNumber(item.use_value2);
  const value3 = itemUseNumber(item.use_value3);

  switch (type) {
    case 1:
      return [
        text ? `学习武学「${text}」` : "学习武学",
        value1 ? `最高可至 ${value1} 重` : "",
        value3 ? `需要 ${value3} 重基础` : "",
        value2 ? `武学修为 +${value2}` : "",
      ].filter(Boolean).join("，");
    case 2:
      return recipeUnlocks.length
        ? `习得${recipeUnlockNames(recipeUnlocks)}的制作方法`
        : text ? `习得${text}的制作方法` : "习得制作方法";
    case 3:
      return value1 ? `治愈永久内伤，效果等级 ${value1}` : "治愈永久内伤";
    case 4:
      return value1 ? `治愈永久外伤，效果等级 ${value1}` : "治愈永久外伤";
    case 5:
      return value1 ? `治愈新的内伤，效果等级 ${value1}` : "治愈新的内伤";
    case 6:
      return value1 ? `治愈新的外伤，效果等级 ${value1}` : "治愈新的外伤";
    case 8:
      return value1 ? `延长 ${value1} 年寿命` : "延长寿命";
    case 9:
      return value1 ? `回复 ${value1} 点行动力` : "回复行动力";
    case 10:
      return text
        ? `永久增加 ${value1 || "0"} 点${text}`
        : `永久增加 ${value1 || "0"} 点四项基础属性`;
    case 12:
      return value1 ? `获得 ${value1} 武学经验` : "获得武学经验";
    default:
      return item.use_text || "无";
  }
}

export async function itemUseEffectParts(
  item: Pick<ItemSummaryRow, "use_type_id" | "use_text" | "use_value" | "use_value2" | "use_value3">,
  recipeUnlocks: ItemRecipeUnlockSummary[],
) {
  if (Number(item.use_type_id) === 2 && recipeUnlocks.length) {
    const parts: WikiTextPart[] = [wikiText("习得")];
    recipeUnlocks.forEach((unlock, index) => {
      if (index > 0) parts.push(wikiText("、"));
      parts.push(wikiItem(unlock.itemId, unlock.name));
    });
    parts.push(wikiText("的制作方法"));
    return parts;
  }

  const text = itemUseEffectText(item, recipeUnlocks);
  const linkedParts = await linkMartialArtsInText(text);
  return linkedParts.length ? linkedParts : [wikiText(text)];
}

export function itemRequirements(item: ItemSummaryRow): ItemRequirementSummary[] {
  return [
    { key: "strength", label: "膂力", value: item.required_strength },
    { key: "constitution", label: "根骨", value: item.required_constitution },
    { key: "physique", label: "体魄", value: item.required_physique },
    { key: "agility", label: "身法", value: item.required_agility },
    { key: "cultivation", label: "修为", value: item.required_cultivation },
    { key: "mastery", label: "武艺", value: item.required_mastery },
  ]
    .map((row) => ({ ...row, numberValue: Number(row.value) }))
    .filter((row) => Number.isFinite(row.numberValue) && row.numberValue > 0)
    .map((row) => ({
      key: row.key,
      label: row.label,
      value: formatItemNumber(row.numberValue),
    }));
}

function numberOrNull(value: number | null | undefined) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function itemRecipeRangeText(min: number | null | undefined, max: number | null | undefined) {
  const minValue = numberOrNull(min);
  const maxValue = numberOrNull(max);
  if (minValue === null && maxValue === null) return "";
  if ((minValue || 0) === 0 && (maxValue || 0) === 0) return "";
  if (minValue === null) return formatItemNumber(maxValue);
  if (maxValue === null) return formatItemNumber(minValue);
  if (minValue === maxValue) return formatItemNumber(minValue);
  return `${formatItemNumber(minValue)} - ${formatItemNumber(maxValue)}`;
}

export function buildItemRecipeSummary(recipe: ItemRecipeRow, enums: WikiEnums): ItemRecipeSummary {
  const materialRows = [
    {
      key: "material_1",
      itemId: recipe.material_1_item_id,
      name: recipe.material_1_name,
      quantity: recipe.material_1_quantity,
    },
    {
      key: "material_2",
      itemId: recipe.material_2_item_id,
      name: recipe.material_2_name,
      quantity: recipe.material_2_quantity,
    },
    {
      key: "material_3",
      itemId: recipe.material_3_item_id,
      name: recipe.material_3_name,
      quantity: recipe.material_3_quantity,
    },
  ]
    .filter((row) => row.name && Number(row.quantity) > 0)
    .map((row) => ({
      key: row.key,
      itemId: row.itemId,
      name: row.name!,
      quantity: formatItemNumber(row.quantity),
    }));

  const metaRows = [
    { key: "quantity", label: "产出数量", value: Number(recipe.quantity) > 0 ? formatItemNumber(recipe.quantity) : "" },
    { key: "required_level", label: "需求等级", value: Number(recipe.required_level) > 0 ? formatItemNumber(recipe.required_level) : "" },
    { key: "unlock_item", label: "制作书", value: recipe.unlock_item_name || "", itemId: recipe.unlock_item_id },
    { key: "can_buy", label: "可购买", value: Number(recipe.can_buy) ? "是" : "" },
  ].filter((row) => row.value);

  const attributeRows = [
    { key: "att", label: "攻击", value: itemRecipeRangeText(recipe.att_min, recipe.att_max) },
    { key: "def", label: "防御", value: itemRecipeRangeText(recipe.def_min, recipe.def_max) },
    { key: "hp", label: "体力", value: itemRecipeRangeText(recipe.hp_min, recipe.hp_max) },
    { key: "weight", label: "重量", value: itemRecipeRangeText(recipe.weight_min, recipe.weight_max) },
    { key: "length", label: "攻击距离", value: itemRecipeRangeText(recipe.length_min, recipe.length_max) },
    { key: "main_attribute", label: "主属性", value: itemRecipeRangeText(recipe.main_attribute_min, recipe.main_attribute_max) },
    { key: "bonus_count", label: "附加属性数量", value: itemRecipeRangeText(recipe.bonus_count_min, recipe.bonus_count_max) },
    { key: "bonus_value", label: "附加属性数值", value: itemRecipeRangeText(recipe.bonus_value_min, recipe.bonus_value_max) },
    {
      key: "fixed_attributes",
      label: "固定属性",
      value: [
        Number(recipe.fixed_strength) ? "膂力" : "",
        Number(recipe.fixed_constitution) ? "根骨" : "",
        Number(recipe.fixed_physique) ? "体魄" : "",
        Number(recipe.fixed_agility) ? "身法" : "",
      ].filter(Boolean).join(" / "),
    },
  ].filter((row) => row.value);

  return {
    id: recipe.id,
    recipeName: recipe.recipe_name || recipe.product_name || `配方 ${recipe.id}`,
    outputQuantity: Number(recipe.quantity) > 0 ? formatItemNumber(recipe.quantity) : "-",
    type: itemTypeLabel(recipe, enums),
    rarity: itemRarityLabel(recipe, enums),
    materials: materialRows,
    metaRows,
    attributeRows,
  };
}

export function buildItemRecipeUnlockSummaries(rows: ItemRecipeUnlockRow[]): ItemRecipeUnlockSummary[] {
  return rows.map((row) => ({
    key: `${row.unlock_item_id}-${row.recipe_id}-${row.product_item_id}`,
    itemId: row.product_item_id,
    name: row.product_name || `道具 ${row.product_item_id}`,
  }));
}

export async function buildItemSummary(
  item: ItemSummaryRow,
  enums: WikiEnums,
  recipeUnlocks: ItemRecipeUnlockSummary[],
): Promise<ItemSummary> {
  const description = item.description || "";
  const descriptionParts = description
    ? await linkMartialArtsInText(description)
    : [];
  const useEffectText = itemUseEffectText(item, recipeUnlocks);
  const useEffectParts = await itemUseEffectParts(item, recipeUnlocks);

  return {
    id: item.id,
    name: itemName(item),
    initial: itemInitial(item),
    detailUrl: itemDetailUrl(item.id),
    rarityId: itemRarityToneId(item.rarity_id),
    imageId: item.image_id,
    type: itemTypeLabel(item, enums),
    rarity: itemRarityLabel(item, enums),
    useType: itemUseTypeLabel(item, enums),
    materialText: itemMaterialText(item),
    cost: formatItemNumber(item.cost),
    description,
    descriptionParts: descriptionParts.length ? descriptionParts : (description ? [wikiText(description)] : []),
    useText: item.use_text || "无",
    useEffectText,
    useEffectParts,
    useValues: itemUseValues(item),
    requirements: itemRequirements(item),
  };
}
