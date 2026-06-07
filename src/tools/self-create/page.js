import { runSelfCreateRoute } from "./simulator.js";
import { describeLockOperation, findSelfCreateRoutes } from "./generator.js";
import { enumLabel, getRareMeta } from "../../shared/utils.js";

const WEAPON_TYPE_IDS = [0, 1, 2, 3, 4, 5];
const ATTRIBUTE_TOTAL = 20;
const ATTRIBUTE_NAMES = ["yi", "qi", "xing", "shen"];
const DEFAULT_GENERATOR_SORT = ["effectLevel", "power", "cost", "totalExp"];
const GENERATOR_SORT_FIELDS = [
  { id: "effectLevel", label: "特殊效果层数" },
  { id: "power", label: "招式威力" },
  { id: "cost", label: "消耗真气" },
  { id: "totalExp", label: "总武学经验" },
];
const GENERATOR_PAGE_SIZE = 20;

const els = {
  form: document.getElementById("self-create-form"),
  status: document.getElementById("self-create-status"),
  attributeTotal: document.getElementById("attribute-total"),
  weaponType: document.getElementById("weapon-type"),
  preview: document.getElementById("self-create-preview"),
  improveButton: document.getElementById("improve-button"),
  undoButton: document.getElementById("undo-button"),
  resetButton: document.getElementById("reset-button"),
  generatorStatus: document.getElementById("generator-status"),
  generatorWeaponType: document.getElementById("generator-weapon-type"),
  generatorStyle: document.getElementById("generator-style"),
  generatorArea: document.getElementById("generator-area"),
  generatorEffect: document.getElementById("generator-effect"),
  generatorSearchButton: document.getElementById("generator-search-button"),
  generatorResults: document.getElementById("generator-results"),
};

const initialInputs = [];

const state = {
  data: null,
  enums: {},
  effectNames: new Map(),
  improvements: [],
  initialImproveLimit: 0,
  remainingImproveCount: 0,
  seed: null,
  currentLocks: {
    fenggelock: false,
    arealock: false,
    bufflock: false,
  },
  summary: [],
  effects: [],
  generatorRoutes: [],
  generatorSortPrimary: "effectLevel",
  generatorPage: 1,
};

const DATA_ROOT = document.body.dataset.dataRoot || "data/";

