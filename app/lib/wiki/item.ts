import { enumLabel } from "../utils";

import { type WikiEnums } from "./text";

export type { WikiEnums } from "./text";

export type ItemSummaryRow = {
  id: number;
  icon: string | null;
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

export type ItemSummary = {
  id: number;
  name: string;
  initial: string;
  detailUrl: string;
  rarityId: number | null;
  icon: string | null;
  type: string;
  rarity: string;
  useType: string;
  materialText: string;
  cost: string;
  description: string;
  useText: string;
  useValues: string[];
  requirements: ItemRequirementSummary[];
};

export function itemRarityToneId(id: number | string | null | undefined) {
  const value = Number(id);
  return Number.isFinite(value) ? value : null;
}

export function itemName(item: Pick<ItemSummaryRow, "id">, enums: WikiEnums) {
  return enumLabel(enums, "Item", item.id, `道具 ${item.id}`);
}

export function itemInitial(item: Pick<ItemSummaryRow, "id">, enums: WikiEnums) {
  return itemName(item, enums).slice(0, 1);
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

export function buildItemSummary(item: ItemSummaryRow, enums: WikiEnums): ItemSummary {
  return {
    id: item.id,
    name: itemName(item, enums),
    initial: itemInitial(item, enums),
    detailUrl: itemDetailUrl(item.id),
    rarityId: itemRarityToneId(item.rarity_id),
    icon: item.icon,
    type: itemTypeLabel(item, enums),
    rarity: itemRarityLabel(item, enums),
    useType: itemUseTypeLabel(item, enums),
    materialText: itemMaterialText(item),
    cost: formatItemNumber(item.cost),
    description: item.description || "无说明",
    useText: item.use_text || "无",
    useValues: itemUseValues(item),
    requirements: itemRequirements(item),
  };
}
