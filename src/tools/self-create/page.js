import { simulateZiChuang, summarizeZiChuangStep } from "./simulator.js";
import { enumLabel, getRareMeta } from "../../shared/utils.js";

const WEAPON_TYPE_IDS = [0, 1, 2, 3, 4, 5];

const els = {
  form: document.getElementById("self-create-form"),
  status: document.getElementById("self-create-status"),
  weaponType: document.getElementById("weapon-type"),
  steps: document.getElementById("improve-steps"),
  lockRows: document.getElementById("lock-rows"),
  result: document.getElementById("self-create-result"),
};

const state = {
  data: null,
  enums: {},
  effectNames: new Map(),
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

function toNumber(formData, key) {
  return Number(formData.get(key));
}

function effectText(effect) {
  if (Number(effect.bufftype) === 99) return "无特殊效果";
  const name = state.effectNames.get(Number(effect.bufftype)) || `效果 ${effect.bufftype}`;
  return `${name}(${effect.value})`;
}

function rareText(rare) {
  const meta = getRareMeta(rare, state.enums);
  return enumLabel(state.enums, "WuGongRare", rare, meta.label);
}

function renderWeaponOptions() {
  const selected = els.weaponType.value;
  els.weaponType.innerHTML = WEAPON_TYPE_IDS
    .map((id) => `<option value="${id}">${escapeHtml(enumLabel(state.enums, "BingQiType", id, String(id)))}</option>`)
    .join("");
  if (selected !== "") els.weaponType.value = selected;
}

function renderLockRows() {
  const count = Math.max(0, Math.min(20, Number(els.steps.value) || 0));
  els.steps.value = count;
  els.lockRows.innerHTML = Array.from({ length: count }, (_, index) => {
    const step = index + 1;
    return `
      <div class="lock-row" data-step="${step}">
        <strong>第 ${step} 次</strong>
        <label class="checkbox-field">
          <input type="checkbox" data-lock="fenggelock">
          <span>锁风格</span>
        </label>
        <label class="checkbox-field">
          <input type="checkbox" data-lock="arealock">
          <span>锁范围</span>
        </label>
        <label class="checkbox-field">
          <input type="checkbox" data-lock="bufflock">
          <span>锁效果</span>
        </label>
      </div>
    `;
  }).join("");
}

function collectImprovements() {
  return [...els.lockRows.querySelectorAll(".lock-row")].map((row) => {
    const locks = {};
    for (const input of row.querySelectorAll("[data-lock]")) {
      locks[input.dataset.lock] = input.checked;
    }
    return locks;
  });
}

function renderSummary(summary) {
  if (!summary.length) {
    els.result.innerHTML = `<div class="empty-state">填写参数后点击模拟。</div>`;
    return;
  }

  els.result.innerHTML = summary.map((step, index) => {
    const title = step.action === "create" ? "初始自创" : `第 ${index} 次改良`;
    const changed = step.changed
      ? [
          step.changed.rare ? "品质变化" : "",
          step.changed.style ? "风格变化" : "",
          step.changed.area ? "范围变化" : "",
          step.changed.effect ? "效果变化" : "",
        ].filter(Boolean).join("，") || "词条未变"
      : "创建结果";
    return `
      <article class="timeline-card">
        <header>
          <strong>${escapeHtml(title)}</strong>
          <span>${escapeHtml(rareText(step.rare))}</span>
        </header>
        <div class="result-grid">
          <div>
            <span>风格</span>
            <strong>${escapeHtml(step.style.name)}</strong>
          </div>
          <div>
            <span>攻击范围</span>
            <strong>${escapeHtml(step.area.name)}</strong>
          </div>
          <div>
            <span>效果</span>
            <strong>${escapeHtml(effectText(step.effect))}</strong>
          </div>
          <div>
            <span>威力</span>
            <strong>${escapeHtml(step.power)}</strong>
          </div>
          <div>
            <span>percent</span>
            <strong>${escapeHtml(step.percent)}</strong>
          </div>
          <div>
            <span>改良空间</span>
            <strong>${escapeHtml(step.gailiangkongjian)}</strong>
          </div>
        </div>
        <p class="timeline-note">${escapeHtml(changed)}</p>
      </article>
    `;
  }).join("");
}

async function loadData() {
  const [selfCreate, effects, enums] = await Promise.all([
    fetch(dataUrl("self_create.json")).then((response) => response.json()),
    fetch(dataUrl("status_effects.json")).then((response) => response.json()),
    fetch(dataUrl("enums.json")).then((response) => response.json()),
  ]);

  state.data = selfCreate;
  state.enums = enums.enumTypes || {};
  state.effectNames = new Map(effects.map((item, index) => [Number(item.id ?? index), item.name]));
  renderWeaponOptions();
  els.status.textContent = "数据已读取";
}

function runSimulation() {
  if (!state.data) return;
  const formData = new FormData(els.form);
  const input = {
    name: formData.get("name") || "自创武功",
    yi: toNumber(formData, "yi"),
    qi: toNumber(formData, "qi"),
    xing: toNumber(formData, "xing"),
    shen: toNumber(formData, "shen"),
    weaponType: toNumber(formData, "weaponType"),
    improvements: collectImprovements(),
  };

  const simulation = simulateZiChuang(input, state.data);
  const summary = simulation.history.map((step) => (
    summarizeZiChuangStep(step, state.enums.LianSuo_FG)
  ));
  els.status.textContent = `seed ${simulation.zichuang.seed}`;
  renderSummary(summary);
}

renderWeaponOptions();
renderLockRows();

els.steps.addEventListener("input", renderLockRows);
els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  runSimulation();
});

loadData()
  .then(runSimulation)
  .catch((error) => {
    els.status.textContent = "数据读取失败";
    els.result.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
  });
