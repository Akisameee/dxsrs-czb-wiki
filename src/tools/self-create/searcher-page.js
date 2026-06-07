import { enumLabel } from "../../shared/utils.js";
import { searchSelfCreateInitials } from "./searcher.js";
import {
  ATTRIBUTE_NAMES,
  WEAPON_TYPE_IDS,
  areaOptions,
  effectOptions,
  effectText,
  escapeHtml,
  formatMean,
  formatPercent,
  nullableNumber,
  nullableString,
  resultBadge,
  rowsOf,
  setButtonBusy,
  styleOptions,
  waitForPaint,
  weaponOptions,
} from "./view-utils.js";

const SEARCHER_SORT_FIELDS = [
  { id: "styleMatch", label: "风格概率" },
  { id: "effectLevel", label: "效果概率" },
  { id: "improveSpace", label: "威力均值" },
  { id: "maxPower", label: "最大威力" },
];
const BASE_SEARCHER_SORT = ["improveSpace", "maxPower"];
const SEARCHER_PAGE_SIZE = 10;

function routeAttributes(route) {
  return ATTRIBUTE_NAMES.map((name) => `${route.input[name]}`).join("/");
}

function searcherStats(route) {
  return route.stats || {};
}

function hasStyleTarget(results) {
  return results.some((route) => searcherStats(route).target?.styleId != null);
}

function hasEffectTarget(results) {
  return results.some((route) => {
    const target = searcherStats(route).target || {};
    return target.effectType != null || target.effectTarget != null || target.effectValue != null || target.minEffectValue != null;
  });
}

function availableSortFields(results) {
  return [
    ...(hasStyleTarget(results) ? ["styleMatch"] : []),
    ...(hasEffectTarget(results) ? ["effectLevel"] : []),
    ...BASE_SEARCHER_SORT,
  ];
}

function sortOrder(primary, results) {
  const fields = availableSortFields(results);
  if (!fields.includes(primary)) return fields;
  return [primary, ...fields.filter((field) => field !== primary)];
}

function compareSearcherField(a, b, field) {
  switch (field) {
    case "styleMatch":
      if (searcherStats(a).target?.styleId === null && searcherStats(b).target?.styleId === null) return 0;
      return Number(searcherStats(b).styleProbability || 0) - Number(searcherStats(a).styleProbability || 0);
    case "effectLevel":
      if (searcherStats(a).target?.effectType === null && searcherStats(b).target?.effectType === null) return 0;
      return Number(searcherStats(b).effectProbability || 0) - Number(searcherStats(a).effectProbability || 0);
    case "improveSpace":
      return Number(searcherStats(b).averagePower || 0) - Number(searcherStats(a).averagePower || 0);
    case "maxPower":
      return Number(searcherStats(b).maxPower || 0) - Number(searcherStats(a).maxPower || 0);
    default:
      return 0;
  }
}

function compareByOrder(a, b, order) {
  for (const field of order) {
    const diff = compareSearcherField(a, b, field);
    if (diff !== 0) return diff;
  }
  return 0;
}

function sortSearcherMatches(results, primary) {
  const order = sortOrder(primary, results);
  return [...results].sort((a, b) => (
    compareByOrder(a, b, order) ||
    Number(a.seed || 0) - Number(b.seed || 0)
  ));
}

function sortFieldLabel(fieldId) {
  return SEARCHER_SORT_FIELDS.find((field) => field.id === fieldId)?.label || "威力均值";
}

function nextSortPrimary(current, results) {
  const fields = availableSortFields(results);
  const index = fields.indexOf(current);
  return fields[(index + 1) % fields.length] || fields[0] || "improveSpace";
}

