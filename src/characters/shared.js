import { enumLabel, escapeHtml, fieldValue } from "../shared/utils.js";
import { hideTooltip, positionTooltipAt, showTooltipContent } from "../shared/hover-tooltip.js";

const SITE_ROOT = (document.body.dataset.dataRoot || "data/").replace(/data\/?$/, "");

function pagePath(path) {
  return `${SITE_ROOT}${path}`;
}

export function characterDetailHref(id) {
  return pagePath(`characters/detail/?id=${id}`);
}

export function characterLocationText(character, enums) {
  if (character.region_id === null || character.location_id === null) return "无地点";
  return `${enumLabel(enums, "DiDian", character.region_id)} / ${enumLabel(enums, "Area", character.location_id)}`;
}

function tag(text, className = "") {
  return `<span class="tag ${className}">${escapeHtml(text)}</span>`;
}

function tooltipRow(label, value) {
  return `
    <div class="tooltip-row">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(fieldValue(value))}</strong>
    </div>
  `;
}

function statLine(...values) {
  return values.map((value) => escapeHtml(fieldValue(value))).join(" / ");
}

export function renderCharacterTooltip(character, enums) {
  const aptitude = enumLabel(enums, "NPC_Rare", character.rarity_id, "未知资质");
  const roles = [
    Number(character.is_instructor) ? "教头" : "",
    Number(character.is_manager) ? "管事人" : "",
  ].filter(Boolean).join("、") || "无";

  return `
    <header>
      <strong>${escapeHtml(character.name)}</strong>
      <span class="tooltip-rarity rarity-npc-${escapeHtml(character.rarity_id)}">${escapeHtml(aptitude)}</span>
    </header>
    ${tooltipRow("地点", characterLocationText(character, enums))}
    ${tooltipRow("门派", enumLabel(enums, "LianSuo_MP", character.sect_id))}
    ${tooltipRow("资质", aptitude)}
    ${tooltipRow("等级", character.level)}
    ${tooltipRow("武器", enumLabel(enums, "BingQiType", character.weapon_type_id))}
    ${tooltipRow("路线", enumLabel(enums, "NPC_WuGongType", character.martial_type_id))}
    ${tooltipRow("四维", statLine(character.strength, character.constitution, character.physique, character.agility))}
    ${tooltipRow("精通", statLine(character.fist, character.blade_sword, character.spear_staff, character.hidden_weapon, character.internal))}
    ${tooltipRow("生活", statLine(character.mining, character.herb_gathering, character.hunting, character.forging, character.alchemy, character.sewing))}
    ${tooltipRow("身份", roles)}
  `;
}

export function renderCharacterCard(character, enums) {
  const tags = [
    tag(enumLabel(enums, "LianSuo_MP", character.sect_id, "未知门派"), "sect"),
    tag(enumLabel(enums, "NPC_Rare", character.rarity_id, "未知资质"), `rarity rarity-npc-${character.rarity_id}`),
    tag(enumLabel(enums, "BingQiType", character.weapon_type_id, "未知武器")),
    tag(enumLabel(enums, "NPC_WuGongType", character.martial_type_id, "未知路线")),
    Number(character.is_instructor) ? tag("教头") : "",
    Number(character.is_manager) ? tag("管事人") : "",
  ].filter(Boolean).join("");

  return `
    <a class="character-card character-card-link" href="${escapeHtml(characterDetailHref(character.id))}">
      <div class="character-card-main">
        <strong>${escapeHtml(character.name)}</strong>
        <span class="character-title-actions">
          <span class="character-card-location">${escapeHtml(characterLocationText(character, enums))}</span>
          <span
            class="martial-info-button character-info-button"
            data-character-info="${escapeHtml(character.id)}"
            aria-label="查看 ${escapeHtml(character.name)} 信息"
          >?</span>
        </span>
      </div>
      <div class="tag-row">${tags}</div>
      <span class="character-card-action">查看详情</span>
    </a>
  `;
}

export function bindCharacterInfoTooltip(container, options) {
  const { getItem, enums } = options;

  container.addEventListener("mouseover", (event) => {
    const button = event.target.closest("[data-character-info]");
    if (!button || !container.contains(button) || button.contains(event.relatedTarget)) return;
    const item = getItem(button.dataset.characterInfo);
    if (!item) return;
    showTooltipContent(renderCharacterTooltip(item, enums), event);
    const rect = button.getBoundingClientRect();
    positionTooltipAt(rect.left + rect.width / 2, rect.top + rect.height / 2);
  });

  container.addEventListener("mouseout", (event) => {
    const button = event.target.closest("[data-character-info]");
    if (!button || !container.contains(button) || button.contains(event.relatedTarget)) return;
    hideTooltip();
  });
}
