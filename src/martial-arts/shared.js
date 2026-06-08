import { enumLabel, escapeHtml, fieldValue, formatEffectText, getRareMeta, listValue, martialTypeLabel } from "../shared/utils.js";
import { bindHoverTooltipTarget } from "../shared/hover-tooltip.js";
import { renderWikiCard } from "../shared/wiki-card.js";

const SITE_ROOT = (document.body.dataset.dataRoot || "data/").replace(/data\/?$/, "");

function pagePath(path) {
  return `${SITE_ROOT}${path}`;
}

function valueOf(item, snakeName, camelName = snakeName) {
  return item?.[snakeName] ?? item?.[camelName];
}

export function martialId(item) {
  return valueOf(item, "id");
}

export function martialName(item) {
  return valueOf(item, "name", "name") || "";
}

export function martialSectId(item) {
  return valueOf(item, "sect_id", "sectId");
}

export function martialTypeId(item) {
  return valueOf(item, "type_id", "typeId");
}

export function martialRare(item) {
  return valueOf(item, "rarity_id", "rare");
}

export function martialStyleIds(item) {
  return valueOf(item, "style_ids", "styleIds") || [];
}

export function martialEffects(item) {
  return valueOf(item, "effects", "effect") || [];
}

export function martialPassives(item) {
  return valueOf(item, "passives", "passives") || [];
}

export function martialObtainMethod(item) {
  return valueOf(item, "obtain_method", "obtainMethod");
}

function tag(text, className = "") {
  return `<span class="tag ${className}">${escapeHtml(text)}</span>`;
}

function infoRow(label, value) {
  return `
    <div class="tooltip-row">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(fieldValue(value))}</strong>
    </div>
  `;
}

function effectText(effect) {
  if (effect?.id !== undefined) return null;
  const level = Number(effect.level);
  const value = effect.value_per_level === null || effect.value_per_level === undefined
    ? null
    : Number(effect.value_per_level) * level;
  const description = value === null
    ? effect.template
    : String(effect.template || "").replaceAll("{value*n}", String(value));
  return `${effect.name || `效果 ${effect.effect_id}`}(${level})${description ? ` ${description}` : ""}`;
}

function listBlock(label, items, renderItem) {
  const rows = Array.isArray(items) && items.length
    ? items.map((item) => `<li>${escapeHtml(renderItem(item))}</li>`).join("")
    : "<li>未记录</li>";
  return `
    <div class="tooltip-block">
      <span>${escapeHtml(label)}</span>
      <ul>${rows}</ul>
    </div>
  `;
}

export function renderMartialTooltip(item, enums, options = {}) {
  const rare = getRareMeta(martialRare(item), enums);
  const typeId = martialTypeId(item);
  const typeName = martialTypeLabel(enums, typeId);
  const styleText = listValue(martialStyleIds(item).map((id) => enumLabel(enums, "LianSuo_FG", id))).join("、");
  const effects = martialEffects(item);
  const effectContent = effects.some((effect) => effect?.id !== undefined)
    ? formatEffectText(effects, options.effectsCatalog)
    : null;
  const passiveItems = martialPassives(item).map((passive) => (
    typeof passive === "string" ? passive : passive.text
  ));

  return `
    <header>
      <strong>(${escapeHtml(typeName)}) ${escapeHtml(martialName(item))}</strong>
      <span class="tooltip-rarity ${rare.className}">${escapeHtml(rare.label)}</span>
    </header>
    ${infoRow("门派", enumLabel(enums, "LianSuo_MP", martialSectId(item)))}
    ${infoRow("风格", styleText)}
    ${infoRow("类型", typeName)}
    ${infoRow("威力", valueOf(item, "power"))}
    ${infoRow("真气", valueOf(item, "cost"))}
    ${effectContent === null ? listBlock("效果", effects, effectText) : infoRow("效果", effectContent)}
    ${listBlock("被动", passiveItems, (passive) => passive)}
    ${valueOf(item, "special") ? infoRow("特殊", valueOf(item, "special")) : ""}
    ${infoRow("入手", martialObtainMethod(item) || "未知")}
  `;
}

export function renderMartialCard(item, enums, options = {}) {
  const rare = getRareMeta(martialRare(item), enums);
  const typeName = martialTypeLabel(enums, martialTypeId(item));
  const name = martialName(item);
  const tags = [
    tag(enumLabel(enums, "LianSuo_MP", martialSectId(item)), "sect"),
    ...martialStyleIds(item).map((styleId) => tag(enumLabel(enums, "LianSuo_FG", styleId))),
  ].join("");
  const infoValue = options.infoValue ?? martialId(item) ?? name;
  return renderWikiCard({
    href: options.href,
    title: `(${typeName}) ${name}`,
    tags,
    className: [rare.className, options.className || ""].filter(Boolean).join(" "),
    selected: Boolean(options.selected),
    disabled: Boolean(options.disabled),
    titleAttr: options.title,
    dataAttrs: options.dataName ? { "data-name": options.dataName } : {},
    showCheckMark: Boolean(options.showCheckMark),
    info: {
      attr: "data-martial-info",
      value: infoValue,
      label: `查看 ${name} 信息`,
    },
  });
}

export function martialDetailHref(id) {
  return pagePath(`martial-arts/detail/?id=${id}`);
}

export function bindMartialInfoTooltip(container, options) {
  const { getItem, enums, effectsCatalog = [] } = options;
  bindHoverTooltipTarget(container, {
    selector: "[data-martial-info]",
    getItem: (target) => getItem(target.dataset.martialInfo),
    renderTooltip: (item) => renderMartialTooltip(item, enums, { effectsCatalog }),
  });
}
