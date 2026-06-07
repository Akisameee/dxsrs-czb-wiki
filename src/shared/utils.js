import { rareMeta } from "./constants.js";

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function fieldValue(value) {
  return value === null || value === undefined || value === "" ? "未知" : value;
}

export function listValue(values) {
  return Array.isArray(values) && values.length > 0 ? values : ["未记录"];
}

export function enumLabel(enumTypes, type, id, fallback = "未知") {
  const value = enumTypes?.[type]?.[String(id)];
  return value === null || value === undefined || value === "" ? fallback : value;
}

export function martialTypeLabel(enumTypes, typeId) {
  return enumLabel(enumTypes, "BingQiType", typeId, "?");
}

export function getRareMeta(rare, enumTypes = null) {
  const base = rareMeta[Number(rare)] || { className: "rarity-unknown" };
  return {
    ...base,
    label: enumLabel(enumTypes, "WuGongRare", rare, base.label || "未知"),
  };
}

export function countBy(items, getter) {
  const counts = new Map();
  for (const item of items) {
    const values = getter(item);
    for (const value of Array.isArray(values) ? values : [values]) {
      if (value === null || value === undefined || value === "") continue;
      counts.set(value, (counts.get(value) || 0) + 1);
    }
  }
  return counts;
}

export function sortedCounts(counts) {
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || Number(a[0]) - Number(b[0]));
}

export function formatEffectText(effect, effectCatalog) {
  if (!Array.isArray(effect) || effect.length === 0) return "未记录";

  const catalog = new Map((effectCatalog || []).map((item) => [Number(item.id), item]));
  const rows = effect
    .filter((item) => item?.id !== null && item?.id !== undefined && Number(item.level) >= 0)
    .map((item) => {
      const numericLevel = Number(item.level);
      const meta = catalog.get(Number(item.id));
      if (!meta) return `${item.id}(${numericLevel})`;
      const value = meta.valuePerLevel === null || meta.valuePerLevel === undefined
        ? null
        : Number(meta.valuePerLevel) * numericLevel;
      const text = value === null
        ? meta.template
        : meta.template.replaceAll("{value*n}", String(value));
      return `${meta.name}(${numericLevel})${text}`;
    });
  return rows.length > 0 ? rows.join("，") : "未记录";
}
