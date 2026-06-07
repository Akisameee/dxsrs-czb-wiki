import { EQUIPMENT_STYLE_OPTION_IDS, EQUIPMENT_STYLE_SLOTS, MAX_SELECTION } from "../../shared/constants.js";
import { canEnableCustomMartial, canSelectMartialItem, getCustomMartialConflictSect, getJoinableSects, getMartialConflictSect, getMartialSelectionCount, getSelectedMartialItems } from "./loadout.js";
import { els, state } from "./state.js";
import { enumLabel, escapeHtml, getRareMeta, martialTypeLabel, sortedCounts } from "../../shared/utils.js";

function labelFor(type, id) {
  return enumLabel(state.enums, type, id);
}

function createRadioOptions(container, name, values, allLabel, enumType) {
  const options = [
    { value: "all", label: allLabel },
    ...values.map((value) => ({ value, label: labelFor(enumType, value) })),
  ];
  container.innerHTML = options.map((option) => {
    const checked = option.value === "all" ? "checked" : "";
    return `
      <label class="radio-pill">
        <input type="radio" name="${escapeHtml(name)}" value="${escapeHtml(option.value)}" ${checked}>
        <span>${escapeHtml(option.label)}</span>
      </label>
    `;
  }).join("");
}

export function renderFilters() {
  const sects = [...new Set(state.wuxue.map((item) => Number(item.sectId)).filter(Number.isFinite))]
    .sort((a, b) => a - b);
  const styles = [...new Set(state.wuxue.flatMap((item) => item.styleIds || []).map(Number).filter(Number.isFinite))]
    .sort((a, b) => a - b);

  createRadioOptions(els.sectFilter, "sect-filter", sects, "全部门派", "LianSuo_MP");
  createRadioOptions(els.styleFilter, "style-filter", styles, "全部风格", "LianSuo_FG");
}

function createSelectOptions(values, placeholder, selectedValue, enumType) {
  const options = [
    { value: "", label: placeholder },
    ...values.map((value) => ({ value, label: labelFor(enumType, value) })),
  ];
  return options.map((option) => `
    <option
      value="${escapeHtml(option.value)}"
      ${String(option.value) === String(selectedValue) ? "selected" : ""}
    >
      ${escapeHtml(option.label)}
    </option>
  `).join("");
}

export function renderLoadoutControls() {
  els.equipmentStyleControls.innerHTML = EQUIPMENT_STYLE_SLOTS.map((slot) => `
    <label>
      <span>${escapeHtml(slot.label)}</span>
      <select data-equipment-style="${escapeHtml(slot.key)}">
        ${createSelectOptions(EQUIPMENT_STYLE_OPTION_IDS, "无", state.equipmentStyles[slot.key], "LianSuo_FG")}
      </select>
    </label>
  `).join("");

  const sects = getJoinableSects(state);
  const styles = state.styleChains
    .map((record) => Number(record.styleId))
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  const customCanBeEnabled = canEnableCustomMartial(state, MAX_SELECTION);
  const customConflictSect = getCustomMartialConflictSect(state);
  const customEnabledTitle = state.customMartial.sectId === "" || state.customMartial.styleId === ""
    ? "先选择门派和风格"
    : customConflictSect !== ""
      ? `当前已加入${labelFor("LianSuo_MP", customConflictSect)}，自创外功不能选择其它门派`
      : getSelectedMartialItems(state).length >= MAX_SELECTION && !state.customMartial.enabled
        ? `最多选择 ${MAX_SELECTION} 个武功`
        : "";

  els.customEnabled.checked = state.customMartial.enabled;
  els.customEnabled.disabled = !customCanBeEnabled;
  els.customEnabled.title = customEnabledTitle;
  els.customSect.innerHTML = createSelectOptions(sects, "选择门派", state.customMartial.sectId, "LianSuo_MP");
  els.customStyle.innerHTML = createSelectOptions(styles, "选择风格", state.customMartial.styleId, "LianSuo_FG");
  els.customSect.disabled = false;
  els.customStyle.disabled = false;
}

export function renderSelected(items) {
  els.selectedCount.textContent = String(items.length);
  if (items.length === 0) {
    els.selectedList.innerHTML = `<span class="empty-state">未选择</span>`;
    return;
  }

  els.selectedList.innerHTML = items.map((item) => {
    const button = item.isCustom
      ? `<button type="button" data-remove-custom="true" aria-label="移除 ${escapeHtml(item.name)}">×</button>`
      : `<button type="button" data-remove="${escapeHtml(item.name)}" aria-label="移除 ${escapeHtml(item.name)}">×</button>`;
    const title = item.isCustom
      ? `${item.name}：${labelFor("LianSuo_MP", item.sectId)} / ${(item.styleIds || []).map((id) => labelFor("LianSuo_FG", id)).join("、")}`
      : item.name;

    return `
    <span class="selected-pill" title="${escapeHtml(title)}">
      (${escapeHtml(martialTypeLabel(state.enums, item.typeId))}) ${escapeHtml(item.name)}
      ${button}
    </span>
  `;
  }).join("");
}

