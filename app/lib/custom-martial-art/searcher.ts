import { CustomMartialArtSimulation } from "./simulator";
import { estimateGreedyImprovementStats } from "./probability";
import {
  initialMatch,
  normalizeCustomMartialArtTarget,
} from "./target";
import type {
  CustomMartialAlgorithmData,
  CustomMartialInput,
  CustomMartialSearchResult,
  CustomMartialTargetInput,
  NormalizedCustomMartialSearchTarget,
} from "./types";

const ATTRIBUTE_TOTAL = 20;
const ATTRIBUTE_MAX = 10;
const ATTRIBUTE_NAMES = ["yi", "qi", "xing", "shen"];

type SearchOptions = {
  styleNames?: Record<string, string>;
  trials?: number | string;
  probabilityTrials?: number | string;
  seedBase?: number | string;
  seeds?: Array<number | string>;
  maxSteps?: number | string;
  attributeTotal?: number;
  attributeMax?: number;
  comboYieldEvery?: number | string;
  yieldToMain?: (() => void | Promise<void>) | null;
  onProgress?: (progress: {
    current: number;
    total: number;
    results: CustomMartialSearchResult[];
  }) => void;
};

type AttributeCombo = Pick<CustomMartialInput, "yi" | "qi" | "xing" | "shen">;

function numberOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeTarget(target: CustomMartialTargetInput): NormalizedCustomMartialSearchTarget {
  const normalized = normalizeCustomMartialArtTarget(target);
  return {
    weaponType: numberOrNull(target.weaponType),
    ...normalized,
  };
}

function* attributeCombos(total = ATTRIBUTE_TOTAL, max = ATTRIBUTE_MAX): Generator<AttributeCombo> {
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

export async function searchCustomMartialArtInitials(
  targetInput: CustomMartialTargetInput,
  data: CustomMartialAlgorithmData,
  options: SearchOptions = {},
): Promise<CustomMartialSearchResult[]> {
  const target = normalizeTarget(targetInput);
  if (target.weaponType === null) {
    throw new Error("weaponType 是必填项");
  }

  const styleNames = options.styleNames || data?.styleNames || data?.enumTypes?.LianSuo_FG || {};
  const probabilityOptions = {
    trials: options.trials ?? options.probabilityTrials ?? 128,
    seedBase: options.seedBase ?? 1,
    seeds: options.seeds,
    maxSteps: options.maxSteps,
    styleNames,
  };
  const results: CustomMartialSearchResult[] = [];
  const combos = [...attributeCombos(options.attributeTotal ?? ATTRIBUTE_TOTAL, options.attributeMax ?? ATTRIBUTE_MAX)];
  const comboYieldEvery = Math.max(1, Number(options.comboYieldEvery || 8));
  const yieldToMain = typeof options.yieldToMain === "function" ? options.yieldToMain : null;

  for (const [index, attributes] of combos.entries()) {
    const simulation = new CustomMartialArtSimulation(
      { ...attributes, weaponType: target.weaponType, name: "自创武功" },
      data,
    );
    const route = simulation.toRoute(styleNames);
    const match = initialMatch(route.initial, target);
    const stats = await estimateGreedyImprovementStats(simulation, target, probabilityOptions);
    results.push({
      ...route,
      match,
      stats,
    } as CustomMartialSearchResult);

    if (typeof options.onProgress === "function") {
      options.onProgress({
        current: index + 1,
        total: combos.length,
        results,
      });
    }

    if (yieldToMain && (index + 1) % comboYieldEvery === 0) {
      await yieldToMain();
    }
  }

  return results;
}

export { attributeCombos, initialMatch };
export { searchCustomMartialArtInitials as searchSelfCreateInitials };
