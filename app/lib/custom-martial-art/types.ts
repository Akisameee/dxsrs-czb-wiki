export type CustomMartialNumber = number | string | null | undefined;

export type CustomMartialInput = {
  name?: string;
  weaponType: CustomMartialNumber;
  yi: CustomMartialNumber;
  qi: CustomMartialNumber;
  xing: CustomMartialNumber;
  shen: CustomMartialNumber;
};

export type CustomMartialTargetInput = {
  weaponType?: CustomMartialNumber;
  styleId?: CustomMartialNumber;
  style?: CustomMartialNumber;
  areaName?: string | null;
  attackArea?: string | null;
  effectType?: CustomMartialNumber;
  bufftype?: CustomMartialNumber;
  effect?: CustomMartialNumber;
  effectTarget?: CustomMartialNumber;
  bufftarget?: CustomMartialNumber;
  effectValue?: CustomMartialNumber;
  effectLevel?: CustomMartialNumber;
  value?: CustomMartialNumber;
  minEffectValue?: CustomMartialNumber;
  effectMinValue?: CustomMartialNumber;
};

export type NormalizedCustomMartialTarget = {
  styleId: number | null;
  areaName: string | null;
  effectType: number | null;
  effectTarget: number | null;
  effectValue: number | null;
  minEffectValue: number | null;
};

export type NormalizedCustomMartialSearchTarget = NormalizedCustomMartialTarget & {
  weaponType: number | null;
};

export type CustomMartialAlgorithmMartialRow = {
  chnname?: string;
  type: number | string;
  rare: number | string;
  cost: number | string;
  slashfx: number | string;
  hitfx: number | string;
  attackareaname: string;
  iszichuang: boolean;
  liansuo_fg1?: number | string | null;
  liansuo_fg2?: number | string | null;
  buff1?: number | string | null;
  bufftarget1?: number | string | null;
  buff2?: number | string | null;
  bufftarget2?: number | string | null;
  huodefangfa?: string;
};

export type CustomStyleWeightRow = {
  fengge: number | string;
  qty: number | string;
};

export type CustomPowerRangeRow = {
  bingqitype: number | string;
  rare: number | string;
  cost: number | string;
  weilimin: number | string;
  weilimax: number | string;
  percentmin: number | string;
  percentmax: number | string;
};

export type CustomBuffRow = {
  rare?: number | string;
  bufftype: number | string;
  bufftarget?: number | string;
  value?: number | string | null;
  percent?: number | string;
};

export type CustomMartialAlgorithmData = {
  wugongRows: CustomMartialAlgorithmMartialRow[];
  chainRows: CustomStyleWeightRow[];
  ziChuangWeiLiRows: CustomPowerRangeRow[];
  ziChuangBuffRows: CustomBuffRow[];
  styleNames?: Record<string, string>;
  enumTypes?: {
    LianSuo_FG?: Record<string, string>;
  };
};

export type CustomMartialZichuangState = {
  seed: number;
  percent: number;
  percentTarget: number;
  gailiangkongjian: number;
  fenggelock: boolean;
  arealock: boolean;
  bufflock: boolean;
  rare: number;
};

export type CustomMartialDetail = {
  power: number;
  b1value: number;
};

export type CustomMartialLocks = {
  fenggelock?: boolean;
  arealock?: boolean;
  bufflock?: boolean;
  styleLock?: boolean;
  areaLock?: boolean;
  effectLock?: boolean;
};

export type CustomMartialChanged = {
  rare: boolean;
  style: boolean;
  area: boolean;
  effect: boolean;
};

export type CustomMartialHistoryStep = {
  action: string;
  locks?: CustomMartialLocks;
  changed?: CustomMartialChanged;
  zichuang: CustomMartialZichuangState;
  gWuGong: CustomMartialAlgorithmMartialRow;
  detail: CustomMartialDetail;
};

export type CustomMartialEffectSummary = {
  bufftype?: number | string | null;
  bufftarget?: number | string | null;
  value?: number | string | null;
};

export type CustomMartialSummary = {
  action: string;
  locks: CustomMartialLocks | null;
  changed: CustomMartialChanged | null;
  rare: number | string;
  percent: number;
  percentTarget: number;
  gailiangkongjian: number;
  style: {
    id: number | string | null | undefined;
    name: string;
  };
  area: {
    name: string;
    slashfx: number | string;
    hitfx: number | string;
  };
  effect: CustomMartialEffectSummary;
  cost: number | string;
  power: number;
};

export type CustomMartialRoute = {
  input: CustomMartialInput;
  seed: number;
  initialImproveLimit: number;
  remainingImproveCount: number;
  initial: CustomMartialSummary | null;
  steps: Array<{
    index: number;
    locks: CustomMartialLocks;
    result: CustomMartialSummary;
  }>;
  final: CustomMartialSummary | null;
  summaries: CustomMartialSummary[];
  simulation: unknown;
};

export type CustomMartialMatchItem = {
  id: "style" | "area" | "effect";
  label: string;
  matched: boolean;
};

export type CustomMartialMatch = {
  matchedCount: number;
  targetCount: number;
  items: CustomMartialMatchItem[];
};

export type CustomMartialTrialResult = {
  seed: number | null;
  steps: number;
  success: boolean;
  match: CustomMartialMatch;
  final: CustomMartialSummary | null;
  route: CustomMartialRoute;
};

export type CustomMartialStats = {
  trials: number;
  success: number;
  probability: number;
  styleHitCount: number;
  styleProbability: number;
  areaHitCount: number;
  areaProbability: number;
  effectHitCount: number;
  effectProbability: number;
  effectWeightedLevel: number;
  averagePower: number;
  medianPower: number;
  maxPower: number;
  averageCost: number;
  powerSummary: CustomMartialDistributionSummary;
  costSummary: CustomMartialDistributionSummary;
  averageFinalPercent: number;
  maxFinalPercent: number;
  averageImproveSpace: number;
  averageSteps: number;
  bestMatchCount: number;
  distribution: Record<string, number>;
  target: NormalizedCustomMartialTarget;
  samples?: {
    power: number[];
    cost: number[];
    finalPercent: number[];
  };
};

export type CustomMartialDistributionSummary = {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  mean: number;
};

export type CustomMartialDensityPoint = {
  x: number;
  y: number;
};

export type CustomMartialFinalValueDistributions = {
  trials: number;
  averageFinalPercent: number;
  averagePower: number;
  averageCost: number;
  finalPercentSummary: CustomMartialDistributionSummary;
  powerSummary: CustomMartialDistributionSummary;
  costSummary: CustomMartialDistributionSummary;
  finalPercentDensity: CustomMartialDensityPoint[];
  powerDensity: CustomMartialDensityPoint[];
  costMass: CustomMartialDensityPoint[];
};

export type CustomMartialSearchResult = CustomMartialRoute & {
  match: CustomMartialMatch;
  stats: CustomMartialStats;
};
