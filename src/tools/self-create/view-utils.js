import { enumLabel, getRareMeta } from "../../shared/utils.js";

export const WEAPON_TYPE_IDS = [0, 1, 2, 3, 4, 5];
export const ATTRIBUTE_TOTAL = 20;
export const ATTRIBUTE_NAMES = ["yi", "qi", "xing", "shen"];

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function nullableNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function nullableString(value) {
  if (value === null || value === undefined || value === "") return null;
  return String(value);
}

export function rowsOf(table) {
  return Array.isArray(table) ? table : table?.rows || [];
}

export function uniqueSorted(items) {
  return [...new Set(items.filter((item) => item !== null && item !== undefined && item !== ""))]
    .sort((a, b) => String(a).localeCompare(String(b), "zh-Hans-CN"));
}

export function formatPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0.0%";
  return `${(number * 100).toFixed(1)}%`;
}

export function formatMean(value, digits = 2) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0";
  return number.toFixed(digits).replace(/\.?0+$/, "");
}

export function effectText(effect, effectNames) {
  if (Number(effect?.bufftype) === 99) return "无特殊效果";
  const name = effectNames.get(Number(effect?.bufftype)) || `效果 ${effect?.bufftype}`;
  return `${name}(${effect?.value})`;
}

export function rareText(rare, enums) {
  const meta = getRareMeta(rare, enums);
  return enumLabel(enums, "WuGongRare", rare, meta.label);
}

export function rareClass(rare, enums) {
  return getRareMeta(rare, enums).className;
}

export function resultBadge(label, value, className = "") {
  return `
    <span class="searcher-badge ${className}">
      <em>${escapeHtml(label)}</em>${escapeHtml(value)}
    </span>
  `;
}

export function weaponOptions(enums) {
  return WEAPON_TYPE_IDS
    .map((id) => `<option value="${id}">${escapeHtml(enumLabel(enums, "BingQiType", id, String(id)))}</option>`)
    .join("");
}

export function styleOptions(data, enums) {
  const ids = uniqueSorted(rowsOf(data?.chainRows)
    .map((row) => Number(row.fengge))
    .filter((id) => id > 0));
  return [
    `<option value="">不指定</option>`,
    ...ids.map((id) => `<option value="${id}">${escapeHtml(enumLabel(enums, "LianSuo_FG", id, String(id)))}</option>`),
  ].join("");
}

export function areaOptions(data, weaponType) {
  const areas = uniqueSorted(rowsOf(data?.wugongRows)
    .filter((row) => Number(row.type) === Number(weaponType) && !row.iszichuang && row.attackareaname && row.attackareaname !== "无")
    .map((row) => row.attackareaname));
  return [
    `<option value="">不指定</option>`,
    ...areas.map((area) => `<option value="${escapeHtml(area)}">${escapeHtml(area)}</option>`),
  ].join("");
}

export function effectOptions(data, effects) {
  const available = new Set(rowsOf(data?.ziChuangBuffRows).map((row) => Number(row.bufftype)));
  available.add(99);
  const options = effects
    .filter((effect) => available.has(Number(effect.id)))
    .map((effect) => `<option value="${Number(effect.id)}">${escapeHtml(effect.name)}</option>`)
    .join("");
  return `<option value="">不指定</option>${options}`;
}

export function setButtonBusy(button, busy, text = "") {
  if (!button) return;
  if (busy) {
    button.dataset.idleText = button.textContent;
    button.disabled = true;
    button.classList.add("is-busy");
    button.setAttribute("aria-label", text || button.dataset.idleText || "处理中");
    button.innerHTML = `<span class="button-spinner" aria-hidden="true"></span>`;
    return;
  }

  button.disabled = false;
  button.classList.remove("is-busy");
  button.removeAttribute("aria-label");
  button.textContent = button.dataset.idleText || button.textContent;
  delete button.dataset.idleText;
}

export function waitForPaint() {
  if (typeof window === "undefined" || typeof window.requestAnimationFrame !== "function") {
    return new Promise((resolve) => setTimeout(resolve, 0));
  }

  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      setTimeout(resolve, 0);
    });
  });
}
