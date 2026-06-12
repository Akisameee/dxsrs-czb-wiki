import { enumLabel } from "../utils";

import {
  linkMartialArtsInText,
  type WikiEnums,
  type WikiTextPart,
  wikiText,
} from "./text";

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

function itemUseNumber(value: number | null | undefined) {
  const number = Number(value);
  return Number.isFinite(number) ? formatItemNumber(number) : "";
}

export function itemUseEffectText(item: Pick<ItemSummaryRow, "use_type_id" | "use_text" | "use_value" | "use_value2" | "use_value3">) {
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
      return text ? `习得「${text}」的制作图纸` : "习得制作图纸";
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
  const description = item.description || "无说明";
  const descriptionParts = linkMartialArtsInText(description, enums);
  const useEffectText = itemUseEffectText(item);
  const useEffectParts = linkMartialArtsInText(useEffectText, enums);

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
    description,
    descriptionParts: descriptionParts.length ? descriptionParts : [wikiText(description)],
    useText: item.use_text || "无",
    useEffectText,
    useEffectParts: useEffectParts.length ? useEffectParts : [wikiText(useEffectText)],
    useValues: itemUseValues(item),
    requirements: itemRequirements(item),
  };
}
