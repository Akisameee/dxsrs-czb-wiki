import assert from "node:assert/strict";
import fs from "node:fs";
import { SelfCreateSimulation } from "../src/tools/self-create/simulator.js";
import { makeZiChuangSeed } from "../src/tools/self-create/unity-random.js";

const data = JSON.parse(fs.readFileSync(new URL("../public/data/self_create.json", import.meta.url), "utf8"));

const forumSwordInput = {
  yi: 6,
  qi: 1,
  xing: 6,
  shen: 7,
  weaponType: 2,
  name: "自创武功",
  improvements: [],
};

const simulation = new SelfCreateSimulation(forumSwordInput, data);
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

console.log("self-create regression passed");
