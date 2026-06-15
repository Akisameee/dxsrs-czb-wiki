import { CustomMartialArtSimulation } from "./simulator";
import { UnityRandom } from "./unity-random";
import {
  effectIdentityMatches,
  effectMatches,
  initialMatch,
  normalizeCustomMartialArtTarget,
  summaryMatches,
} from "./target";
import type {
  CustomMartialDensityPoint,
  CustomMartialDistributionSummary,
  CustomMartialFinalValueDistributions,
  CustomMartialStats,
  CustomMartialSummary,
  CustomMartialTargetInput,
  CustomMartialTrialResult,
  NormalizedCustomMartialTarget,
} from "./types";

type GreedyImprovementOptions = {
  from?: "current" | "initial";
  seed?: number | string;
  rng?: UnityRandom;
  maxSteps?: number | string;
  styleNames?: Record<string, string>;
};

type EstimateStatsOptions = GreedyImprovementOptions & {
  trials?: number | string;
  yieldEvery?: number | string;
  yieldToMain?: (() => void | Promise<void>) | null;
  seedBase?: number | string;
  seeds?: Array<number | string>;
  includeSamples?: boolean;
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function finiteNonNegativeInteger(value: unknown, fallback: number) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.trunc(number));
}

function snapshotFor(simulation: CustomMartialArtSimulation, from: "current" | "initial" = "current") {
  if (from === "initial") return simulation.history[0];
  return simulation.history.at(-1);
}

function cloneSimulationAt(simulation: CustomMartialArtSimulation, options: GreedyImprovementOptions = {}) {
  const snapshot = clone(snapshotFor(simulation, options.from));
  if (!snapshot) throw new Error("缺少自创武学模拟快照");
  const copy = new CustomMartialArtSimulation(simulation.input, simulation.data);
  copy.rng = options.rng instanceof UnityRandom
    ? options.rng
    : new UnityRandom(Number(options.seed ?? simulation.seed));
  copy.zichuang = snapshot.zichuang;
  copy.gWuGong = snapshot.gWuGong;
  copy.detail = snapshot.detail;
  copy.history = [snapshot];
  return copy;
}

export function greedyLocksForTarget(
  summary: CustomMartialSummary | null,
  targetInput: CustomMartialTargetInput,
) {
  const target = normalizeCustomMartialArtTarget(targetInput);
  return {
    fenggelock: target.styleId === null || Number(summary?.style?.id) === target.styleId,
    arealock: target.areaName === null || summary?.area?.name === target.areaName,
    bufflock: effectMatches(summary?.effect || {}, target),
  };
}

export function runGreedyImprovementTrial(
  simulation: CustomMartialArtSimulation,
  targetInput: CustomMartialTargetInput,
  options: GreedyImprovementOptions = {},
): CustomMartialTrialResult {
  const styleNames = options.styleNames || {};
  const maxSteps = Number.isFinite(Number(options.maxSteps))
    ? finiteNonNegativeInteger(options.maxSteps, 0)
    : Infinity;
  const trial = cloneSimulationAt(simulation, {
    from: options.from || "current",
    seed: options.seed,
    rng: options.rng,
  });
  let steps = 0;

  while (trial.canImprove && steps < maxSteps) {
    const before = trial.currentSummary(styleNames);
    trial.improve(greedyLocksForTarget(before, targetInput));
    steps += 1;
  }

  const final = trial.currentSummary(styleNames);
  return {
    seed: options.seed === undefined ? null : Number(options.seed),
    steps,
    success: summaryMatches(final, targetInput),
    match: initialMatch(final, targetInput),
    final,
    route: trial.toRoute(styleNames),
  };
}

function targetStyleHits(summary: CustomMartialSummary | null, target: NormalizedCustomMartialTarget) {
  return target.styleId === null || Number(summary?.style?.id) === target.styleId;
}

function targetAreaHits(summary: CustomMartialSummary | null, target: NormalizedCustomMartialTarget) {
  return target.areaName === null || summary?.area?.name === target.areaName;
}

function targetEffectHits(summary: CustomMartialSummary | null, target: NormalizedCustomMartialTarget) {
  if (
    target.effectType === null &&
    target.effectTarget === null &&
    target.effectValue === null &&
    target.minEffectValue === null
  ) {
    return true;
  }

  return effectMatches(summary?.effect || {}, target);
}

