import { initSelfCreateSearcher } from "./searcher-page.js";
import { initSelfCreateSimulator } from "./simulator-page.js";
import { enumMapFromRows, groupBy, queryRows } from "../../shared/wiki-db.js";
import { escapeHtml } from "./view-utils.js";

async function loadEnums() {
  const rows = await queryRows("SELECT type, id, label FROM enums ORDER BY type, id");
  return enumMapFromRows(rows);
}

async function loadSelfCreateTables() {
  const [templates, templateEffects, styleWeights, powerRanges, effectRates, effects, enums] = await Promise.all([
    queryRows("SELECT * FROM custom_martial_arts ORDER BY id"),
    queryRows("SELECT * FROM custom_martial_art_effects ORDER BY custom_martial_art_id, slot"),
    queryRows("SELECT * FROM custom_style_weights ORDER BY id"),
    queryRows("SELECT * FROM custom_martial_power_ranges ORDER BY id"),
    queryRows("SELECT * FROM custom_martial_effect_rates ORDER BY id"),
    queryRows("SELECT id, name, value_per_level AS valuePerLevel, template FROM status_effects ORDER BY id"),
    loadEnums(),
  ]);
  const effectsByTemplate = groupBy(templateEffects, "custom_martial_art_id");

  const data = {
    wugongRows: templates.map((row) => {
      const effectSlots = new Map((effectsByTemplate.get(row.id) || []).map((item) => [Number(item.slot), item]));
      const output = {
        chnname: row.name,
        type: Number(row.type_id),
        rare: Number(row.rarity_id),
        cost: Number(row.cost),
        slashfx: Number(row.slash_effect_id),
        hitfx: Number(row.hit_effect_id),
        attackareaname: row.attack_area_name,
        iszichuang: Boolean(Number(row.is_custom)),
      };
      for (let slot = 1; slot <= 3; slot += 1) {
        const effect = effectSlots.get(slot);
        output[`buff${slot}`] = effect ? Number(effect.effect_id) : 99;
        output[`bufftarget${slot}`] = effect ? Number(effect.target_id) : 1;
      }
      return output;
    }),
    chainRows: styleWeights.map((row) => ({ fengge: Number(row.style_id), qty: Number(row.weight) })),
    ziChuangWeiLiRows: powerRanges.map((row) => ({
      bingqitype: Number(row.weapon_type_id),
      rare: Number(row.rarity_id),
      cost: Number(row.cost),
      weilimin: Number(row.power_min),
      weilimax: Number(row.power_max),
      percentmin: Number(row.percent_min),
      percentmax: Number(row.percent_max),
    })),
    ziChuangBuffRows: effectRates.map((row) => ({
      rare: Number(row.rarity_id),
      bufftype: Number(row.effect_id),
      bufftarget: Number(row.target_id),
      value: Number(row.level),
      percent: Number(row.percent),
    })),
  };

  return {
    data,
    enums,
    effects: effects.map((row) => ({
      id: Number(row.id),
      name: row.name,
      valuePerLevel: row.valuePerLevel === null ? null : Number(row.valuePerLevel),
      template: row.template,
    })),
    effectNames: new Map(effects.map((item) => [Number(item.id), item.name])),
  };
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
  return loadSelfCreateTables();
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
