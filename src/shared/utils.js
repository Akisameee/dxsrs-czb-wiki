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

export function typeMark(type) {
  if (type === "内功") return "内";
  if (type === "外功") return "外";
  if (type === "自创") return "创";
  return "?";
}

export function getRareMeta(rare) {
  return rareMeta[Number(rare)] || { label: "未知", className: "rarity-unknown" };
}

export function countBy(items, getter) {
  const counts = new Map();
  for (const item of items) {
    const values = getter(item);
    for (const value of Array.isArray(values) ? values : [values]) {
      if (!value) continue;
      counts.set(value, (counts.get(value) || 0) + 1);
    }
  }
  return counts;
}

export function sortedCounts(counts) {
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-Hans-CN"));
}

export function formatEffectText(effect, effectCatalog) {
  if (!Array.isArray(effect) || effect.length === 0) return "未记录";

  const catalog = new Map((effectCatalog || []).map((item) => [item.name, item]));
  const rows = effect
    .filter((item) => item?.name && Number(item.level) > 0)
    .map((item) => {
      const numericLevel = Number(item.level);
      const meta = catalog.get(item.name);
      if (!meta) return `${item.name}(${numericLevel})`;
      const value = meta.valuePerLevel === null || meta.valuePerLevel === undefined
        ? null
        : Number(meta.valuePerLevel) * numericLevel;
      const text = value === null
        ? meta.template
        : meta.template.replaceAll("{value*n}", String(value));
      return `${item.name}(${numericLevel})${text}`;
    });
  return rows.length > 0 ? rows.join("，") : "未记录";
}