function targetEffectWeightedLevel(summary: CustomMartialSummary | null, target: NormalizedCustomMartialTarget) {
  if (
    target.effectType === null &&
    target.effectTarget === null
  ) {
    return Number(summary?.effect?.value || 0);
  }

  if (!effectIdentityMatches(summary?.effect || {}, target)) return 0;

  if (target.effectType === 99) return 1;
  return Number(summary?.effect?.value || 0);
}

export async function estimateGreedyImprovementStats(
  simulation: CustomMartialArtSimulation,
  targetInput: CustomMartialTargetInput,
  options: EstimateStatsOptions = {},
): Promise<CustomMartialStats> {
  const trials = Math.max(1, finiteNonNegativeInteger(options.trials, 256));
  const yieldEvery = finiteNonNegativeInteger(options.yieldEvery, 0);
  const yieldToMain = typeof options.yieldToMain === "function" ? options.yieldToMain : null;
  const seedBase = Number(options.seedBase ?? 1);
  const seeds = Array.isArray(options.seeds) && options.seeds.length > 0 ? options.seeds : null;
  const styleNames = options.styleNames || {};
  const target = normalizeCustomMartialArtTarget(targetInput);
  const distribution = new Map<string, number>();

  let success = 0;
  let styleHits = 0;
  let areaHits = 0;
  let effectHits = 0;
  let effectWeightedLevelSum = 0;
  let powerSum = 0;
  let costSum = 0;
  let maxPower = 0;
  const powerValues: number[] = [];
  const costValues: number[] = [];
  const finalPercentValues: number[] = [];
  let finalPercentSum = 0;
  let maxFinalPercent = 0;
  let improveSpaceSum = 0;
  let totalSteps = 0;
  let bestMatchCount = 0;

  for (let index = 0; index < trials; index += 1) {
    const seed = seeds ? Number(seeds[index % seeds.length]) : seedBase + index;
    const result = runGreedyImprovementTrial(simulation, target, {
      from: options.from || "current",
      maxSteps: options.maxSteps,
      styleNames,
      seed,
    });
    const final = result.final;
    const matchedCount = Number(result.match.matchedCount || 0);
    const key = `${matchedCount}/${result.match.targetCount}`;

    if (result.success) success += 1;
    if (targetStyleHits(final, target)) styleHits += 1;
    if (targetAreaHits(final, target)) areaHits += 1;
    if (targetEffectHits(final, target)) effectHits += 1;
    effectWeightedLevelSum += targetEffectWeightedLevel(final, target);
    const power = Number(final?.power || 0);
    const cost = Number(final?.cost || 0);
    const finalPercent = Number(final?.percent || 0);
    finalPercentValues.push(finalPercent);
    finalPercentSum += finalPercent;
    maxFinalPercent = Math.max(maxFinalPercent, finalPercent);
    costValues.push(cost);
    costSum += cost;
    if (result.success) {
      powerValues.push(power);
      powerSum += power;
      maxPower = Math.max(maxPower, power);
    }
    improveSpaceSum += Number(final?.gailiangkongjian || 0);
    totalSteps += result.steps;
    bestMatchCount = Math.max(bestMatchCount, matchedCount);
    distribution.set(key, (distribution.get(key) || 0) + 1);

    if (yieldToMain && yieldEvery > 0 && (index + 1) % yieldEvery === 0) {
      await yieldToMain();
    }
  }

  const powerSummary = distributionSummary(powerValues);
  const costSummary = distributionSummary(costValues);

  const stats: CustomMartialStats = {
    trials,
    success,
    probability: success / trials,
    styleHitCount: styleHits,
    styleProbability: styleHits / trials,
    areaHitCount: areaHits,
    areaProbability: areaHits / trials,
    effectHitCount: effectHits,
    effectProbability: effectHits / trials,
    effectWeightedLevel: effectWeightedLevelSum / trials,
    averagePower: powerValues.length ? powerSum / powerValues.length : 0,
    medianPower: powerSummary.median,
    maxPower,
    averageCost: costSum / trials,
    powerSummary,
    costSummary,
    averageFinalPercent: finalPercentSum / trials,
    maxFinalPercent,
    averageImproveSpace: improveSpaceSum / trials,
    averageSteps: totalSteps / trials,
    bestMatchCount,
    distribution: Object.fromEntries(distribution),
    target,
  };

  if (options.includeSamples) {
    stats.samples = {
      power: powerValues,
      cost: costValues,
      finalPercent: finalPercentValues,
    };
  }

  return stats;
}

