import { BASIC_STYLE, JIANGHU_SECT, PENGLAI_SECT } from "../../shared/constants.js?v=20260607-01";

export function getPenglaiModifier(sectCounts) {
  const count = sectCounts.get(PENGLAI_SECT) || 0;
  if (count >= 4) {
    return { active: true, minimum: 2, decrease: 1 };
  }
  if (count >= 2) {
    return { active: true, minimum: 3, decrease: 1 };
  }
  return { active: false, minimum: Infinity, decrease: 0 };
}

export function getEffectiveRequirement(chain, groupName, groupType, penglaiModifier) {
  const original = Number(chain.count);
  const isPenglaiSelf = groupType === "sect" && groupName === PENGLAI_SECT;
  const affected = penglaiModifier.active && !isPenglaiSelf && original >= penglaiModifier.minimum;
  const effective = affected ? Math.max(1, original - penglaiModifier.decrease) : original;
  return { original, effective, affected };
}

export function isChainMet(count, requirement, groupName, groupType, basicUnlocked) {
  if (groupType === "sect" && groupName === JIANGHU_SECT && !basicUnlocked) {
    return count === requirement;
  }
  return count >= requirement;
}

function getChainNodeAt(requirements, value) {
  const nodes = requirements.filter((item) => item.requirement.effective === value);
  return nodes.sort((a, b) => Number(b.chain.count) - Number(a.chain.count))[0] || null;
}

function getChainBlockState(value, displayCount, node, activeChain) {
  const reached = value <= displayCount;
  if (!reached) return node ? "empty-node" : "empty";
  if (!node) return "progress";
  return activeChain?.chain === node.chain ? "active-node" : "reached-node";
}

export function evaluateChainState({ chains, count, groupName, groupType, penglaiModifier, basicUnlocked }) {
  const requirements = chains.map((chain) => ({
    chain,
    requirement: getEffectiveRequirement(chain, groupName, groupType, penglaiModifier),
  }));
  const activeChain = requirements
    .filter((item) => isChainMet(count, item.requirement.effective, groupName, groupType, basicUnlocked))
    .sort((a, b) => {
      if (a.requirement.effective !== b.requirement.effective) {
        return b.requirement.effective - a.requirement.effective;
      }
      return Number(b.chain.count) - Number(a.chain.count);
    })[0] || null;
  const maxRequirement = Math.max(...requirements.map((item) => item.requirement.effective));
  const exactLimitedInvalid = groupType === "sect" && groupName === JIANGHU_SECT && !basicUnlocked && !activeChain;
  const displayCount = exactLimitedInvalid ? 0 : Math.min(count, maxRequirement);
  const blocks = Array.from({ length: maxRequirement }, (_, index) => {
    const value = index + 1;
    const node = getChainNodeAt(requirements, value);
    return {
      value,
      node,
      state: getChainBlockState(value, displayCount, node, activeChain),
      effect: node?.chain.effect || null,
    };
  });
  const activeChainModel = activeChain
    ? { chain: activeChain.chain, requirement: activeChain.requirement }
    : null;

  return {
    level: activeChain ? Number(activeChain.chain.count) : 0,
    met: Boolean(activeChain),
    activeChain: activeChainModel,
    activeEffect: activeChain?.chain.effect || "",
    displayCount,
    blocks,
  };
}

export function evaluateChainView(record, penglaiModifier, basicUnlocked) {
  return {
    ...record,
    ...evaluateChainState({
      chains: record.chains,
      count: record.count,
      groupName: record.groupName,
      groupType: record.groupType,
      penglaiModifier,
      basicUnlocked,
    }),
  };
}

export function hasMetChain(record, count, groupKey, groupType, penglaiModifier, basicUnlocked) {
  const groupName = record[groupKey];
  return evaluateChainState({
    chains: record.chains,
    count,
    groupName,
    groupType,
    penglaiModifier,
    basicUnlocked,
  }).met;
}

export function isBasicChainUnlocked(styleChains, styleCounts, penglaiModifier) {
  const basicRecord = styleChains.find((record) => record.style === BASIC_STYLE);
  if (!basicRecord) return false;
  return hasMetChain(basicRecord, styleCounts.get(BASIC_STYLE) || 0, "style", "style", penglaiModifier, false);
}

export function buildVisibleChainRecords(sectChains, styleChains, sectCounts, styleCounts, penglaiModifier, basicUnlocked) {
  const sectRecords = sectChains
    .map((record) => ({
      ...record,
      groupName: record.sect,
      groupType: "sect",
      count: sectCounts.get(record.sect) || 0,
    }))
    .filter((record) => record.count >= 1);

  const styleRecords = styleChains
    .map((record) => ({
      ...record,
      groupName: record.style,
      groupType: "style",
      count: styleCounts.get(record.style) || 0,
    }))
    .filter((record) => record.count >= 1);

  return [...sectRecords, ...styleRecords]
    .map((record) => evaluateChainView(record, penglaiModifier, basicUnlocked))
    .sort((a, b) => {
      if (a.met !== b.met) return a.met ? -1 : 1;
      if (a.count !== b.count) return b.count - a.count;
      if (a.groupType !== b.groupType) return a.groupType === "sect" ? -1 : 1;
      return a.groupName.localeCompare(b.groupName, "zh-Hans-CN");
    });
}
