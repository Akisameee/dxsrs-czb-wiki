#!/usr/bin/env node
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { DATA_DIR, RAW_DIR, ROOT, readJson, writeJson } from "./lib/bgdatabase.mjs";

function cleanText(value) {
  if (value === null || value === undefined) return null;
  return String(value).replace(/<\/?color(?:=[^>]*)?>/gi, "").trim() || null;
}

function styleIdsFromRow(row) {
  return [row.liansuo_fg1, row.liansuo_fg2]
    .map(Number)
    .filter((id) => id > 0);
}

function readExistingMartialArts(path) {
  const items = readJson(path, []);
  return new Map(items.map((item) => [item.name, item]));
}

function roundNumber(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function maxLevelDetailRow(detailRows, martialIndex) {
  const rows = detailRows.slice(martialIndex * 10, martialIndex * 10 + 10);
  return rows
    .filter((row) => Number(row.weili) > 0)
    .sort((a, b) => b.lv - a.lv)[0];
}

function powerFromDetailRow(maxLevelRow) {
  return maxLevelRow ? roundNumber(maxLevelRow.weili) : null;
}

function invertEnum(enumMap) {
  return new Map(Object.entries(enumMap || {}).map(([id, name]) => [name, Number(id)]));
}

function normalizeEffect(effect, buffNameToId) {
  if (!Array.isArray(effect)) return [];
  return effect
    .map((item) => {
      const id = item.id ?? buffNameToId.get(item.name);
      const level = Number(item.level);
      if (id === null || id === undefined || !Number.isFinite(level) || level < 0) return null;
      return { id: Number(id), level };
    })
    .filter(Boolean);
}

function effectsFromRawRow(row, detailRow, previous, buffNameToId) {
  const rawEffects = [1, 2, 3]
    .map((slot) => {
      const id = Number(row[`buff${slot}`]);
      if (!Number.isFinite(id) || id === 99) return null;
      const level = Number(detailRow?.[`b${slot}value`] ?? 0);
      if (!Number.isFinite(level) || level < 0) return null;
      return { id, level };
    })
    .filter(Boolean);

  return rawEffects.length > 0 ? rawEffects : normalizeEffect(previous.effect, buffNameToId);
}

function passivesFromRawDetail(detailRow) {
  const passives = [];
  const hp = Number(detailRow?.hp);
  const zhenqiup = Number(detailRow?.zhenqiup);
  if (Number.isFinite(hp) && hp > 0) passives.push(`体力值+${roundNumber(hp, 0)}`);
  if (Number.isFinite(zhenqiup) && zhenqiup > 0) passives.push(`真气增加速度+${roundNumber(zhenqiup)}%`);
  return passives;
}

function buildMartialArts(wugongRows, detailRows, existingByName, enumTypes) {
  const buffNameToId = invertEnum(enumTypes.BuffType);
  return wugongRows.map((row, index) => {
    const typeId = Number(row.type);
    const previous = existingByName.get(row.chnname) || {};
    const obtainMethod = cleanText(row.huodefangfa);
    const maxDetailRow = maxLevelDetailRow(detailRows, index);
    const base = {
      name: row.chnname,
      sectId: Number(row.liansuo_mp),
      styleIds: styleIdsFromRow(row),
      typeId,
      rare: row.rare,
    };

    if (typeId !== 6) {
      base.power = powerFromDetailRow(maxDetailRow);
      base.cost = row.cost;
      base.effect = effectsFromRawRow(row, maxDetailRow, previous, buffNameToId);
    } else {
      const rawPassives = passivesFromRawDetail(detailRows.slice(index * 10, index * 10 + 10).sort((a, b) => b.lv - a.lv)[0]);
      base.passives = Array.isArray(previous.passives) && previous.passives.length > 0
        ? previous.passives
        : rawPassives;
      base.special = previous.special ?? null;
    }

    base.obtainMethod = obtainMethod;
    base.sectRestricted = Boolean(obtainMethod && obtainMethod.startsWith("武林大会奖品"));
    return base;
  });
}

function pushChain(grouped, groupId, count, effect) {
  if (groupId === null || groupId === undefined || !count || !effect) return;
  if (!grouped.has(groupId)) grouped.set(groupId, []);
  grouped.get(groupId).push({ count, effect });
}

function buildChainOutputs(chainRows) {
  const sectGroups = new Map();
  const styleGroups = new Map();

  for (const row of chainRows) {
    const count = row.qty;
    const effect = row.desc;
    const sectId = Number(row.menpai);
    const styleId = Number(row.fengge);

    if (styleId === 0 && sectId !== 15) {
      pushChain(sectGroups, sectId, count, effect);
    } else if (styleId !== 0) {
      pushChain(styleGroups, styleId, count, effect);
    }
  }

  const toRows = (groups, key) => [...groups.entries()].map(([id, chains]) => ({
    [key]: Number(id),
    chains: chains.sort((a, b) => a.count - b.count),
  }));

  return {
    sectChains: toRows(sectGroups, "sectId"),
    styleChains: toRows(styleGroups, "styleId"),
  };
}

function pickFields(row, fields) {
  return Object.fromEntries(fields.map((field) => [field, row[field]]));
}

function buildSelfCreateData(wugongRows, chainRows, weiLiRows, buffRows, enumTypes) {
  return {
    wugongRows: wugongRows.map((row) => pickFields(row, [
      "chnname",
      "type",
      "rare",
      "cost",
      "slashfx",
      "hitfx",
      "buff1",
      "bufftarget1",
      "attackareaname",
      "iszichuang",
    ])),
    chainRows: chainRows.map((row) => pickFields(row, ["fengge", "qty"])),
    ziChuangWeiLiRows: weiLiRows.map((row) => pickFields(row, [
      "bingqitype",
      "rare",
      "cost",
      "weilimin",
      "weilimax",
      "percentmin",
      "percentmax",
    ])),
    ziChuangBuffRows: buffRows.map((row) => pickFields(row, [
      "rare",
      "bufftype",
      "bufftarget",
      "value",
      "percent",
    ])),
  };
}

export function buildFrontendData({
  rawDir = RAW_DIR,
  dataDir = DATA_DIR,
} = {}) {
  const wugong = readJson(join(rawDir, "GWuGong.json"));
  const wugongDetail = readJson(join(rawDir, "GWuGongDetail.json"));
  const chain = readJson(join(rawDir, "GLianSuo.json"));
  const ziChuangWeiLi = readJson(join(rawDir, "GZiChuangWeiLi.json"));
  const ziChuangBuff = readJson(join(rawDir, "GZiChuangBuff.json"));
  const enums = readJson(join(rawDir, "_enums.json"));
  if (!wugong || !wugongDetail || !chain || !ziChuangWeiLi || !ziChuangBuff || !enums) {
    throw new Error("raw 数据不完整，请先运行 scripts/extract_raw_database.mjs");
  }

  const martialArtsOutput = join(dataDir, "martial_arts.json");
  const sectChainsOutput = join(dataDir, "sect_chains.json");
  const styleChainsOutput = join(dataDir, "style_chains.json");
  const selfCreateOutput = join(dataDir, "self_create.json");

  const existingByName = readExistingMartialArts(martialArtsOutput);
  const martialArts = buildMartialArts(wugong.rows, wugongDetail.rows, existingByName, enums.enumTypes);
  const { sectChains, styleChains } = buildChainOutputs(chain.rows);
  const selfCreate = buildSelfCreateData(
    wugong.rows,
    chain.rows,
    ziChuangWeiLi.rows,
    ziChuangBuff.rows,
    enums.enumTypes,
  );

  writeJson(martialArtsOutput, martialArts);
  writeJson(sectChainsOutput, sectChains);
  writeJson(styleChainsOutput, styleChains);
  writeJson(selfCreateOutput, selfCreate);

  return {
    rawDir: relative(ROOT, rawDir).replaceAll("\\", "/"),
    dataDir: relative(ROOT, dataDir).replaceAll("\\", "/"),
    martialArtsOutput: relative(ROOT, martialArtsOutput).replaceAll("\\", "/"),
    sectChainsOutput: relative(ROOT, sectChainsOutput).replaceAll("\\", "/"),
    styleChainsOutput: relative(ROOT, styleChainsOutput).replaceAll("\\", "/"),
    selfCreateOutput: relative(ROOT, selfCreateOutput).replaceAll("\\", "/"),
    martialArts: martialArts.length,
    sectChains: sectChains.length,
    styleChains: styleChains.length,
    derivedFields: ["power"],
    preservedOverlayFields: ["effect", "passives", "special"],
  };
}

function main() {
  const rawDir = process.argv[2] || RAW_DIR;
  const dataDir = process.argv[3] || DATA_DIR;
  const result = buildFrontendData({ rawDir, dataDir });
  console.log(JSON.stringify(result, null, 2));
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
