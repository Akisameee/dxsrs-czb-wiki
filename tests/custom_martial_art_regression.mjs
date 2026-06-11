import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { CustomMartialArtSimulation } from "../app/lib/custom-martial-art/simulator.js";
import { makeZiChuangSeed } from "../app/lib/custom-martial-art/unity-random.js";

const db = new DatabaseSync(new URL("../public/data/wiki.sqlite", import.meta.url));

function all(sql) {
  return db.prepare(sql).all();
}

function loadCustomMartialArtData() {
  const enums = {};
  for (const row of all("SELECT type, id, label FROM enums ORDER BY type, id")) {
    if (!enums[row.type]) enums[row.type] = {};
    enums[row.type][String(row.id)] = row.label;
  }

  const effectsByTemplate = new Map();
  for (const row of all("SELECT * FROM custom_martial_art_effects ORDER BY custom_martial_art_id, slot")) {
    if (!effectsByTemplate.has(row.custom_martial_art_id)) effectsByTemplate.set(row.custom_martial_art_id, []);
    effectsByTemplate.get(row.custom_martial_art_id).push(row);
  }

  return {
    wugongRows: all("SELECT * FROM custom_martial_arts ORDER BY id").map((row) => {
      const effects = new Map((effectsByTemplate.get(row.id) || []).map((item) => [Number(item.slot), item]));
      const output = {
        chnname: enums.MartialArt?.[String(row.id)] || `武学 ${row.id}`,
        type: Number(row.type_id),
        rare: Number(row.rarity_id),
        cost: Number(row.cost),
        slashfx: Number(row.slash_effect_id),
        hitfx: Number(row.hit_effect_id),
        attackareaname: enums.AttackArea?.[String(row.attack_area_id)] || "",
        iszichuang: Boolean(Number(row.is_custom)),
      };
      for (let slot = 1; slot <= 3; slot += 1) {
        const effect = effects.get(slot);
        output[`buff${slot}`] = effect ? Number(effect.effect_id) : 99;
        output[`bufftarget${slot}`] = effect ? Number(effect.target_id) : 1;
      }
      return output;
    }),
    chainRows: all("SELECT * FROM custom_style_weights ORDER BY id").map((row) => ({
      fengge: Number(row.style_id),
      qty: Number(row.weight),
    })),
    ziChuangWeiLiRows: all("SELECT * FROM custom_martial_power_ranges ORDER BY id").map((row) => ({
      bingqitype: Number(row.weapon_type_id),
      rare: Number(row.rarity_id),
      cost: Number(row.cost),
      weilimin: Number(row.power_min),
      weilimax: Number(row.power_max),
      percentmin: Number(row.percent_min),
      percentmax: Number(row.percent_max),
    })),
    ziChuangBuffRows: all("SELECT * FROM custom_martial_effect_rates ORDER BY id").map((row) => ({
      rare: Number(row.rarity_id),
      bufftype: Number(row.effect_id),
      bufftarget: Number(row.target_id),
      value: Number(row.level),
      percent: Number(row.percent),
    })),
  };
}

const data = loadCustomMartialArtData();

const forumSwordInput = {
  yi: 6,
  qi: 1,
  xing: 6,
  shen: 7,
  weaponType: 2,
  name: "自创武功",
  improvements: [],
};

const simulation = new CustomMartialArtSimulation(forumSwordInput, data);
const route = simulation.toRoute();

assert.equal(makeZiChuangSeed(forumSwordInput), 41793, "6/1/6/7 剑法 seed 应稳定为 41793");
assert.equal(route.seed, 41793, "route seed 应和输入 seed 一致");
assert.equal(route.initialImproveLimit, 20, "6/1/6/7 剑法样本应有 20 次改良空间");
assert.equal(route.initial.style.id, 6, "初始风格应稳定为致命");
assert.equal(route.initial.area.name, "基础刀剑", "初始攻击范围应稳定为基础刀剑");
assert.equal(route.initial.effect.bufftype, 99, "初始特殊效果应稳定为无");
assert.equal(route.initial.effect.value, 0, "无特殊效果时层数应为 0");
assert.equal(route.initial.power, 429.12, "初始招式威力应稳定为 429.12");
assert.equal(route.initial.cost, 3, "初始消耗真气应稳定为 3");

db.close();
console.log("custom martial art regression passed");
