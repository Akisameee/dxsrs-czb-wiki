import { UnityRandom, makeZiChuangSeed } from "./unity-random.js";

const DEFAULT_BUFF_TYPE = 99;
const DEFAULT_BUFF_TARGET = 1;
const GAILIANG_PERCENT_STEP = 4;

function rowsOf(table) {
  return Array.isArray(table) ? table : table?.rows || [];
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function roundToInt(value) {
  return Math.round(Number(value));
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
    wugongRows: rowsOf(data?.wugongRows || data?.GWuGong || data?.wugong),
    chainRows: rowsOf(data?.chainRows || data?.GLianSuo || data?.chains),
    ziChuangWeiLiRows: rowsOf(data?.ziChuangWeiLiRows || data?.GZiChuangWeiLi || data?.ziChuangWeiLi),
    ziChuangBuffRows: rowsOf(data?.ziChuangBuffRows || data?.GZiChuangBuff || data?.ziChuangBuff),
    styleNames: data?.styleNames || data?.enumTypes?.LianSuo_FG || {},
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
  detail.power = roundToInt(basePower * (buff ? Number(buff.percent) : 1));
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

export function createZiChuang(input, data, options = {}) {
  const normalized = defaultData(data);
  const seed = makeZiChuangSeed(input);
  const rng = new UnityRandom(seed);
  const template = pickInitialTemplate(rng, input.weaponType, normalized.wugongRows, options);

  const gWuGong = {
    ...template,
    chnname: input.name || "自创武功",
    type: Number(input.weaponType),
    liansuo_fg1: randomFengGe(rng, normalized.chainRows),
    liansuo_fg2: 0,
    buff2: DEFAULT_BUFF_TYPE,
    bufftarget2: DEFAULT_BUFF_TARGET,
    huodefangfa: "自创武功",
    iszichuang: true,
  };

  const percentTarget = rng.rangeFloat(80, 100);
  const percent = rng.rangeFloat(20, 40);
  const zichuang = {
    seed,
    percent,
    percentTarget,
    gailiangkongjian: roundToInt((percentTarget - percent) / GAILIANG_PERCENT_STEP),
    fenggelock: false,
    arealock: false,
    bufflock: false,
    rare: Number(gWuGong.rare),
  };
  const detail = { power: 0, b1value: 0 };

  countRare(zichuang, gWuGong, normalized.ziChuangWeiLiRows);
  randomBuff(rng, zichuang, gWuGong, normalized.ziChuangBuffRows);
  countWeili(zichuang, gWuGong, detail, normalized.ziChuangWeiLiRows, normalized.ziChuangBuffRows);

  return {
    rng,
    data: normalized,
    zichuang,
    gWuGong,
    detail,
    history: [{ action: "create", zichuang: clone(zichuang), gWuGong: clone(gWuGong), detail: clone(detail) }],
  };
}

export function improveZiChuang(simulation, locks = {}) {
  const { rng, data, zichuang, gWuGong, detail } = simulation;
  zichuang.fenggelock = Boolean(locks.fenggelock ?? locks.styleLock ?? zichuang.fenggelock);
  zichuang.arealock = Boolean(locks.arealock ?? locks.areaLock ?? zichuang.arealock);
  zichuang.bufflock = Boolean(locks.bufflock ?? locks.effectLock ?? zichuang.bufflock);

  zichuang.percent += GAILIANG_PERCENT_STEP * rng.rangeFloat(1, 1.25);
  zichuang.gailiangkongjian -= 1;

  const changed = {
    rare: countRare(zichuang, gWuGong, data.ziChuangWeiLiRows),
    style: false,
    area: false,
    effect: false,
  };

  if (!zichuang.fenggelock) {
    const nextStyle = randomFengGe(rng, data.chainRows);
    changed.style = Number(gWuGong.liansuo_fg1) !== Number(nextStyle);
    gWuGong.liansuo_fg1 = nextStyle;
  }

  if (!zichuang.arealock) {
    changed.area = randomAttackArea(rng, zichuang, gWuGong, data.wugongRows);
  }

  if (!zichuang.bufflock) {
    changed.effect = randomBuff(rng, zichuang, gWuGong, data.ziChuangBuffRows);
  }

  countWeili(zichuang, gWuGong, detail, data.ziChuangWeiLiRows, data.ziChuangBuffRows);
  simulation.history.push({
    action: "improve",
    locks: clone(locks),
    changed,
    zichuang: clone(zichuang),
    gWuGong: clone(gWuGong),
    detail: clone(detail),
  });
  return simulation;
}

export function simulateZiChuang(input, data, options = {}) {
  const simulation = createZiChuang(input, data, options);
  const steps = Array.isArray(input.improvements) ? input.improvements : [];
  for (const locks of steps) improveZiChuang(simulation, locks);
  return simulation;
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
    power: step.detail.power,
  };
}