function quantile(sortedValues: number[], percentile: number) {
  if (!sortedValues.length) return 0;
  const index = (sortedValues.length - 1) * percentile;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sortedValues[lower] ?? 0;
  const weight = index - lower;
  return (sortedValues[lower] ?? 0) * (1 - weight) + (sortedValues[upper] ?? 0) * weight;
}

function distributionSummary(values: number[]): CustomMartialDistributionSummary {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) {
    return {
      min: 0,
      q1: 0,
      median: 0,
      q3: 0,
      max: 0,
      mean: 0,
    };
  }

  const sum = sorted.reduce((total, value) => total + value, 0);
  return {
    min: sorted[0] ?? 0,
    q1: quantile(sorted, 0.25),
    median: quantile(sorted, 0.5),
    q3: quantile(sorted, 0.75),
    max: sorted.at(-1) ?? 0,
    mean: sum / sorted.length,
  };
}

function standardDeviation(values: number[], mean: number) {
  if (values.length <= 1) return 0;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function gaussianKernel(value: number) {
  return Math.exp(-0.5 * value * value) / Math.sqrt(2 * Math.PI);
}

function densityPoints(values: number[], maxPoints = 160): CustomMartialDensityPoint[] {
  const samples = values.map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  if (!samples.length) return [];
  const min = samples[0] ?? 0;
  const max = samples.at(-1) ?? 0;
  if (min === max) {
    return [{ x: min, y: 100 }];
  }

  const mean = samples.reduce((sum, value) => sum + value, 0) / samples.length;
  const deviation = standardDeviation(samples, mean);
  const range = max - min;
  const bandwidth = Math.max(range / 80, 1.06 * deviation * samples.length ** -0.2, 1);
  const start = min - bandwidth * 2;
  const end = max + bandwidth * 2;
  const count = Math.max(24, maxPoints);
  const step = (end - start) / (count - 1);

  return Array.from({ length: count }, (_, index) => {
    const x = start + step * index;
    const density = samples.reduce((sum, sample) => sum + gaussianKernel((x - sample) / bandwidth), 0) / (samples.length * bandwidth);
    return {
      x,
      y: density * 100,
    };
  });
}

function massPoints(values: number[]): CustomMartialDensityPoint[] {
  const samples = values.map(Number).filter(Number.isFinite);
  if (!samples.length) return [];
  const counts = new Map<number, number>();
  for (const sample of samples) {
    counts.set(sample, (counts.get(sample) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([x, count]) => ({
      x,
      y: (count / samples.length) * 100,
    }));
}

export function summarizeFinalValueDistributions(
  powerValues: Array<number | string>,
  costValues: Array<number | string>,
  finalPercentValues: Array<number | string> = [],
): CustomMartialFinalValueDistributions {
  const powers = powerValues.map(Number).filter(Number.isFinite);
  const costs = costValues.map(Number).filter(Number.isFinite);
  const finalPercents = finalPercentValues.map(Number).filter(Number.isFinite);
  return {
    trials: Math.max(powers.length, costs.length, finalPercents.length),
    averageFinalPercent: finalPercents.length ? finalPercents.reduce((sum, value) => sum + value, 0) / finalPercents.length : 0,
    averagePower: powers.length ? powers.reduce((sum, value) => sum + value, 0) / powers.length : 0,
    averageCost: costs.length ? costs.reduce((sum, value) => sum + value, 0) / costs.length : 0,
    finalPercentSummary: distributionSummary(finalPercents),
    powerSummary: distributionSummary(powers),
    costSummary: distributionSummary(costs),
    finalPercentDensity: densityPoints(finalPercents),
    powerDensity: densityPoints(powers),
    costMass: massPoints(costs),
  };
}