export function renderMartialList() {
  const hasMaxSelection = getMartialSelectionCount(state) >= MAX_SELECTION;
  const filtered = state.wuxue.filter((item) => {
    const inSect = state.filters.sect === "all" || Number(item.sectId) === Number(state.filters.sect);
    const inStyle = state.filters.style === "all" || (item.styleIds || []).map(Number).includes(Number(state.filters.style));
    return inSect && inStyle;
  });

  if (filtered.length === 0) {
    els.martialList.innerHTML = `<div class="empty-state">没有匹配项</div>`;
    return;
  }

  els.martialList.innerHTML = filtered.map((item) => {
    const selected = state.selected.has(item.name);
    const conflictSect = getMartialConflictSect(state, item);
    const disabledByLimit = !selected && hasMaxSelection;
    const disabledByConflict = !selected && !canSelectMartialItem(state, item);
    const disabled = disabledByLimit || disabledByConflict;
    const rare = getRareMeta(item.rare, state.enums);
    const disabledTitle = disabledByConflict
      ? `当前已加入${labelFor("LianSuo_MP", conflictSect)}，不能选择其它门派限定武学`
      : disabledByLimit
        ? `最多选择 ${MAX_SELECTION} 个武功`
        : item.name;
    const tags = [
      `<span class="tag sect">${escapeHtml(labelFor("LianSuo_MP", item.sectId))}</span>`,
      ...(item.styleIds || []).map((styleId) => `<span class="tag">${escapeHtml(labelFor("LianSuo_FG", styleId))}</span>`),
    ].join("");

    return `
      <button
        type="button"
        class="martial-card ${rare.className} ${selected ? "is-selected" : ""} ${disabled ? "is-disabled" : ""}"
        data-name="${escapeHtml(item.name)}"
        title="${escapeHtml(disabledTitle)}"
        ${disabled ? "aria-disabled=\"true\"" : ""}
      >
        <span class="martial-title">
          <span>(${escapeHtml(martialTypeLabel(state.enums, item.typeId))}) ${escapeHtml(item.name)}</span>
          <span class="check-mark" aria-hidden="true">✓</span>
        </span>
        <span class="tag-row">${tags}</span>
      </button>
    `;
  }).join("");
}

export function renderSummary(container, counts, enumType) {
  const rows = sortedCounts(counts);
  if (rows.length === 0) {
    container.innerHTML = `<span class="empty-state">无</span>`;
    return;
  }

  container.innerHTML = rows.map(([id, count]) => `
    <span class="summary-pill">${escapeHtml(labelFor(enumType, id))} <strong>${count}</strong></span>
  `).join("");
}

export function renderChainGroups(container, records) {
  if (records.length === 0) {
    container.innerHTML = `<div class="empty-state">选择武功后显示相关连锁</div>`;
    return;
  }

  container.innerHTML = records.map((record) => {
    const { groupName, groupType, count, level } = record;
    const groupLabel = labelFor(groupType === "sect" ? "LianSuo_MP" : "LianSuo_FG", groupName);
    const blocks = record.blocks.map((block) => {
      const classes = [
        "chain-block",
        `is-${block.state}`,
      ].filter(Boolean).join(" ");
      const title = block.effect ? `${block.value}: ${block.effect}` : `${block.value}`;
      const effectAttr = block.effect ? `data-effect="${escapeHtml(block.effect)}"` : "";

      return `<span class="${classes}" ${effectAttr} title="${escapeHtml(title)}" aria-label="${escapeHtml(title)}"></span>`;
    }).join("");
    const activeEffect = record.activeEffect
      ? `<div class="chain-active-effect">${escapeHtml(record.activeEffect)}</div>`
      : "";

    return `
      <article class="chain-group">
        <header class="chain-group-head">
          <div class="chain-title-row">
            <strong>${escapeHtml(groupLabel)}</strong>
            <span class="tag">${groupType === "sect" ? "门派" : "风格"}</span>
            <span class="chain-count">当前 ${count}${level ? ` / 生效 ${level}` : ""}</span>
          </div>
          <div class="chain-blocks" aria-label="${escapeHtml(groupLabel)}连锁进度">
            ${blocks}
          </div>
        </header>
        ${activeEffect}
      </article>
    `;
  }).join("");
}
