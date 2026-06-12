export type SqlNumber = number | string | null;

export type CustomMartialOption = {
  id: string;
  label: string;
};

// 页面输入状态
export type CustomMartialInput = {
  name?: string;
  weaponType: string;
  yi: string;
  qi: string;
  xing: string;
  shen: string;
};

export type SearchTarget = {
  weaponType: string;
  styleId: string;
  areaName: string;
  effectType: string;
  effectLevel: string;
};

// sqlite 原始行
export type CustomMartialTemplateRow = {
  id: number | string;
  type_id: SqlNumber;
  rarity_id: SqlNumber;
  cost: SqlNumber;
  slash_effect_id: SqlNumber;
  hit_effect_id: SqlNumber;
  attack_area_id: SqlNumber;
  is_custom: SqlNumber;
};

export type CustomMartialTemplateEffectRow = {
  custom_martial_art_id: number | string;
  slot: SqlNumber;
  effect_id: SqlNumber;
  target_id: SqlNumber;
};

export type CustomStyleWeightDbRow = {
  style_id: SqlNumber;
  weight: SqlNumber;
};

export type CustomPowerRangeDbRow = {
  weapon_type_id: SqlNumber;
  rarity_id: SqlNumber;
  cost: SqlNumber;
  power_min: SqlNumber;
  power_max: SqlNumber;
  percent_min: SqlNumber;
  percent_max: SqlNumber;
};

export type CustomEffectRateDbRow = {
  rarity_id: SqlNumber;
  effect_id: SqlNumber;
  target_id: SqlNumber;
  level: SqlNumber;
  percent: SqlNumber;
};

export type CustomStatusEffectDbRow = {
  id: number | string;
  valuePerLevel: SqlNumber;
  template: string | null;
};

// 自创算法使用的数据结构
export type CustomMartialAlgorithmMartialRow = {
  chnname: string;
  type: number;
  rare: number;
  cost: number;
  slashfx: number;
  hitfx: number;
  attackareaname: string;
  iszichuang: boolean;
} & Record<`buff${number}` | `bufftarget${number}`, number>;

export type CustomStyleWeightRow = {
  fengge: number;
  qty: number;
};

export type CustomPowerRangeRow = {
  bingqitype: number;
  rare: number;
  cost: number;
  weilimin: number;
  weilimax: number;
  percentmin: number;
  percentmax: number;
};

export type CustomBuffRow = {
  rare?: number;
  bufftype: number | string;
  bufftarget?: number;
  value?: number | string | null;
  percent?: number;
};

export type CustomMartialAlgorithmData = {
  wugongRows: CustomMartialAlgorithmMartialRow[];
  chainRows: CustomStyleWeightRow[];
  ziChuangWeiLiRows: CustomPowerRangeRow[];
  ziChuangBuffRows: CustomBuffRow[];
};

export type CustomEffectOption = {
  id: number | string;
  name: string;
  valuePerLevel?: number | null;
  template?: string | null;
};

// 算法结果和页面展示结构
export type CustomMartialEffect = {
  bufftype?: number | string | null;
  value?: number | string | null;
};

export type CustomMartialSummary = {
  rare: number | string;
  style: {
    name: string;
  };
  area: {
    name: string;
  };
  effect: CustomMartialEffect | null;
  power: number | string;
  cost: number | string;
  gailiangkongjian: number | string;
};

export type SearchResultStats = {
  target?: {
    styleId?: number | string | null;
    areaName?: string | null;
    effectType?: number | string | null;
  };
  styleProbability?: number | string;
  areaProbability?: number | string;
  effectProbability?: number | string;
  effectWeightedLevel?: number | string;
  averagePower?: number | string;
  maxPower?: number | string;
  averageCost?: number | string;
  averageImproveSpace?: number | string;
  averageSteps?: number | string;
  bestMatchCount?: number | string;
  samples?: {
    power?: number[];
    cost?: number[];
  };
};

export type SearchResultRoute = {
  seed?: number | string;
  input: CustomMartialInput;
  initial: CustomMartialSummary;
  stats?: SearchResultStats;
};

export type SearchResultCandidate = Omit<SearchResultRoute, "initial"> & {
  initial: CustomMartialSummary | null;
};

export type ProbabilityRow = {
  label: string;
  value: number | string;
};

export type PowerDensityPoint = {
  x: number | string;
  y: number | string;
};

export type PowerSummary = {
  min: number | string;
  q1: number | string;
  median: number | string;
  q3: number | string;
  max: number | string;
  mean: number | string;
};

export type SimulationAnalysis = {
  trials?: number | string;
  styles: ProbabilityRow[];
  areas: ProbabilityRow[];
  effects: ProbabilityRow[];
  finalValues: {
    powerDensity: PowerDensityPoint[];
    powerSummary: PowerSummary;
  };
};