function dataUrl(path) {
  return new URL(`${DATA_ROOT}${path}`, window.location.href);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function controlNumber(name) {
  return Number(els.form.elements[name]?.value);
}

function effectText(effect) {
  if (Number(effect.bufftype) === 99) return "无特殊效果";
  const name = state.effectNames.get(Number(effect.bufftype)) || `效果 ${effect.bufftype}`;
  return `${name}(${effect.value})`;
}

function rowsOf(table) {
  return Array.isArray(table) ? table : table?.rows || [];
}

function rareText(rare) {
  const meta = getRareMeta(rare, state.enums);
  return enumLabel(state.enums, "WuGongRare", rare, meta.label);
}

function rareClass(rare) {
  return getRareMeta(rare, state.enums).className;
}

function renderWeaponOptions() {
  const selected = els.weaponType.value;
  const options = WEAPON_TYPE_IDS
    .map((id) => `<option value="${id}">${escapeHtml(enumLabel(state.enums, "BingQiType", id, String(id)))}</option>`)
    .join("");
  els.weaponType.innerHTML = options;
  els.generatorWeaponType.innerHTML = options;
  if (selected !== "") els.weaponType.value = selected;
}

function uniqueSorted(items) {
  return [...new Set(items.filter((item) => item !== null && item !== undefined && item !== ""))]
    .sort((a, b) => String(a).localeCompare(String(b), "zh-Hans-CN"));
}

function styleOptions() {
  const ids = uniqueSorted(rowsOf(state.data?.chainRows)
    .map((row) => Number(row.fengge))
    .filter((id) => id > 0));
  return ids.map((id) => `<option value="${id}">${escapeHtml(enumLabel(state.enums, "LianSuo_FG", id, String(id)))}</option>`).join("");
}

function areaOptions(weaponType) {
  const areas = uniqueSorted(rowsOf(state.data?.wugongRows)
    .filter((row) => Number(row.type) === Number(weaponType) && !row.iszichuang && row.attackareaname && row.attackareaname !== "无")
    .map((row) => row.attackareaname));
  return areas.map((area) => `<option value="${escapeHtml(area)}">${escapeHtml(area)}</option>`).join("");
}

function effectOptions() {
  const available = new Set(rowsOf(state.data?.ziChuangBuffRows).map((row) => Number(row.bufftype)));
  available.add(99);
  return state.effects
    .filter((effect) => available.has(Number(effect.id)))
    .map((effect) => `<option value="${Number(effect.id)}">${escapeHtml(effect.name)}</option>`)
    .join("");
}

function renderGeneratorOptions() {
  els.generatorWeaponType.innerHTML = WEAPON_TYPE_IDS
    .map((id) => `<option value="${id}">${escapeHtml(enumLabel(state.enums, "BingQiType", id, String(id)))}</option>`)
    .join("");
  els.generatorStyle.innerHTML = styleOptions();
  els.generatorEffect.innerHTML = effectOptions();
  renderAreaOptions();
}

function renderAreaOptions() {
  const selected = els.generatorArea.value;
  els.generatorArea.innerHTML = areaOptions(els.generatorWeaponType.value);
  if ([...els.generatorArea.options].some((option) => option.value === selected)) {
    els.generatorArea.value = selected;
  }
}

function numberInput(name) {
  return els.form.querySelector(`[name='${name}']`);
}

function attributeTotal() {
  return ATTRIBUTE_NAMES
    .map((name) => Number(numberInput(name).value) || 0)
    .reduce((sum, value) => sum + value, 0);
}

function isAttributeTotalValid() {
  return attributeTotal() === ATTRIBUTE_TOTAL;
}

function updateAttributeTotal() {
  const total = attributeTotal();
  const seedText = state.seed === null || total !== ATTRIBUTE_TOTAL ? "" : `，seed ${state.seed}`;
  els.attributeTotal.textContent = `四维 ${total} / ${ATTRIBUTE_TOTAL}${seedText}`;
  els.attributeTotal.classList.toggle("is-invalid", total !== ATTRIBUTE_TOTAL);
}

function currentLocks() {
  return { ...state.currentLocks };
}

function lockButton(key) {
  const locked = Boolean(state.currentLocks[key]);
  return `
    <button
      class="result-lock ${locked ? "is-locked" : ""}"
      type="button"
      data-toggle-lock="${key}"
      aria-pressed="${locked}"
    >
      ${locked ? "解锁" : "锁定"}
    </button>
  `;
}

function renderStat(label, value, lockKey = null, className = "") {
  return `
    <div class="game-stat-row ${className}">
      <span class="game-stat-label">${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      ${lockKey ? lockButton(lockKey) : ""}
    </div>
  `;
}

function sortOrder(primary) {
  if (!DEFAULT_GENERATOR_SORT.includes(primary)) return DEFAULT_GENERATOR_SORT;
  return [primary, ...DEFAULT_GENERATOR_SORT.filter((field) => field !== primary)];
}

function sortValue(route, field) {
  switch (field) {
    case "effectLevel":
      return Number(route.final?.effect?.value || 0);
    case "power":
      return Number(route.final?.power || 0);
    case "cost":
      return -Number(route.final?.cost || 0);
    case "totalExp":
      return -Number(route.totalExp || 0);
    default:
      return 0;
  }
}

function sortGeneratorRoutes(routes) {
  const order = sortOrder(state.generatorSortPrimary);
  return [...routes].sort((a, b) => {
    for (const field of order) {
      const diff = sortValue(b, field) - sortValue(a, field);
      if (diff !== 0) return diff;
    }
    return Number(a.seed || 0) - Number(b.seed || 0);
  });
}

function sortFieldLabel(fieldId) {
  return GENERATOR_SORT_FIELDS.find((field) => field.id === fieldId)?.label || "特殊效果层数";
}

function nextSortPrimary() {
  const index = DEFAULT_GENERATOR_SORT.indexOf(state.generatorSortPrimary);
  return DEFAULT_GENERATOR_SORT[(index + 1) % DEFAULT_GENERATOR_SORT.length];
}

function routeTitle(route, index) {
  const attrs = ATTRIBUTE_NAMES.map((name) => `${route.input[name]}`).join("/");
  return `#${index + 1} 四维 ${attrs}，seed ${route.seed}`;
}

function renderStep(step) {
  return `
    <li>
      <span>第 ${step.index} 次：${escapeHtml(describeLockOperation(step.locks))}</span>
      <strong>${escapeHtml(step.result.style.name)} / ${escapeHtml(step.result.area.name)} / ${escapeHtml(effectText(step.result.effect))}</strong>
      <em>威力 ${escapeHtml(step.result.power)}，真气 ${escapeHtml(step.result.cost)}</em>
    </li>
  `;
}

function renderRoute(route, index) {
  const final = route.final;
  const steps = route.steps.map(renderStep).join("");
  return `
    <details class="generator-result-card">
      <summary>
        <strong>${escapeHtml(routeTitle(route, index))}</strong>
        <span>${escapeHtml(effectText(final.effect))}</span>
        <span>威力 ${escapeHtml(final.power)}</span>
        <span>真气 ${escapeHtml(final.cost)}</span>
        <span>${escapeHtml(rareText(final.rare))}</span>
      </summary>
      <div class="generator-route-detail">
        <div class="generator-final-grid">
          <span>初始：${escapeHtml(route.initial.style.name)} / ${escapeHtml(route.initial.area.name)} / ${escapeHtml(effectText(route.initial.effect))}</span>
          <span>最终：${escapeHtml(final.style.name)} / ${escapeHtml(final.area.name)} / ${escapeHtml(effectText(final.effect))}</span>
          <span>改良：${escapeHtml(route.initialImproveLimit)} 次</span>
        </div>
        <ol class="generator-step-list">${steps}</ol>
      </div>
    </details>
  `;
}

function renderGeneratorResults() {
  const routes = sortGeneratorRoutes(state.generatorRoutes);
  if (!routes.length) {
    els.generatorResults.innerHTML = `<div class="empty-state">没有找到满足目标的轨迹。</div>`;
    return;
  }

  const pageCount = Math.max(1, Math.ceil(routes.length / GENERATOR_PAGE_SIZE));
  state.generatorPage = Math.max(1, Math.min(state.generatorPage, pageCount));
  const start = (state.generatorPage - 1) * GENERATOR_PAGE_SIZE;
  const visible = routes.slice(start, start + GENERATOR_PAGE_SIZE);
  els.generatorResults.innerHTML = `
    <div class="generator-result-head">
      <span>共 ${routes.length} 条，第 ${state.generatorPage} / ${pageCount} 页</span>
      <div class="generator-result-actions">
        <button type="button" data-generator-page="prev" ${state.generatorPage <= 1 ? "disabled" : ""}>上一页</button>
        <button type="button" data-generator-page="next" ${state.generatorPage >= pageCount ? "disabled" : ""}>下一页</button>
        <button type="button" data-generator-sort-cycle>排序：${escapeHtml(sortFieldLabel(state.generatorSortPrimary))}</button>
      </div>
    </div>
    ${visible.map((route, index) => renderRoute(route, start + index)).join("")}
  `;
}

function renderPreview(summary) {
  const current = summary.at(-1);
  if (!current) {
    els.preview.innerHTML = `<div class="empty-state">填写参数后点击模拟。</div>`;
    return;
  }

  const typeName = enumLabel(state.enums, "BingQiType", Number(els.weaponType.value), "未知");
  const currentRareClass = rareClass(current.rare);
  els.preview.className = `form-card current-result-card ${currentRareClass}`;
  els.preview.innerHTML = `
    <div class="game-result-body">
      ${renderStat("武功品阶", rareText(current.rare), null, `is-rare ${currentRareClass}`)}
      ${renderStat("武功类型", typeName)}
      ${renderStat("风格", current.style.name, "fenggelock")}
      ${renderStat("攻击范围", current.area.name, "arealock")}
      ${renderStat("招式威力", current.power)}
      ${renderStat("消耗真气", current.cost ?? "未知")}
      ${renderStat("特殊效果", effectText(current.effect), "bufflock", "is-effect")}
      ${renderStat("改良空间", current.gailiangkongjian)}
    </div>
  `;
}

function updateButtons() {
  const canUse = Boolean(state.data);
  const initialLocked = state.improvements.length > 0;
  const current = state.summary.at(-1);
  const hasImproveSpace = Number(current?.gailiangkongjian ?? 0) > 0;
  const totalValid = isAttributeTotalValid();
  updateAttributeTotal();
  els.improveButton.disabled = !canUse || !totalValid || !hasImproveSpace || state.remainingImproveCount <= 0;
  els.undoButton.disabled = !canUse || state.improvements.length === 0;
  els.resetButton.disabled = !canUse;
  for (const input of initialInputs) {
    input.disabled = initialLocked;
    input.title = initialLocked ? "回退到 0 次改良或重置后才能修改" : "";
  }
}

function renderCurrent(summary) {
  state.summary = summary;
  if (!summary.length) {
    renderPreview(summary);
    updateButtons();
    return;
  }

  renderPreview(summary);
  updateButtons();
}

async function loadData() {
  const [selfCreate, effects, enums] = await Promise.all([
    fetch(dataUrl("self_create.json")).then((response) => response.json()),
    fetch(dataUrl("status_effects.json")).then((response) => response.json()),
    fetch(dataUrl("enums.json")).then((response) => response.json()),
  ]);

  state.data = selfCreate;
  state.enums = enums.enumTypes || {};
  state.effects = effects;
  state.effectNames = new Map(effects.map((item, index) => [Number(item.id ?? index), item.name]));
  renderWeaponOptions();
  renderGeneratorOptions();
  els.status.textContent = "";
}

function buildInput() {
  return {
    name: "自创武功",
    yi: controlNumber("yi"),
    qi: controlNumber("qi"),
    xing: controlNumber("xing"),
    shen: controlNumber("shen"),
    weaponType: controlNumber("weaponType"),
    improvements: state.improvements,
  };
}

function runSimulation() {
  if (!state.data) return;
  if (!isAttributeTotalValid()) {
    state.summary = [];
    state.initialImproveLimit = 0;
    state.remainingImproveCount = 0;
    state.seed = null;
    els.status.textContent = "";
    els.preview.className = "form-card current-result-card";
    els.preview.innerHTML = `<div class="empty-state">四维总和必须为 ${ATTRIBUTE_TOTAL} 后才能自创。</div>`;
    updateButtons();
    return;
  }
  const route = runSelfCreateRoute(buildInput(), state.data, {
    styleNames: state.enums.LianSuo_FG,
  });
  const summary = route.summaries;
  state.initialImproveLimit = route.initialImproveLimit;
  state.remainingImproveCount = route.remainingImproveCount;
  state.seed = route.seed;
  els.status.textContent = "";
  renderCurrent(summary);
}

function resetSimulation() {
  state.improvements = [];
  state.initialImproveLimit = 0;
  state.remainingImproveCount = 0;
  state.seed = null;
  state.currentLocks = {
    fenggelock: false,
    arealock: false,
    bufflock: false,
  };
  runSimulation();
}

function handleInitialInputChange() {
  updateAttributeTotal();
  resetSimulation();
}

function stepAttributeInput(input, direction) {
  const step = Number(input.step) || 1;
  const min = input.min === "" ? -Infinity : Number(input.min);
  const max = input.max === "" ? Infinity : Number(input.max);
  const current = Number(input.value) || 0;
  const next = Math.min(max, Math.max(min, current + direction * step));
  input.value = String(next);
  handleInitialInputChange();
}

function improveOnce() {
  if (state.remainingImproveCount <= 0) return;
  state.improvements.push(currentLocks());
  runSimulation();
}

function undoImprove() {
  state.improvements.pop();
  runSimulation();
}

function generatorTarget() {
  return {
    weaponType: Number(els.generatorWeaponType.value),
    styleId: Number(els.generatorStyle.value),
    areaName: els.generatorArea.value,
    effectType: Number(els.generatorEffect.value),
  };
}

function searchGeneratorRoutes() {
  if (!state.data) return;
  els.generatorStatus.textContent = "搜索中...";
  state.generatorRoutes = findSelfCreateRoutes(generatorTarget(), state.data, {
    styleNames: state.enums.LianSuo_FG,
  });
  state.generatorPage = 1;
  els.generatorStatus.textContent = "";
  renderGeneratorResults();
}

renderWeaponOptions();
updateButtons();

els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  resetSimulation();
});
initialInputs.push(...els.form.querySelectorAll("[name='yi'], [name='qi'], [name='xing'], [name='shen'], [name='weaponType']"));
for (const input of initialInputs) {
  const eventName = ATTRIBUTE_NAMES.includes(input.name) ? "input" : "change";
  input.addEventListener(eventName, () => {
    handleInitialInputChange();
  });
  if (ATTRIBUTE_NAMES.includes(input.name)) {
    input.addEventListener("wheel", (event) => {
      if (input.disabled) return;
      event.preventDefault();
      stepAttributeInput(input, event.deltaY < 0 ? 1 : -1);
    }, { passive: false });
  }
}
els.improveButton.addEventListener("click", improveOnce);
els.undoButton.addEventListener("click", undoImprove);
els.resetButton.addEventListener("click", resetSimulation);
els.generatorWeaponType.addEventListener("change", () => {
  renderAreaOptions();
});
els.generatorSearchButton.addEventListener("click", searchGeneratorRoutes);
els.generatorResults.addEventListener("click", (event) => {
  const sortButton = event.target.closest("[data-generator-sort-cycle]");
  if (sortButton) {
    state.generatorSortPrimary = nextSortPrimary();
    state.generatorPage = 1;
    renderGeneratorResults();
    return;
  }

  const pageButton = event.target.closest("[data-generator-page]");
  if (!pageButton) return;
  state.generatorPage += pageButton.dataset.generatorPage === "next" ? 1 : -1;
  renderGeneratorResults();
});
els.preview.addEventListener("click", (event) => {
  const button = event.target.closest("[data-toggle-lock]");
  if (!button) return;
  const key = button.dataset.toggleLock;
  state.currentLocks[key] = !state.currentLocks[key];
  renderPreview(state.summary);
});

loadData()
  .then(runSimulation)
  .catch((error) => {
    els.status.textContent = "数据读取失败";
    els.preview.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
  });
