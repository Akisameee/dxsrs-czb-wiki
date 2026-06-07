import { state } from "./state.js?v=20260607-01";
import { escapeHtml, fieldValue, formatEffectText, getRareMeta, listValue, typeMark } from "../../shared/utils.js?v=20260607-01";

export const hoverTooltip = document.createElement("div");
hoverTooltip.className = "martial-tooltip";
hoverTooltip.setAttribute("role", "tooltip");
document.body.appendChild(hoverTooltip);

function renderInfoRow(label, value) {
  return `
    <div class="tooltip-row">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(fieldValue(value))}</strong>
    </div>
  `;
}

function renderMartialTooltip(item) {
  const rare = getRareMeta(item.rare);
  const styleText = listValue(item.styles).join("、");
  const common = `
    <header>
      <strong>(${escapeHtml(typeMark(item.type))}) ${escapeHtml(item.name)}</strong>
      <span class="tooltip-rarity ${rare.className}">${escapeHtml(rare.label)}</span>
    </header>
    ${renderInfoRow("门派", item.sect)}
    ${renderInfoRow("风格", styleText)}
  `;

  if (item.type === "内功") {
    const passives = listValue(item.passives)
      .map((passive) => `<li>${escapeHtml(passive)}</li>`)
      .join("");
    return `
      ${common}
      ${renderInfoRow("特殊", item.special || "未记录")}
      <div class="tooltip-block">
        <span>被动</span>
        <ul>${passives}</ul>
      </div>
      ${renderInfoRow("入手", item.obtainMethod || "未知")}
    `;
  }

  return `
    ${common}
    ${renderInfoRow("威力", item.power ?? "未知")}
    ${renderInfoRow("真气", item.cost ?? "未知")}
    ${renderInfoRow("效果", formatEffectText(item.effect, state.effects))}
    ${renderInfoRow("入手", item.obtainMethod || "未知")}
  `;
}

export function positionTooltip(event) {
  const padding = 14;
  const gap = 12;
  const rect = hoverTooltip.getBoundingClientRect();
  let left = event.clientX + gap;
  let top = event.clientY + gap;

  if (left + rect.width + padding > window.innerWidth) {
    left = event.clientX - rect.width - gap;
  }
  if (top + rect.height + padding > window.innerHeight) {
    top = event.clientY - rect.height - gap;
  }

  hoverTooltip.style.left = `${Math.max(padding, left)}px`;
  hoverTooltip.style.top = `${Math.max(padding, top)}px`;
}

function showTooltipContent(html, event) {
  hoverTooltip.innerHTML = html;
  hoverTooltip.classList.add("is-visible");
  positionTooltip(event);
}

export function showMartialTooltip(item, event) {
  showTooltipContent(renderMartialTooltip(item), event);
}

export function showChainTooltip(effect, event) {
  showTooltipContent(`
    <header>
      <strong>连锁效果</strong>
    </header>
    <div class="tooltip-text">${escapeHtml(effect)}</div>
  `, event);
}

export function hideTooltip() {
  hoverTooltip.classList.remove("is-visible");
}
