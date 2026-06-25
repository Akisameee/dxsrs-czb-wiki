import { saveEditDraftFieldValue, type SaveEditDraft } from "./draft";
import { formatSaveValue } from "./format";
import type { BgDatabaseTable, BgDatabaseValue } from "../bgdatabase";
import type { WikiEnums } from "../wiki/text";

export const SHANG_BING_ATTRIBUTE_BY_PART: Record<string, { key: string; label: string }> = {
  "0": { key: "lvli", label: "膂力" },
  "1": { key: "gengu", label: "根骨" },
  "2": { key: "tipo", label: "体魄" },
  "3": { key: "shenfa", label: "身法" },
};

export function shangBingFieldValue(
  table: BgDatabaseTable,
  draft: SaveEditDraft,
  fieldName: string,
  rowIndex: number,
) {
  return saveEditDraftFieldValue(table.fields[fieldName], rowIndex, draft);
}

export function shangBingFieldText(
  table: BgDatabaseTable,
  draft: SaveEditDraft,
  fieldName: string,
  rowIndex: number,
) {
  return formatSaveValue(shangBingFieldValue(table, draft, fieldName, rowIndex));
}

export function shangBingEnumLabel(
  enums: WikiEnums | null | undefined,
  enumType: string,
  value: BgDatabaseValue | string,
) {
  const id = formatSaveValue(value);
  return enums?.[enumType]?.[id] || id || "未知";
}

export function shangBingAttributeByPart(partValue: BgDatabaseValue | string) {
  const key = formatSaveValue(partValue);
  return SHANG_BING_ATTRIBUTE_BY_PART[key] || { key: "", label: "属性" };
}

export function shangBingTitle(table: BgDatabaseTable, draft: SaveEditDraft, enums: WikiEnums, rowIndex: number) {
  const name = shangBingFieldText(table, draft, "mingcheng", rowIndex).trim();
  if (name) return name;

  const chengdu = shangBingEnumLabel(enums, "ShangBingChengDu", shangBingFieldValue(table, draft, "chengdu", rowIndex));
  const type = shangBingEnumLabel(enums, "ShangBingType", shangBingFieldValue(table, draft, "type", rowIndex));
  return `${chengdu}${type}` || `伤病 ${rowIndex + 1}`;
}

export function shangBingEffectText(table: BgDatabaseTable, draft: SaveEditDraft, rowIndex: number) {
  const attribute = shangBingAttributeByPart(shangBingFieldValue(table, draft, "buwei", rowIndex));
  const value1 = shangBingFieldText(table, draft, "value1", rowIndex);
  const value2 = shangBingFieldText(table, draft, "value2", rowIndex);
  const parts = [`${attribute.label} ${value1 || "0"}`];
  if (value2 && value2 !== "0") parts.push(`附加 ${value2}`);
  return parts.join("，");
}
