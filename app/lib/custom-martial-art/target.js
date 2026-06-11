function numberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function stringOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  return String(value);
}

export function normalizeCustomMartialArtTarget(target = {}) {
  return {
    styleId: numberOrNull(target.styleId ?? target.style),
    areaName: stringOrNull(target.areaName ?? target.attackArea),
    effectType: numberOrNull(target.effectType ?? target.bufftype ?? target.effect),
    effectTarget: numberOrNull(target.effectTarget ?? target.bufftarget),
    effectValue: numberOrNull(target.effectValue ?? target.effectLevel ?? target.value),
    minEffectValue: numberOrNull(target.minEffectValue ?? target.effectMinValue),
  };
}

export function effectIdentityMatches(effect, targetInput) {
  const target = normalizeCustomMartialArtTarget(targetInput);
  if (target.effectType !== null && Number(effect.bufftype) !== target.effectType) return false;
  if (target.effectTarget !== null && Number(effect.bufftarget) !== target.effectTarget) return false;
  return true;
}

export function effectMatches(effect, targetInput) {
  const target = normalizeCustomMartialArtTarget(targetInput);
  if (!effectIdentityMatches(effect, target)) return false;
  if (target.effectValue !== null && Number(effect.value) !== target.effectValue) return false;
  if (target.minEffectValue !== null && Number(effect.value) < target.minEffectValue) return false;
  return true;
}

export function summaryMatches(summary, targetInput) {
  const target = normalizeCustomMartialArtTarget(targetInput);
  if (target.styleId !== null && Number(summary?.style?.id) !== target.styleId) return false;
  if (target.areaName !== null && summary?.area?.name !== target.areaName) return false;
  if (
    target.effectType !== null ||
    target.effectTarget !== null ||
    target.effectValue !== null ||
    target.minEffectValue !== null
  ) {
    return effectMatches(summary?.effect || {}, target);
  }
  return true;
}

export function initialMatch(summary, targetInput) {
  const target = normalizeCustomMartialArtTarget(targetInput);
  const items = [];

  if (target.styleId !== null) {
    items.push({
      id: "style",
      label: "风格",
      matched: Number(summary?.style?.id) === target.styleId,
    });
  }

  if (target.areaName !== null) {
    items.push({
      id: "area",
      label: "范围",
      matched: summary?.area?.name === target.areaName,
    });
  }

  if (
    target.effectType !== null ||
    target.effectTarget !== null ||
    target.effectValue !== null ||
    target.minEffectValue !== null
  ) {
    items.push({
      id: "effect",
      label: "效果",
      matched: effectMatches(summary?.effect || {}, target),
    });
  }

  return {
    matchedCount: items.filter((item) => item.matched).length,
    targetCount: items.length,
    items,
  };
}

export { normalizeCustomMartialArtTarget as normalizeSelfCreateTarget };
