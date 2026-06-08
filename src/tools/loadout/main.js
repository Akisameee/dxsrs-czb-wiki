import { MAX_SELECTION } from "../../shared/constants.js";
import { els, state } from "./state.js";
import { buildVisibleChainRecords, getPenglaiModifier, isBasicChainUnlocked } from "./rules.js";
import { canEnableCustomMartial, canSelectMartialItem, getMartialCountItems, getMartialSelectionCount, getStyleCountItems } from "./loadout.js";
import { countBy, escapeHtml } from "../../shared/utils.js";
import { hideTooltip, hoverTooltip, positionTooltip, showChainTooltip, showMartialTooltip } from "./tooltips.js";
import { renderChainGroups, renderFilters, renderLoadoutControls, renderMartialList, renderSelected, renderSummary } from "./render.js";
import { loadLoadoutData } from "../../shared/wiki-db.js";

function render() {
  if (state.customMartial.enabled && !canEnableCustomMartial(state, MAX_SELECTION)) {
    state.customMartial.enabled = false;
  }

  const martialItems = getMartialCountItems(state);
  const styleItems = getStyleCountItems(state);
  const sectCounts = countBy(martialItems, (item) => Number(item.sectId));
  const styleCounts = countBy(styleItems, (item) => item.styleIds || []);
  const penglaiModifier = getPenglaiModifier(sectCounts);
  const basicUnlocked = isBasicChainUnlocked(state.styleChains, styleCounts, penglaiModifier);
  const visibleChainRecords = buildVisibleChainRecords(
    state.sectChains,
    state.styleChains,
    sectCounts,
    styleCounts,
    penglaiModifier,
    basicUnlocked,
  );

  renderSelected(martialItems);
  renderLoadoutControls();
  renderMartialList();
  renderSummary(els.sectSummary, sectCounts, "LianSuo_MP");
  renderSummary(els.styleSummary, styleCounts, "LianSuo_FG");
  renderChainGroups(els.chainList, visibleChainRecords);
}

function toggleSelection(name) {
  if (state.selected.has(name)) {
    state.selected.delete(name);
    render();
    return;
  }

  if (getMartialSelectionCount(state) >= MAX_SELECTION) return;
  const item = state.wuxue.find((entry) => entry.name === name);
  if (!item || !canSelectMartialItem(state, item)) return;
  state.selected.add(name);
  render();
}

function clearCustomMartial() {
  state.customMartial.enabled = false;
  state.customMartial.sectId = "";
  state.customMartial.styleId = "";
}

function bindEvents() {
  els.sectFilter.addEventListener("change", (event) => {
    if (event.target.type !== "radio") return;
    state.filters.sect = event.target.value === "all" ? "all" : Number(event.target.value);
    renderMartialList();
  });

  els.styleFilter.addEventListener("change", (event) => {
    if (event.target.type !== "radio") return;
    state.filters.style = event.target.value === "all" ? "all" : Number(event.target.value);
    renderMartialList();
  });

  els.clearButton.addEventListener("click", () => {
    state.selected.clear();
    clearCustomMartial();
    render();
  });

  els.equipmentStyleControls.addEventListener("change", (event) => {
    const select = event.target.closest("[data-equipment-style]");
    if (!select) return;
    state.equipmentStyles[select.dataset.equipmentStyle] = select.value === "" ? "" : Number(select.value);
    render();
  });

  els.customEnabled.addEventListener("change", (event) => {
    if (event.target.checked && !canEnableCustomMartial(state, MAX_SELECTION)) {
      event.target.checked = false;
      state.customMartial.enabled = false;
      render();
      return;
    }
    state.customMartial.enabled = event.target.checked;
    render();
  });

  els.customSect.addEventListener("change", (event) => {
    state.customMartial.sectId = event.target.value === "" ? "" : Number(event.target.value);
    render();
  });

  els.customStyle.addEventListener("change", (event) => {
    state.customMartial.styleId = event.target.value === "" ? "" : Number(event.target.value);
    render();
  });

  els.martialList.addEventListener("click", (event) => {
    const card = event.target.closest("[data-name]");
    if (!card || card.getAttribute("aria-disabled") === "true") return;
    toggleSelection(card.dataset.name);
  });

  els.martialList.addEventListener("mouseover", (event) => {
    const card = event.target.closest("[data-name]");
    if (!card || card.contains(event.relatedTarget)) return;
    const item = state.wuxue.find((entry) => entry.name === card.dataset.name);
    if (!item) return;
    showMartialTooltip(item, event);
  });

  els.martialList.addEventListener("mousemove", (event) => {
    if (!hoverTooltip.classList.contains("is-visible")) return;
    positionTooltip(event);
  });

  els.martialList.addEventListener("mouseout", (event) => {
    const card = event.target.closest("[data-name]");
    if (!card || card.contains(event.relatedTarget)) return;
    hideTooltip();
  });

  els.selectedList.addEventListener("click", (event) => {
    const customButton = event.target.closest("[data-remove-custom]");
    if (customButton) {
      clearCustomMartial();
      render();
      return;
    }

    const button = event.target.closest("[data-remove]");
    if (!button) return;
    state.selected.delete(button.dataset.remove);
    render();
  });

  els.chainList.addEventListener("mouseover", (event) => {
    const block = event.target.closest("[data-effect]");
    if (!block || block.contains(event.relatedTarget)) return;
    showChainTooltip(block.dataset.effect, event);
  });

  els.chainList.addEventListener("mousemove", (event) => {
    if (!event.target.closest("[data-effect]")) return;
    if (!hoverTooltip.classList.contains("is-visible")) return;
    positionTooltip(event);
  });

  els.chainList.addEventListener("mouseout", (event) => {
    const block = event.target.closest("[data-effect]");
    if (!block || block.contains(event.relatedTarget)) return;
    hideTooltip();
  });
}

async function loadData() {
  const { wuxue, effects, sectChains, styleChains, enums } = await loadLoadoutData();

  state.wuxue = wuxue;
  state.effects = effects;
  state.sectChains = sectChains;
  state.styleChains = styleChains;
  state.enums = enums;
  els.status.textContent = `${wuxue.length} 个武功，${sectChains.length} 个门派连锁，${styleChains.length} 个风格连锁`;
}

loadData()
  .then(() => {
    renderFilters();
    bindEvents();
    render();
  })
  .catch((error) => {
    els.status.textContent = "数据读取失败";
    els.martialList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
  });
