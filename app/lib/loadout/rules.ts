import type {
  LoadoutChainGroup,
  LoadoutChainGroupType,
  LoadoutChainRecordInput,
  LoadoutChainRequirement,
  LoadoutChainStateBlock,
  LoadoutPassiveChainRecord,
  LoadoutRequirementNode,
  LoadoutVisibleChainRecord,
  PenglaiModifier,
} from "./types";

const PENGLAI_SECT_ID = 7;
const JIANGHU_SECT_ID = 12;
const BASIC_STYLE_ID = 19;

export function getPenglaiModifier(sectCounts: Map<number, number>): PenglaiModifier {
  const count = sectCounts.get(PENGLAI_SECT_ID) || 0;
  if (count >= 4) {
    return { active: true, minimum: 2, decrease: 1 };
  }
  if (count >= 2) {
    return { active: true, minimum: 3, decrease: 1 };
  }
  return { active: false, minimum: Infinity, decrease: 0 };
}

export function getEffectiveRequirement(
  chain: LoadoutPassiveChainRecord,
  groupName: number | string | undefined,
  groupType: LoadoutChainGroupType,
  penglaiModifier: PenglaiModifier,
): LoadoutChainRequirement {
  const original = Number(chain.count);
  const isPenglaiSelf = groupType === "sect" && Number(groupName) === PENGLAI_SECT_ID;
  const affected = penglaiModifier.active && !isPenglaiSelf && original >= penglaiModifier.minimum;
  const effective = affected ? Math.max(1, original - penglaiModifier.decrease) : original;
  return { original, effective, affected };
}

export function isChainMet(
  count: number,
  requirement: number,
  groupName: number | string | undefined,
  groupType: LoadoutChainGroupType,
  basicUnlocked: boolean,
) {
  if (groupType === "sect" && Number(groupName) === JIANGHU_SECT_ID && !basicUnlocked) {
    return count === requirement;
  }
  return count >= requirement;
}

function getChainNodeAt(requirements: LoadoutRequirementNode[], value: number) {
  const nodes = requirements.filter((item) => item.requirement.effective === value);
  return nodes.sort((a, b) => Number(b.chain.count) - Number(a.chain.count))[0] || null;
}

function getChainBlockState(
  value: number,
  displayCount: number,
  node: LoadoutRequirementNode | null,
  activeChain: LoadoutRequirementNode | null,
) {
  const reached = value <= displayCount;
  if (!reached) return node ? "empty-node" : "empty";
  if (!node) return "progress";
  return activeChain?.chain === node.chain ? "active-node" : "reached-node";
}

export function evaluateChainState({
  chains,
  count,
  groupName,
  groupType,
  penglaiModifier,
  basicUnlocked,
}: {
  chains: LoadoutPassiveChainRecord[];
  count: number;
  groupName: number | string | undefined;
  groupType: LoadoutChainGroupType;
  penglaiModifier: PenglaiModifier;
  basicUnlocked: boolean;
}) {
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
  const exactLimitedInvalid = groupType === "sect" && Number(groupName) === JIANGHU_SECT_ID && !basicUnlocked && !activeChain;
  const displayCount = exactLimitedInvalid ? 0 : Math.min(count, maxRequirement);
  const blocks: LoadoutChainStateBlock[] = Array.from({ length: maxRequirement }, (_, index) => {
    const value = index + 1;
    const node = getChainNodeAt(requirements, value);
    return {
      value,
      node,
      state: getChainBlockState(value, displayCount, node, activeChain),
      effect: node?.chain.effect || null,
      effectParts: node?.chain.effectParts || [],
    };
  });

  return {
    level: activeChain ? Number(activeChain.chain.count) : 0,
    met: Boolean(activeChain),
    activeChain,
    activeEffect: activeChain?.chain.effect || "",
    activeEffectParts: activeChain?.chain.effectParts || [],
    displayCount,
    blocks,
  };
}

export function evaluateChainView(
  record: LoadoutChainRecordInput,
  penglaiModifier: PenglaiModifier,
  basicUnlocked: boolean,
): LoadoutVisibleChainRecord {
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

export function hasMetChain(
  record: LoadoutChainGroup,
  count: number,
  groupKey: "sectId" | "styleId",
  groupType: LoadoutChainGroupType,
  penglaiModifier: PenglaiModifier,
  basicUnlocked: boolean,
) {
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

export function isBasicChainUnlocked(
  styleChains: LoadoutChainGroup[],
  styleCounts: Map<number, number>,
  penglaiModifier: PenglaiModifier,
) {
  const basicRecord = styleChains.find((record) => Number(record.styleId) === BASIC_STYLE_ID);
  if (!basicRecord) return false;
  return hasMetChain(basicRecord, styleCounts.get(BASIC_STYLE_ID) || 0, "styleId", "style", penglaiModifier, false);
}

export function buildVisibleChainRecords(
  sectChains: LoadoutChainGroup[],
  styleChains: LoadoutChainGroup[],
  sectCounts: Map<number, number>,
  styleCounts: Map<number, number>,
  penglaiModifier: PenglaiModifier,
  basicUnlocked: boolean,
) {
  const sectRecords: LoadoutChainRecordInput[] = sectChains
    .map((record) => ({
      ...record,
      groupName: record.sectId,
      groupType: "sect" as const,
      count: sectCounts.get(Number(record.sectId)) || 0,
    }))
    .filter((record) => record.count >= 1);

  const styleRecords: LoadoutChainRecordInput[] = styleChains
    .map((record) => ({
      ...record,
      groupName: record.styleId,
      groupType: "style" as const,
      count: styleCounts.get(Number(record.styleId)) || 0,
    }))
    .filter((record) => record.count >= 1);

  return [...sectRecords, ...styleRecords]
    .map((record) => evaluateChainView(record, penglaiModifier, basicUnlocked))
    .sort((a, b) => {
      if (a.met !== b.met) return a.met ? -1 : 1;
      const idDiff = Number(a.groupName) - Number(b.groupName);
      if (idDiff !== 0) return idDiff;
      return a.groupType === b.groupType ? 0 : a.groupType === "sect" ? -1 : 1;
    });
}