export function initSelfCreateSearcher(context) {
  const { data, enums, effects, effectNames } = context;
  const els = {
    status: document.getElementById("searcher-status"),
    weaponType: document.getElementById("searcher-weapon-type"),
    style: document.getElementById("searcher-style"),
    area: document.getElementById("searcher-area"),
    effect: document.getElementById("searcher-effect"),
    effectLevel: document.getElementById("searcher-effect-level"),
    simulationCount: document.getElementById("searcher-simulation-count"),
    searchButton: document.getElementById("searcher-search-button"),
    results: document.getElementById("searcher-results"),
  };
  const state = {
    matches: [],
    sortPrimary: "styleMatch",
    page: 1,
  };

  function renderAreaOptions() {
    const selected = els.area.value;
    els.area.innerHTML = areaOptions(data, els.weaponType.value);
    if ([...els.area.options].some((option) => option.value === selected)) {
      els.area.value = selected;
    }
  }

  function maxEffectLevel(effectType) {
    return rowsOf(data?.ziChuangBuffRows)
      .filter((row) => Number(row.bufftype) === Number(effectType))
      .reduce((max, row) => Math.max(max, Number(row.value || 0)), 0);
  }

  function updateEffectLevelControl() {
    const effectType = nullableNumber(els.effect.value);
    if (effectType === null || effectType === 99) {
      els.effectLevel.value = "";
      els.effectLevel.min = "1";
      els.effectLevel.max = "";
      els.effectLevel.disabled = true;
      return;
    }

    const maxLevel = maxEffectLevel(effectType);
    els.effectLevel.min = "1";
    els.effectLevel.max = String(maxLevel);
    els.effectLevel.value = String(maxLevel);
    els.effectLevel.disabled = maxLevel <= 0;
  }

  function clampEffectLevel() {
    const min = Number(els.effectLevel.min || 1);
    const max = Number(els.effectLevel.max || 0);
    if (els.effectLevel.disabled) return;
    const current = Number(els.effectLevel.value || 0);
    els.effectLevel.value = String(Math.max(min, Math.min(max, current)));
  }

  function searcherTrialCount() {
    return Math.max(1, Math.trunc(Number(els.simulationCount?.value) || 1));
  }

  function searchTarget() {
    const effectType = nullableNumber(els.effect.value);
    const effectLevel = nullableNumber(els.effectLevel.value);
    return {
      weaponType: Number(els.weaponType.value),
      styleId: nullableNumber(els.style.value),
      areaName: nullableString(els.area.value),
      effectType,
      minEffectValue: effectType === null || effectType === 99 ? null : effectLevel,
    };
  }

  function targetStyleName(stats) {
    const id = stats?.target?.styleId;
    return id === null || id === undefined ? null : enumLabel(enums, "LianSuo_FG", id, String(id));
  }

  function targetAreaName(stats) {
    return stats?.target?.areaName || null;
  }

  function targetEffectText(stats) {
    const target = stats?.target || {};
    if (target.effectType === null || target.effectType === undefined) return null;
    const name = effectNames.get(Number(target.effectType)) || `效果 ${target.effectType}`;
    if (Number(target.effectType) === 99) return name;
    const minLevel = Number(target.minEffectValue || 0);
    return minLevel > 0 ? `${name}>=${minLevel}` : name;
  }

  function renderInitialBadges(initial) {
    return `
      ${resultBadge("风格", initial.style.name, "is-initial")}
      ${resultBadge("范围", initial.area.name, "is-initial")}
      ${resultBadge("特殊效果", effectText(initial.effect, effectNames), "is-initial")}
      ${resultBadge("改良", initial.gailiangkongjian, "is-initial")}
    `;
  }

  function renderEstimateBadges(stats) {
    const badges = [];
    const styleName = targetStyleName(stats);
    const areaName = targetAreaName(stats);
    const effectName = targetEffectText(stats);
    if (styleName) badges.push(resultBadge(styleName, formatPercent(stats?.styleProbability), "is-estimate"));
    if (areaName) badges.push(resultBadge(areaName, formatPercent(stats?.areaProbability), "is-estimate"));
    if (effectName) badges.push(resultBadge(effectName, formatPercent(stats?.effectProbability), "is-estimate"));
    badges.push(resultBadge("威力均值", formatMean(stats?.averagePower), "is-estimate"));
    badges.push(resultBadge("最大威力", formatMean(stats?.maxPower), "is-estimate"));
    badges.push(resultBadge("真气均值", formatMean(stats?.averageCost), "is-estimate"));
    return badges.join("");
  }

  function renderRoute(route) {
    const initial = route.initial;
    const stats = searcherStats(route);
    return `
      <article class="searcher-result-card">
        <div class="searcher-result-meta">
          <span>四维：${escapeHtml(routeAttributes(route))}</span>
          <span>初始种子：${escapeHtml(route.seed)}</span>
          <span>模拟次数：${escapeHtml(stats.trials || 0)}</span>
        </div>
        <div class="searcher-result-row">
          <strong>初始：</strong>
          <div class="searcher-badge-list">${renderInitialBadges(initial)}</div>
        </div>
        <div class="searcher-result-row">
          <strong>结果：</strong>
          <div class="searcher-badge-list">${renderEstimateBadges(stats)}</div>
        </div>
      </article>
    `;
  }

  function renderResults() {
    const availableFields = availableSortFields(state.matches);
    if (!availableFields.includes(state.sortPrimary)) {
      state.sortPrimary = availableFields[0] || "improveSpace";
    }
    const results = sortSearcherMatches(state.matches, state.sortPrimary);
    if (!results.length) {
      els.results.innerHTML = `<div class="empty-state">没有可用的初始组合。</div>`;
      return;
    }

    const best = Math.max(...results.map((route) => Number(route.match?.matchedCount || 0)));
    const targetCount = results[0]?.match?.targetCount || 0;
    const pageCount = Math.max(1, Math.ceil(results.length / SEARCHER_PAGE_SIZE));
    state.page = Math.max(1, Math.min(state.page, pageCount));
    const start = (state.page - 1) * SEARCHER_PAGE_SIZE;
    const visible = results.slice(start, start + SEARCHER_PAGE_SIZE);
    els.results.innerHTML = `
      <div class="searcher-result-head">
        <span>共 ${results.length} 个初始输入，${targetCount > 0 ? `最高初始命中 ${best} / ${targetCount}，` : ""}第 ${state.page} / ${pageCount} 页</span>
        <div class="searcher-result-actions">
          <button type="button" data-searcher-page="prev" ${state.page <= 1 ? "disabled" : ""}>上一页</button>
          <button type="button" data-searcher-page="next" ${state.page >= pageCount ? "disabled" : ""}>下一页</button>
          <button type="button" data-searcher-sort-cycle>排序：${escapeHtml(sortFieldLabel(state.sortPrimary))}</button>
        </div>
      </div>
      ${visible.map((route) => renderRoute(route)).join("")}
    `;
  }

  async function searchRoutes() {
    const trials = searcherTrialCount();
    els.status.textContent = `估算中...每个初始输入 ${trials} 次试验`;
    setButtonBusy(els.searchButton, true, "搜索中");
    await waitForPaint();
    try {
      state.matches = await searchSelfCreateInitials(searchTarget(), data, {
        styleNames: enums.LianSuo_FG,
        trials,
        comboYieldEvery: 4,
        yieldToMain: waitForPaint,
        onProgress({ current, total }) {
          els.status.textContent = `搜索中...${current} / ${total}`;
        },
      });
      state.page = 1;
      els.status.textContent = "";
      renderResults();
    } catch (error) {
      els.status.textContent = `估算失败：${error.message}`;
    } finally {
      setButtonBusy(els.searchButton, false);
    }
  }

  els.weaponType.innerHTML = weaponOptions(enums);
  els.style.innerHTML = styleOptions(data, enums);
  els.effect.innerHTML = effectOptions(data, effects);
  renderAreaOptions();
  updateEffectLevelControl();

  els.weaponType.addEventListener("change", renderAreaOptions);
  els.effect.addEventListener("change", updateEffectLevelControl);
  els.effectLevel.addEventListener("input", clampEffectLevel);
  els.effectLevel.addEventListener("change", clampEffectLevel);
  els.searchButton.addEventListener("click", searchRoutes);
  els.results.addEventListener("click", (event) => {
    const sortButton = event.target.closest("[data-searcher-sort-cycle]");
    if (sortButton) {
      state.sortPrimary = nextSortPrimary(state.sortPrimary, state.matches);
      state.page = 1;
      renderResults();
      return;
    }

    const pageButton = event.target.closest("[data-searcher-page]");
    if (!pageButton) return;
    state.page += pageButton.dataset.searcherPage === "next" ? 1 : -1;
    renderResults();
  });

  if (!WEAPON_TYPE_IDS.includes(Number(els.weaponType.value))) {
    els.weaponType.value = String(WEAPON_TYPE_IDS[0]);
  }
}
