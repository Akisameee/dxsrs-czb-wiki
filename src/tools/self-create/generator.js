import { runSelfCreateRoute } from "./simulator.js";

const ATTRIBUTE_TOTAL = 20;
const ATTRIBUTE_MAX = 10;
const ATTRIBUTE_NAMES = ["yi", "qi", "xing", "shen"];

function numberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function stringOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  return String(value);
}

function normalizeTarget(target) {
  return {
    weaponType: numberOrNull(target.weaponType),
    styleId: numberOrNull(target.styleId ?? target.style),
    areaName: stringOrNull(target.areaName ?? target.attackArea),
    effectType: numberOrNull(target.effectType ?? target.bufftype ?? target.effect),
    effectTarget: numberOrNull(target.effectTarget ?? target.bufftarget),
  };
}

function effectMatches(effect, target) {
  if (target.effectType !== null && Number(effect.bufftype) !== target.effectType) return false;
  if (target.effectTarget !== null && Number(effect.bufftarget) !== target.effectTarget) return false;
  return true;
}

function summaryMatchesTarget(summary, target) {
  if (!summary) return false;
  if (target.styleId !== null && Number(summary.style.id) !== target.styleId) return false;
  if (target.areaName !== null && summary.area.name !== target.areaName) return false;
  return effectMatches(summary.effect, target);
}

function greedyLocks(summary, target) {
  return {
    fenggelock: target.styleId === null || Number(summary.style.id) === target.styleId,
    arealock: target.areaName === null || summary.area.name === target.areaName,
    bufflock: effectMatches(summary.effect, target),
  };
}

function* attributeCombos(total = ATTRIBUTE_TOTAL, max = ATTRIBUTE_MAX) {
  for (let yi = 0; yi <= max; yi += 1) {
    for (let qi = 0; qi <= max; qi += 1) {
      for (let xing = 0; xing <= max; xing += 1) {
        const shen = total - yi - qi - xing;
        if (shen < 0 || shen > max) continue;
        yield { yi, qi, xing, shen };
      }
    }
  }
}

function routeForInitial(input, target, data, styleNames) {
  const route = runSelfCreateRoute(input, data, {
    styleNames,
    getLocks: ({ before }) => greedyLocks(before, target),
  });
  if (!summaryMatchesTarget(route.final, target)) return null;
  return route;
}

export function findSelfCreateRoutes(targetInput, data, options = {}) {
  const target = normalizeTarget(targetInput);
  if (target.weaponType === null) {
    throw new Error("weaponType 是必填项");
  }

  const styleNames = options.styleNames || data?.styleNames || data?.enumTypes?.LianSuo_FG || {};
  const results = [];

  for (const attributes of attributeCombos(options.attributeTotal ?? ATTRIBUTE_TOTAL, options.attributeMax ?? ATTRIBUTE_MAX)) {
    const route = routeForInitial(
      { ...attributes, weaponType: target.weaponType, name: "自创武功" },
      target,
      data,
      styleNames
    );
    if (!route) continue;

    results.push(route);
  }

  return results;
}

export function describeLockOperation(locks) {
  const parts = [];
  parts.push(`风格${locks.fenggelock ? "锁定" : "解锁"}`);
  parts.push(`范围${locks.arealock ? "锁定" : "解锁"}`);
  parts.push(`效果${locks.bufflock ? "锁定" : "解锁"}`);
  return parts.join("，");
}

export { attributeCombos, greedyLocks, summaryMatchesTarget };
