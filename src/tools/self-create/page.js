import { initSelfCreateSearcher } from "./searcher-page.js";
import { initSelfCreateSimulator } from "./simulator-page.js";
import { escapeHtml } from "./view-utils.js";

const DATA_ROOT = document.body.dataset.dataRoot || "data/";

function dataUrl(path) {
  return new URL(`${DATA_ROOT}${path}`, window.location.href);
}

function stepNumberInput(input, direction) {
  const step = Number(input.step) || 1;
  const min = input.min === "" ? -Infinity : Number(input.min);
  const max = input.max === "" ? Infinity : Number(input.max);
  const current = Number(input.value) || 0;
  const next = Math.min(max, Math.max(min, current + direction * step));
  input.value = String(next);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function addWheelNumberSupport(input) {
  input.addEventListener("wheel", (event) => {
    if (input.disabled) return;
    event.preventDefault();
    stepNumberInput(input, event.deltaY < 0 ? 1 : -1);
  }, { passive: false });
}

async function loadData() {
  const [selfCreate, effects, enums] = await Promise.all([
    fetch(dataUrl("self_create.json")).then((response) => response.json()),
    fetch(dataUrl("status_effects.json")).then((response) => response.json()),
    fetch(dataUrl("enums.json")).then((response) => response.json()),
  ]);

  return {
    data: selfCreate,
    enums: enums.enumTypes || {},
    effects,
    effectNames: new Map(effects.map((item, index) => [Number(item.id ?? index), item.name])),
  };
}

loadData()
  .then((context) => {
    initSelfCreateSimulator(context);
    initSelfCreateSearcher(context);
    for (const input of document.querySelectorAll("input[type='number']")) {
      addWheelNumberSupport(input);
    }
  })
  .catch((error) => {
    const status = document.getElementById("self-create-status");
    const preview = document.getElementById("self-create-preview");
    status.textContent = "数据读取失败";
    preview.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
  });
