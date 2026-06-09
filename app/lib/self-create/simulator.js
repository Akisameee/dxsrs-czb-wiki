import { UnityRandom, makeZiChuangSeed } from "./unity-random.js";

const DEFAULT_BUFF_TYPE = 99;
const DEFAULT_BUFF_TARGET = 1;
const GAILIANG_PERCENT_STEP = 4;

function rowsOf(table) {
  return Array.isArray(table) ? table : [];
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function roundToInt(value) {
  return Math.round(Number(value));
}

function roundTo2(value) {
  return Math.round(Number(value) * 100) / 100;
}

function uniqueBy(items, getter) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const key = getter(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

function rareGroup(rare) {
  return Number(rare) >= 4 ? [4, 5] : [1, 2, 3];
}

function defaultData(data) {
  return {
    wugongRows: rowsOf(data?.wugongRows),
    chainRows: rowsOf(data?.chainRows),
    ziChuangWeiLiRows: rowsOf(data?.ziChuangWeiLiRows),
    ziChuangBuffRows: rowsOf(data?.ziChuangBuffRows),
  };
}

export function buildStylePool(chainRows) {
  const weights = new Map();
  for (const row of rowsOf(chainRows)) {
    const style = Number(row.fengge);
    const qty = Number(row.qty);
    if (!style || !qty) continue;
    weights.set(style, Math.max(weights.get(style) || 0, qty));
  }

  const pool = [];
  for (const [style, weight] of [...weights.entries()].sort((a, b) => a[0] - b[0])) {
    for (let i = 0; i < weight; i += 1) pool.push(style);
  }
  return pool;
}

export function randomFengGe(rng, chainRows) {
  const pool = buildStylePool(chainRows);
  if (pool.length === 0) return null;
  return pool[rng.rangeInt(0, pool.length)];
}

export function countRare(zichuang, gWuGong, ziChuangWeiLiRows) {
  const oldRare = Number(gWuGong.rare);
  const row = rowsOf(ziChuangWeiLiRows).find((item) => (
    Number(item.bingqitype) === Number(gWuGong.type) &&
    Number(item.percentmin) <= Number(zichuang.percent) &&
    Number(zichuang.percent) <= Number(item.percentmax)
  ));

  if (!row) return false;
  gWuGong.rare = Number(row.rare);
  gWuGong.cost = Number(row.cost);
  zichuang.rare = Number(row.rare);
  return oldRare !== Number(row.rare);
}

export function randomBuff(rng, zichuang, gWuGong, ziChuangBuffRows) {
  const rares = new Set(rareGroup(zichuang.rare));
  const candidates = rowsOf(ziChuangBuffRows).filter((row) => rares.has(Number(row.rare)));

  let nextBuff = DEFAULT_BUFF_TYPE;
  let nextTarget = DEFAULT_BUFF_TARGET;

  if (candidates.length > 0 && rng.rangeInt(0, 100) <= 49) {
    const row = candidates[rng.rangeInt(0, candidates.length)];
    nextBuff = Number(row.bufftype);
    nextTarget = Number(row.bufftarget);
  }

  const changed = Number(gWuGong.buff1) !== nextBuff || Number(gWuGong.bufftarget1) !== nextTarget;
  gWuGong.buff1 = nextBuff;
  gWuGong.bufftarget1 = nextTarget;
  return changed;
}

export function randomAttackArea(rng, zichuang, gWuGong, wugongRows) {
  const rares = new Set(rareGroup(zichuang.rare));
  const pool = rowsOf(wugongRows).filter((row) => (
    Number(row.type) === Number(gWuGong.type) &&
    !row.iszichuang &&
    rares.has(Number(row.rare)) &&
    row.attackareaname
  ));

  const areaPool = uniqueBy(pool, (row) => row.attackareaname);
  if (areaPool.length === 0) return false;

  const area = areaPool[rng.rangeInt(0, areaPool.length)].attackareaname;
  const templatePool = pool.filter((row) => row.attackareaname === area);
  const template = templatePool[rng.rangeInt(0, templatePool.length)];
  const changed = gWuGong.attackareaname !== template.attackareaname;

  gWuGong.attackareaname = template.attackareaname;
  gWuGong.slashfx = template.slashfx;
  gWuGong.hitfx = template.hitfx;
  return changed;
}

export function countWeili(zichuang, gWuGong, detail, ziChuangWeiLiRows, ziChuangBuffRows) {
  const weiLi = rowsOf(ziChuangWeiLiRows).find((row) => (
    Number(row.bingqitype) === Number(gWuGong.type) &&
    Number(row.rare) === Number(gWuGong.rare)
  ));
  if (!weiLi) return detail;

  const percentSpan = Number(weiLi.percentmax) - Number(weiLi.percentmin);
  const progress = percentSpan === 0 ? 0 : (Number(zichuang.percent) - Number(weiLi.percentmin)) / percentSpan;
  const basePower = Number(weiLi.weilimin) + (Number(weiLi.weilimax) - Number(weiLi.weilimin)) * progress;

  const buffRows = rowsOf(ziChuangBuffRows)
    .filter((row) => Number(row.bufftype) === Number(gWuGong.buff1) && Number(row.rare) <= Number(gWuGong.rare))
    .sort((a, b) => Number(b.rare) - Number(a.rare));

  const buff = buffRows[0];
  detail.b1value = buff ? Number(buff.value) : 0;
  detail.power = roundTo2(basePower * (buff ? Number(buff.percent) : 1));
  return detail;
}

function pickInitialTemplate(rng, weaponType, wugongRows, options = {}) {
  const minRare = Number(options.initialTemplateRareMin ?? 1);
  const maxRare = Number(options.initialTemplateRareMax ?? 3);
  const candidates = rowsOf(wugongRows).filter((row) => (
    Number(row.type) === Number(weaponType) &&
    !row.iszichuang &&
    Number(row.rare) >= minRare &&
    Number(row.rare) <= maxRare
  ));

  if (candidates.length === 0) {
    throw new Error(`没有找到武器类型 ${weaponType} 的自创模板候选`);
  }
  return clone(candidates[rng.rangeInt(0, candidates.length)]);
}

export class SelfCreateSimulation {
  constructor(input, data, options = {}) {
    this.input = clone(input);
    this.data = defaultData(data);
    this.rng = new UnityRandom(makeZiChuangSeed(input));
    this.zichuang = null;
    this.gWuGong = null;
    this.detail = { power: 0, b1value: 0 };
    this.history = [];
    this.#create(input, options);
  }

  get seed() {
    return this.zichuang.seed;
  }

  get remainingImproveCount() {
    return Number(this.zichuang.gailiangkongjian) || 0;
  }

  get canImprove() {
    return this.remainingImproveCount > 0;
  }

  #create(input, options = {}) {
    const template = pickInitialTemplate(this.rng, input.weaponType, this.data.wugongRows, options);

    this.gWuGong = {
      ...template,
      chnname: input.name || "自创武功",
      type: Number(input.weaponType),
      liansuo_fg1: randomFengGe(this.rng, this.data.chainRows),
      liansuo_fg2: 0,
      buff2: DEFAULT_BUFF_TYPE,
      bufftarget2: DEFAULT_BUFF_TARGET,
      huodefangfa: "自创武功",
      iszichuang: true,
    };

    const percentTarget = this.rng.rangeFloat(80, 100);
    const percent = this.rng.rangeFloat(20, 40);
    this.zichuang = {
      seed: makeZiChuangSeed(input),
      percent,
      percentTarget,
      gailiangkongjian: roundToInt((percentTarget - percent) / GAILIANG_PERCENT_STEP),
      fenggelock: false,
      arealock: false,
      bufflock: false,
      rare: Number(this.gWuGong.rare),
    };

    countRare(this.zichuang, this.gWuGong, this.data.ziChuangWeiLiRows);
    randomBuff(this.rng, this.zichuang, this.gWuGong, this.data.ziChuangBuffRows);
    countWeili(this.zichuang, this.gWuGong, this.detail, this.data.ziChuangWeiLiRows, this.data.ziChuangBuffRows);
    this.#record("create");
  }

  #record(action, extra = {}) {
    this.history.push({
      action,
      ...extra,
      zichuang: clone(this.zichuang),
      gWuGong: clone(this.gWuGong),
      detail: clone(this.detail),
    });
  }

  improve(locks = {}) {
    if (!this.canImprove) return this;

    this.zichuang.fenggelock = Boolean(locks.fenggelock ?? locks.styleLock ?? this.zichuang.fenggelock);
    this.zichuang.arealock = Boolean(locks.arealock ?? locks.areaLock ?? this.zichuang.arealock);
    this.zichuang.bufflock = Boolean(locks.bufflock ?? locks.effectLock ?? this.zichuang.bufflock);

    this.zichuang.percent += GAILIANG_PERCENT_STEP * this.rng.rangeFloat(1, 1.25);
    this.zichuang.gailiangkongjian -= 1;

    const changed = {
      rare: countRare(this.zichuang, this.gWuGong, this.data.ziChuangWeiLiRows),
      style: false,
      area: false,
      effect: false,
    };

    if (!this.zichuang.fenggelock) {
      const nextStyle = randomFengGe(this.rng, this.data.chainRows);
      changed.style = Number(this.gWuGong.liansuo_fg1) !== Number(nextStyle);
      this.gWuGong.liansuo_fg1 = nextStyle;
    }

    if (!this.zichuang.arealock) {
      changed.area = randomAttackArea(this.rng, this.zichuang, this.gWuGong, this.data.wugongRows);
    }

    if (!this.zichuang.bufflock) {
      changed.effect = randomBuff(this.rng, this.zichuang, this.gWuGong, this.data.ziChuangBuffRows);
    }

    countWeili(this.zichuang, this.gWuGong, this.detail, this.data.ziChuangWeiLiRows, this.data.ziChuangBuffRows);
    this.#record("improve", { locks: clone(locks), changed });
    return this;
  }

  currentSummary(styleNames = {}) {
    return summarizeZiChuangStep(this.history.at(-1), styleNames);
  }

  summaries(styleNames = {}) {
    return this.history.map((step) => summarizeZiChuangStep(step, styleNames));
  }

  toRoute(styleNames = {}) {
    const summaries = this.summaries(styleNames);
    const initial = summaries[0] || null;
    const steps = summaries.slice(1).map((result, index) => ({
      index: index + 1,
      locks: result.locks || {},
      result,
    }));
    const final = summaries.at(-1) || null;
    return {
      input: clone(this.input || {}),
      seed: this.seed,
      initialImproveLimit: Number(initial?.gailiangkongjian ?? 0),
      remainingImproveCount: Number(final?.gailiangkongjian ?? 0),
      initial,
      steps,
      final,
      summaries,
      simulation: this,
    };
  }
}

export function summarizeZiChuangStep(step, styleNames = {}) {
  return {
    action: step.action,
    locks: step.locks || null,
    changed: step.changed || null,
    rare: step.gWuGong.rare,
    percent: Number(step.zichuang.percent.toFixed(4)),
    gailiangkongjian: step.zichuang.gailiangkongjian,
    style: {
      id: step.gWuGong.liansuo_fg1,
      name: styleNames[String(step.gWuGong.liansuo_fg1)] || String(step.gWuGong.liansuo_fg1),
    },
    area: {
      name: step.gWuGong.attackareaname,
      slashfx: step.gWuGong.slashfx,
      hitfx: step.gWuGong.hitfx,
    },
    effect: {
      bufftype: step.gWuGong.buff1,
      bufftarget: step.gWuGong.bufftarget1,
      value: step.detail.b1value,
    },
    cost: step.gWuGong.cost,
    power: step.detail.power,
  };
}
