#!/usr/bin/env node
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { DATA_DIR, RAW_DIR, readJson, writeJson } from "./lib/bgdatabase.mjs";

function cleanText(value) {
  if (value === null || value === undefined) return null;
  return String(value).replace(/<\/?color(?:=[^>]*)?>/gi, "").trim() || null;
}

function typeFromRow(row) {
  return row.type === 6 ? "内功" : "外功";
}

function stylesFromRow(row, enumTypes) {
  return [row.liansuo_fg1, row.liansuo_fg2]
    .map((id) => enumTypes.LianSuo_FG[String(id)])
    .filter(Boolean);
}

function readExistingMartialArts(path) {
  const items = readJson(path, []);
  return new Map(items.map((item) => [item.name, item]));
}

function roundNumber(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function powerFromDetailRows(detailRows, martialIndex) {
  const rows = detailRows.slice(martialIndex * 10, martialIndex * 10 + 10);
  const maxLevelRow = rows
    .filter((row) => Number(row.weili) > 0)
    .sort((a, b) => b.lv - a.lv)[0];
  return maxLevelRow ? roundNumber(maxLevelRow.weili) : null;
}

function buildMartialArts(wugongRows, detailRows, existingByName, enumTypes) {
  return wugongRows.map((row, index) => {
    const type = typeFromRow(row);
    const previous = existingByName.get(row.chnname) || {};
    const obtainMethod = cleanText(row.huodefangfa);
    const base = {
      name: row.chnname,
      sect: enumTypes.LianSuo_MP[String(row.liansuo_mp)] || previous.sect || "未知",
      styles: stylesFromRow(row, enumTypes),
      type,
      rare: row.rare,
    };

    if (type === "外功") {
      base.power = powerFromDetailRows(detailRows, index);
      base.cost = row.cost;
      base.effect = Array.isArray(previous.effect) ? previous.effect : [];
    } else {
      base.passives = Array.isArray(previous.passives) ? previous.passives : [];
      base.special = previous.special ?? null;
    }

    base.obtainMethod = obtainMethod;
    base.sectRestricted = Boolean(obtainMethod && obtainMethod.startsWith("武林大会奖品"));
    return base;
  });
}

function pushChain(grouped, groupName, count, effect) {
  if (!groupName || !count || !effect) return;
  if (!grouped.has(groupName)) grouped.set(groupName, []);
  grouped.get(groupName).push({ count, effect });
}

function buildChainOutputs(chainRows, enumTypes) {
  const sectGroups = new Map();
  const styleGroups = new Map();

  for (const row of chainRows) {
    const count = row.qty;
    const effect = row.desc;
    const sect = enumTypes.LianSuo_MP[String(row.menpai)];
    const style = enumTypes.LianSuo_FG[String(row.fengge)];

    if (row.fengge === 0 && row.menpai !== 15) {
      pushChain(sectGroups, sect, count, effect);
    } else if (row.fengge !== 0) {
      pushChain(styleGroups, style, count, effect);
    }
  }

  const toRows = (groups, key) => [...groups.entries()].map(([name, chains]) => ({
    [key]: name,
    chains: chains.sort((a, b) => a.count - b.count),
  }));

  return {
    sectChains: toRows(sectGroups, "sect"),
    styleChains: toRows(styleGroups, "style"),
  };
}

export function buildFrontendData({
  rawDir = RAW_DIR,
  dataDir = DATA_DIR,
} = {}) {
  const wugong = readJson(join(rawDir, "GWuGong.json"));
  const wugongDetail = readJson(join(rawDir, "GWuGongDetail.json"));
  const chain = readJson(join(rawDir, "GLianSuo.json"));
  const enums = readJson(join(rawDir, "_enums.json"));
  if (!wugong || !wugongDetail || !chain || !enums) {
    throw new Error("raw 数据不完整，请先运行 scripts/extract_raw_database.mjs");
  }

  const martialArtsOutput = join(dataDir, "martial_arts.json");
  const sectChainsOutput = join(dataDir, "sect_chains.json");
  const styleChainsOutput = join(dataDir, "style_chains.json");

  const existingByName = readExistingMartialArts(martialArtsOutput);
  const martialArts = buildMartialArts(wugong.rows, wugongDetail.rows, existingByName, enums.enumTypes);
  const { sectChains, styleChains } = buildChainOutputs(chain.rows, enums.enumTypes);

  writeJson(martialArtsOutput, martialArts);
  writeJson(sectChainsOutput, sectChains);
  writeJson(styleChainsOutput, styleChains);

  return {
    rawDir,
    dataDir,
    martialArtsOutput,
    sectChainsOutput,
    styleChainsOutput,
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
