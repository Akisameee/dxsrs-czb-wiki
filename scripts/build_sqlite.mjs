#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, rmSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { DEFAULT_SOURCE, ROOT, deriveChainEnums, extractTables } from "./lib/bgdatabase.mjs";

const DEFAULT_ENUM_SOURCE = join(ROOT, "re/dump/cpp2il_analysis/types/Assembly-CSharp");
const OUTPUT = join(ROOT, "public/data/wiki.sqlite");

const STATUS_EFFECT_META = {
  0: { value_per_level: 10, template: "伤害提升{value*n}%" },
  1: { value_per_level: 10, template: "防御提升{value*n}%" },
  2: { value_per_level: 10, template: "速度提升{value*n}%" },
  3: { value_per_level: 20, template: "移动距离提升{value*n}%" },
  4: { value_per_level: null, template: "未记录" },
  5: { value_per_level: 10, template: "真气恢复速度提升{value*n}%" },
  6: { value_per_level: 10, template: "防御降低{value*n}%" },
  7: { value_per_level: 10, template: "伤害降低{value*n}%" },
  8: { value_per_level: null, template: "一段时间无法行动" },
  9: { value_per_level: 10, template: "命中率降低{value*n}%" },
  10: { value_per_level: 3, template: "持续失去{value*n}点体力" },
  11: { value_per_level: null, template: "一段时间无法恢复真气" },
  12: { value_per_level: 20, template: "移动距离降低{value*n}%" },
  13: { value_per_level: 10, template: "速度降低{value*n}%" },
  14: { value_per_level: 12, template: "受伤时额外失去{value*n}点体力" },
  15: { value_per_level: null, template: "未记录" },
  99: { value_per_level: null, template: "无特殊效果" },
};

const TABLES = {
  enums: {
    primaryKey: ["type", "id"],
    columns: {
      type: "TEXT NOT NULL",
      id: "INTEGER NOT NULL",
      label: "TEXT",
    },
  },
  characters: {
    primaryKey: ["id"],
    columns: {
      id: "INTEGER NOT NULL",
      name: "TEXT NOT NULL",
      portrait: "TEXT",
      region_id: "INTEGER",
      location_id: "INTEGER",
      sect_id: "INTEGER",
      sex_id: "INTEGER",
      rarity_id: "INTEGER",
      rank_id: "INTEGER",
      position_id: "INTEGER",
      level: "INTEGER",
      favorite_rarity_id: "INTEGER",
      fame: "INTEGER",
      chivalry: "INTEGER",
      gold: "INTEGER",
      is_instructor: "INTEGER NOT NULL",
      is_manager: "INTEGER NOT NULL",
      weapon_type_id: "INTEGER",
      growth_type_id: "INTEGER",
      martial_type_id: "INTEGER",
      equipment_weapon: "TEXT",
      equipment_armor: "TEXT",
      equipment_other_weapon: "TEXT",
      strength: "REAL",
      constitution: "REAL",
      physique: "REAL",
      agility: "REAL",
      cultivation: "REAL",
      fist: "REAL",
      blade_sword: "REAL",
      spear_staff: "REAL",
      hidden_weapon: "REAL",
      internal: "REAL",
      growth_initial_value: "REAL",
      growth_final_value: "REAL",
      growth_base_level: "INTEGER",
      base_strength: "REAL",
      base_constitution: "REAL",
      base_physique: "REAL",
      base_agility: "REAL",
      growth_strength: "REAL",
      growth_constitution: "REAL",
      growth_physique: "REAL",
      growth_agility: "REAL",
      mining: "INTEGER",
      herb_gathering: "INTEGER",
      hunting: "INTEGER",
      forging: "INTEGER",
      alchemy: "INTEGER",
      sewing: "INTEGER",
      likes_tea: "INTEGER NOT NULL",
      likes_wine: "INTEGER NOT NULL",
      likes_music: "INTEGER NOT NULL",
      likes_chess: "INTEGER NOT NULL",
      likes_book: "INTEGER NOT NULL",
      likes_painting: "INTEGER NOT NULL",
      word: "TEXT",
    },
  },
  character_friends: {
    primaryKey: ["character_id", "slot"],
    columns: {
      character_id: "INTEGER NOT NULL",
      slot: "INTEGER NOT NULL",
      name: "TEXT NOT NULL",
    },
  },
  character_martial_arts: {
    primaryKey: ["character_id", "slot"],
    columns: {
      character_id: "INTEGER NOT NULL",
      slot: "INTEGER NOT NULL",
      level: "INTEGER NOT NULL",
      name: "TEXT NOT NULL",
      martial_level: "INTEGER NOT NULL",
    },
  },
  character_attribute_snapshots: {
    primaryKey: ["character_id", "slot"],
    columns: {
      character_id: "INTEGER NOT NULL",
      slot: "INTEGER NOT NULL",
      level: "INTEGER",
      power: "INTEGER",
      rank_id: "INTEGER",
      position_id: "INTEGER",
      strength: "INTEGER",
      constitution: "INTEGER",
      physique: "INTEGER",
      agility: "INTEGER",
      cultivation: "INTEGER",
      fist: "INTEGER",
      blade_sword: "INTEGER",
      spear_staff: "INTEGER",
      hidden_weapon: "INTEGER",
      internal: "INTEGER",
      mining: "INTEGER",
      herb_gathering: "INTEGER",
      hunting: "INTEGER",
      forging: "INTEGER",
      alchemy: "INTEGER",
      sewing: "INTEGER",
      weapon: "TEXT",
      armor: "TEXT",
      fame: "INTEGER",
      chivalry: "INTEGER",
    },
  },
  locations: {
    primaryKey: ["region_id", "location_id"],
    columns: {
      region_id: "INTEGER NOT NULL",
      location_id: "INTEGER NOT NULL",
      character_count: "INTEGER NOT NULL",
    },
  },
  location_characters: {
    primaryKey: ["region_id", "location_id", "character_id"],
    columns: {
      region_id: "INTEGER NOT NULL",
      location_id: "INTEGER NOT NULL",
      character_id: "INTEGER NOT NULL",
      sort_order: "INTEGER NOT NULL",
    },
  },
  unplaced_characters: {
    primaryKey: ["character_id"],
    columns: {
      character_id: "INTEGER NOT NULL",
      sort_order: "INTEGER NOT NULL",
    },
  },
  martial_arts: {
    primaryKey: ["id"],
    columns: {
      id: "INTEGER NOT NULL",
      internal_name: "TEXT",
      name: "TEXT NOT NULL",
      sect_id: "INTEGER",
      type_id: "INTEGER",
      rarity_id: "INTEGER",
      power: "REAL",
      cost: "INTEGER",
      obtain_method: "TEXT",
      is_sect_restricted: "INTEGER NOT NULL",
      special: "TEXT",
    },
  },
  martial_art_styles: {
    primaryKey: ["martial_art_id", "slot"],
    columns: {
      martial_art_id: "INTEGER NOT NULL",
      slot: "INTEGER NOT NULL",
      style_id: "INTEGER NOT NULL",
    },
  },
  martial_art_effects: {
    primaryKey: ["martial_art_id", "slot"],
    columns: {
      martial_art_id: "INTEGER NOT NULL",
      slot: "INTEGER NOT NULL",
      effect_id: "INTEGER NOT NULL",
      level: "INTEGER NOT NULL",
    },
  },
  martial_art_passives: {
    primaryKey: ["martial_art_id", "slot"],
    columns: {
      martial_art_id: "INTEGER NOT NULL",
      slot: "INTEGER NOT NULL",
      text: "TEXT NOT NULL",
    },
  },
  status_effects: {
    primaryKey: ["id"],
    columns: {
      id: "INTEGER NOT NULL",
      name: "TEXT NOT NULL",
      value_per_level: "REAL",
      template: "TEXT",
    },
  },
  sect_chains: {
    primaryKey: ["sect_id", "count"],
    columns: {
      sect_id: "INTEGER NOT NULL",
      count: "INTEGER NOT NULL",
      effect: "TEXT NOT NULL",
    },
  },
  style_chains: {
    primaryKey: ["style_id", "count"],
    columns: {
      style_id: "INTEGER NOT NULL",
      count: "INTEGER NOT NULL",
      effect: "TEXT NOT NULL",
    },
  },
  custom_martial_arts: {
    primaryKey: ["id"],
    columns: {
      id: "INTEGER NOT NULL",
      name: "TEXT NOT NULL",
      type_id: "INTEGER",
      rarity_id: "INTEGER",
      cost: "INTEGER",
      slash_effect_id: "INTEGER",
      hit_effect_id: "INTEGER",
      attack_area_name: "TEXT",
      is_custom: "INTEGER NOT NULL",
    },
  },
  custom_martial_art_effects: {
    primaryKey: ["custom_martial_art_id", "slot"],
    columns: {
      custom_martial_art_id: "INTEGER NOT NULL",
      slot: "INTEGER NOT NULL",
      effect_id: "INTEGER NOT NULL",
      target_id: "INTEGER",
    },
  },
  custom_style_weights: {
    primaryKey: ["id"],
    columns: {
      id: "INTEGER NOT NULL",
      style_id: "INTEGER NOT NULL",
      weight: "INTEGER NOT NULL",
    },
  },
  custom_martial_power_ranges: {
    primaryKey: ["id"],
    columns: {
      id: "INTEGER NOT NULL",
      weapon_type_id: "INTEGER",
      rarity_id: "INTEGER",
      cost: "INTEGER",
      power_min: "REAL",
      power_max: "REAL",
      percent_min: "REAL",
      percent_max: "REAL",
    },
  },
  custom_martial_effect_rates: {
    primaryKey: ["id"],
    columns: {
      id: "INTEGER NOT NULL",
      rarity_id: "INTEGER NOT NULL",
      effect_id: "INTEGER NOT NULL",
      target_id: "INTEGER NOT NULL",
      level: "INTEGER NOT NULL",
      percent: "REAL NOT NULL",
    },
  },
};

const INDEXES = [
  "CREATE INDEX idx_characters_name ON characters(name)",
  "CREATE INDEX idx_characters_location ON characters(region_id, location_id)",
  "CREATE INDEX idx_characters_sect ON characters(sect_id)",
  "CREATE INDEX idx_characters_rarity ON characters(rarity_id)",
  "CREATE INDEX idx_characters_weapon ON characters(weapon_type_id)",
  "CREATE INDEX idx_location_characters_character ON location_characters(character_id)",
  "CREATE INDEX idx_character_martial_arts_character ON character_martial_arts(character_id)",
  "CREATE INDEX idx_character_attribute_snapshots_character ON character_attribute_snapshots(character_id)",
  "CREATE INDEX idx_martial_arts_name ON martial_arts(name)",
  "CREATE INDEX idx_martial_arts_sect ON martial_arts(sect_id)",
  "CREATE INDEX idx_martial_arts_type ON martial_arts(type_id)",
  "CREATE INDEX idx_martial_arts_rarity ON martial_arts(rarity_id)",
  "CREATE INDEX idx_martial_art_styles_style ON martial_art_styles(style_id)",
  "CREATE INDEX idx_martial_art_effects_effect ON martial_art_effects(effect_id)",
  "CREATE INDEX idx_custom_martial_effect_rates_effect ON custom_martial_effect_rates(effect_id)",
];

function boolInt(value) {
  return value ? 1 : 0;
}

function cleanText(value) {
  if (value === null || value === undefined) return null;
  return String(value).replace(/<\/?color(?:=[^>]*)?>/gi, "").trim() || null;
}

function roundNumber(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(Number(value) * factor) / factor;
}

function tableByName(tables, name) {
  const table = tables.find((item) => item.meta === name);
  if (!table) throw new Error(`原始数据库缺少表：${name}`);
  return table.rows || [];
}

function parseEnumFile(path) {
  const text = readFileSync(path, "utf8");
  if (!text.includes("System.Enum")) return null;

  const type = text.match(/^Type:\s*([^:\r\n]+):/m)?.[1];
  if (!type) return null;

  const entries = {};
  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const field = lines[index].match(/^\s*Static Field:\s*(.+?)\s*$/)?.[1];
    if (!field || field === "value__") continue;

    for (let scan = index + 1; scan < Math.min(index + 8, lines.length); scan += 1) {
      const value = lines[scan].match(/^\s*Default Value:\s*(-?\d+)\s*$/)?.[1];
      if (!value) continue;
      entries[value] = field;
      break;
    }
  }

  if (Object.keys(entries).length === 0) return null;
  return {
    type,
    values: Object.fromEntries(Object.entries(entries).sort(([a], [b]) => Number(a) - Number(b))),
  };
}

function buildEnumTypes({ enumSource, areaRows, chainRows }) {
  const enumTypes = {};
  if (existsSync(enumSource)) {
    const enumFiles = readdirSync(enumSource)
      .filter((name) => name.endsWith("_metadata.txt"))
      .map((name) => join(enumSource, name));

    for (const file of enumFiles) {
      const parsed = parseEnumFile(file);
      if (parsed) enumTypes[parsed.type] = parsed.values;
    }
  }

  const chainEnums = deriveChainEnums(chainRows);
  Object.assign(enumTypes, chainEnums.enumTypes || {});

  enumTypes.Area = Object.fromEntries(
    areaRows
      .filter((row) => row.index !== null && row.index !== undefined && row.chnname)
      .map((row) => [String(row.index), row.chnname])
      .sort(([a], [b]) => Number(a) - Number(b)),
  );

  return enumTypes;
}

function enumRows(enumTypes) {
  return Object.entries(enumTypes).flatMap(([type, values]) =>
    Object.entries(values || {}).map(([id, label]) => ({
      type,
      id: Number(id),
      label,
    })),
  );
}

function npcName(row) {
  return `${row.xing || ""}${row.ming || ""}` || `NPC ${row.index}`;
}

function buildLocationLookups(areaRows) {
  const locationByCode = new Map();
  const locationById = new Map();

  for (const row of areaRows || []) {
    if (!row.name) continue;
    const regionId = Number(row.didian);
    const location = {
      regionId: Number.isFinite(regionId) ? regionId : null,
      locationId: Number(row.index),
      locationCode: row.name,
    };
    locationByCode.set(row.name, location);
    locationById.set(location.locationId, location);
  }

  return { locationByCode, locationById };
}

function groupRowsByName(rows, nameField) {
  const grouped = new Map();
  for (const row of rows || []) {
    const name = row[nameField];
    if (!name) continue;
    if (!grouped.has(name)) grouped.set(name, []);
    grouped.get(name).push(row);
  }
  return grouped;
}

function buildCharacterRows(npcRows, npcWordRows, locationByCode) {
  const wordByName = new Map((npcWordRows || []).filter((row) => row.juesename).map((row) => [row.juesename, row.word]));
  return npcRows.map((row) => {
    const location = row.area ? locationByCode.get(row.area) : null;
    const name = npcName(row);
    return {
      id: Number(row.index),
      name,
      portrait: row.touxiang || null,
      region_id: location?.regionId ?? null,
      location_id: location?.locationId ?? null,
      sect_id: Number(row.menpai),
      sex_id: Number(row.sex),
      rarity_id: Number(row.rare),
      rank_id: Number(row.dengji),
      position_id: Number(row.diwei),
      level: Number(row.lv),
      favorite_rarity_id: Number(row.likerare),
      fame: Number(row.mingsheng),
      chivalry: Number(row.xiayi),
      gold: Number(row.gold),
      is_instructor: boolInt(row.isjiaotou),
      is_manager: boolInt(row.isguanshiren),
      weapon_type_id: Number(row.bingqitype),
      growth_type_id: Number(row.changzhangtype),
      martial_type_id: Number(row.wugongtype),
      equipment_weapon: row.wuqiname || null,
      equipment_armor: row.fangjuname || null,
      equipment_other_weapon: row.otherwuqiname || null,
      strength: Number(row.lvli),
      constitution: Number(row.gengu),
      physique: Number(row.tipo),
      agility: Number(row.shenfa),
      cultivation: Number(row.xiuwei),
      fist: Number(row.quanzhang),
      blade_sword: Number(row.daojian),
      spear_staff: Number(row.qiangbang),
      hidden_weapon: Number(row.anqi),
      internal: Number(row.neigong),
      growth_initial_value: Number(row.chushizhi),
      growth_final_value: Number(row.zuizhongzhi),
      growth_base_level: Number(row.lv_0),
      base_strength: Number(row.lvli_0),
      base_constitution: Number(row.gengu_0),
      base_physique: Number(row.tipo_0),
      base_agility: Number(row.shenfa_0),
      growth_strength: Number(row.lvli_up),
      growth_constitution: Number(row.gengu_up),
      growth_physique: Number(row.tipo_up),
      growth_agility: Number(row.shenfa_up),
      mining: Number(row.wakuang),
      herb_gathering: Number(row.caiyao),
      hunting: Number(row.dalie),
      forging: Number(row.duanzao),
      alchemy: Number(row.liandan),
      sewing: Number(row.caifeng),
      likes_tea: boolInt(row.l_cha),
      likes_wine: boolInt(row.l_jiu),
      likes_music: boolInt(row.l_qin),
      likes_chess: boolInt(row.l_qi),
      likes_book: boolInt(row.l_shu),
      likes_painting: boolInt(row.l_hua),
      word: wordByName.get(name) || null,
    };
  });
}

function buildCharacterFriendRows(npcRows) {
  return npcRows.flatMap((row) =>
    [row.friend1, row.friend2]
      .filter(Boolean)
      .map((name, slot) => ({
        character_id: Number(row.index),
        slot,
        name,
      })),
  );
}

function buildCharacterMartialRows(npcRows, npcMartialRows) {
  const idByName = new Map(npcRows.map((row) => [npcName(row), Number(row.index)]));
  return (npcMartialRows || [])
    .filter((row) => idByName.has(row.juesename))
    .sort((a, b) => Number(a.lv) - Number(b.lv) || String(a.wugongname).localeCompare(String(b.wugongname), "zh-Hans-CN"))
    .map((row, slot) => ({
      character_id: idByName.get(row.juesename),
      slot,
      level: Number(row.lv),
      name: row.wugongname,
      martial_level: Number(row.wugonglv),
    }));
}

function buildCharacterAttributeSnapshotRows(npcRows, npcAttributeRows) {
  const idByName = new Map(npcRows.map((row) => [npcName(row), Number(row.index)]));
  return (npcAttributeRows || [])
    .filter((row) => idByName.has(row.juesename))
    .sort((a, b) => Number(a.lv) - Number(b.lv))
    .map((row, slot) => ({
      character_id: idByName.get(row.juesename),
      slot,
      level: row.lv,
      power: row.gongli,
      rank_id: row.dengji,
      position_id: row.diwei,
      strength: row.lvli,
      constitution: row.gengu,
      physique: row.tipo,
      agility: row.shenfa,
      cultivation: row.xiuwei,
      fist: row.quanzhang,
      blade_sword: row.daojian,
      spear_staff: row.qiangbang,
      hidden_weapon: row.anqi,
      internal: row.neigong,
      mining: row.wakuang,
      herb_gathering: row.caiyao,
      hunting: row.dalie,
      forging: row.duanzao,
      alchemy: row.liandan,
      sewing: row.caifeng,
      weapon: row.wuqiname,
      armor: row.fangjuname,
      fame: row.mingsheng,
      chivalry: row.xiayi,
    }));
}

function buildLocationRows(areaRows, npcRows, locationByCode, locationById) {
  const counts = new Map();
  for (const row of npcRows) {
    const location = row.area ? locationByCode.get(row.area) : null;
    if (!location) continue;
    const key = `${location.regionId}:${location.locationId}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return [...locationById.values()]
    .filter((location) => location.regionId !== null && location.locationId !== null)
    .sort((a, b) => a.regionId - b.regionId || a.locationId - b.locationId)
    .map((location) => ({
      region_id: location.regionId,
      location_id: location.locationId,
      character_count: counts.get(`${location.regionId}:${location.locationId}`) || 0,
    }));
}

function buildLocationCharacterRows(npcRows, locationByCode) {
  return npcRows
    .map((row) => {
      const location = row.area ? locationByCode.get(row.area) : null;
      if (!location) return null;
      return {
        region_id: location.regionId,
        location_id: location.locationId,
        character_id: Number(row.index),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.region_id - b.region_id || a.location_id - b.location_id || a.character_id - b.character_id)
    .map((row, sort_order) => ({ ...row, sort_order }));
}

function buildUnplacedCharacterRows(npcRows, locationByCode) {
  return npcRows
    .filter((row) => !row.area || !locationByCode.has(row.area))
    .map((row) => Number(row.index))
    .sort((a, b) => a - b)
    .map((character_id, sort_order) => ({ character_id, sort_order }));
}

function styleIdsFromRow(row) {
  return [row.liansuo_fg1, row.liansuo_fg2].map(Number).filter((id) => id > 0);
}

function maxLevelDetailRow(detailRows, martialIndex) {
  const rows = detailRows.slice(martialIndex * 10, martialIndex * 10 + 10);
  return rows.filter((row) => Number(row.weili) > 0).sort((a, b) => b.lv - a.lv)[0];
}

function passivesFromRawDetail(detailRow) {
  const passives = [];
  const hp = Number(detailRow?.hp);
  const zhenqiup = Number(detailRow?.zhenqiup);
  if (Number.isFinite(hp) && hp > 0) passives.push(`体力值+${roundNumber(hp, 0)}`);
  if (Number.isFinite(zhenqiup) && zhenqiup > 0) passives.push(`真气增加速度+${roundNumber(zhenqiup)}%`);
  return passives;
}

function buildMartialArtRows(wugongRows, detailRows) {
  return wugongRows.map((row, index) => {
    const typeId = Number(row.type);
    const maxDetail = maxLevelDetailRow(detailRows, index);
    const obtainMethod = cleanText(row.huodefangfa);
    return {
      id: Number(row.index ?? index),
      internal_name: row.name ?? null,
      name: row.chnname,
      sect_id: Number(row.liansuo_mp),
      type_id: typeId,
      rarity_id: Number(row.rare),
      power: typeId === 6 || !maxDetail ? null : roundNumber(maxDetail.weili),
      cost: typeId === 6 ? null : Number(row.cost),
      obtain_method: obtainMethod,
      is_sect_restricted: boolInt(obtainMethod && obtainMethod.startsWith("武林大会奖品")),
      special: null,
    };
  });
}

function buildMartialArtStyleRows(wugongRows) {
  return wugongRows.flatMap((row, index) =>
    styleIdsFromRow(row).map((styleId, slot) => ({
      martial_art_id: Number(row.index ?? index),
      slot,
      style_id: styleId,
    })),
  );
}

function buildMartialArtEffectRows(wugongRows, detailRows) {
  return wugongRows.flatMap((row, index) => {
    const detail = maxLevelDetailRow(detailRows, index);
    return [1, 2, 3]
      .map((slot) => ({
        martial_art_id: Number(row.index ?? index),
        slot,
        effect_id: Number(row[`buff${slot}`]),
        level: Number(detail?.[`b${slot}value`] ?? 0),
      }))
      .filter((item) => Number.isFinite(item.effect_id) && item.effect_id !== 99 && item.level >= 0);
  });
}

function buildMartialArtPassiveRows(wugongRows, detailRows) {
  return wugongRows.flatMap((row, index) => {
    if (Number(row.type) !== 6) return [];
    const detail = detailRows.slice(index * 10, index * 10 + 10).sort((a, b) => b.lv - a.lv)[0];
    return passivesFromRawDetail(detail).map((text, slot) => ({
      martial_art_id: Number(row.index ?? index),
      slot,
      text,
    }));
  });
}

function buildChainRows(chainRows, idName, outputName) {
  const groups = new Map();
  for (const row of chainRows) {
    const styleId = Number(row.fengge);
    const sectId = Number(row.menpai);
    const groupId = idName === "sect_id" ? sectId : styleId;
    if (idName === "sect_id" && (styleId !== 0 || sectId === 15)) continue;
    if (idName === "style_id" && styleId === 0) continue;
    if (!groups.has(groupId)) groups.set(groupId, []);
    groups.get(groupId).push({ [outputName]: groupId, count: Number(row.qty), effect: row.desc });
  }
  return [...groups.values()].flat().sort((a, b) => a[outputName] - b[outputName] || a.count - b.count);
}

function buildStatusEffectRows(enumTypes) {
  return Object.entries(enumTypes.BuffType || {})
    .filter(([id]) => STATUS_EFFECT_META[Number(id)])
    .map(([id, name]) => ({
      id: Number(id),
      name,
      ...STATUS_EFFECT_META[Number(id)],
    }))
    .sort((a, b) => a.id - b.id);
}

function buildCustomMartialArtRows(wugongRows) {
  return wugongRows.map((row, id) => ({
    id,
    name: row.chnname,
    type_id: Number(row.type),
    rarity_id: Number(row.rare),
    cost: Number(row.cost),
    slash_effect_id: Number(row.slashfx),
    hit_effect_id: Number(row.hitfx),
    attack_area_name: row.attackareaname,
    is_custom: boolInt(row.iszichuang),
  }));
}

function buildCustomMartialArtEffectRows(wugongRows) {
  return wugongRows.flatMap((row, id) =>
    [1, 2, 3]
      .map((slot) => ({
        custom_martial_art_id: id,
        slot,
        effect_id: Number(row[`buff${slot}`]),
        target_id: Number(row[`bufftarget${slot}`]),
      }))
      .filter((item) => Number.isFinite(item.effect_id) && item.effect_id !== 99),
  );
}

function buildCustomStyleWeightRows(chainRows) {
  return chainRows.map((row, id) => ({
    id,
    style_id: Number(row.fengge),
    weight: Number(row.qty),
  }));
}

function buildCustomPowerRows(rows) {
  return rows.map((row, id) => ({
    id,
    weapon_type_id: Number(row.bingqitype),
    rarity_id: Number(row.rare),
    cost: Number(row.cost),
    power_min: Number(row.weilimin),
    power_max: Number(row.weilimax),
    percent_min: Number(row.percentmin),
    percent_max: Number(row.percentmax),
  }));
}

function buildCustomEffectRateRows(rows) {
  return rows.map((row, id) => ({
    id,
    rarity_id: Number(row.rare),
    effect_id: Number(row.bufftype),
    target_id: Number(row.bufftarget),
    level: Number(row.value),
    percent: Number(row.percent),
  }));
}

function sqliteIdentifier(name) {
  return `"${name.replaceAll('"', '""')}"`;
}

function columnAffinity(type) {
  if (type.includes("INTEGER")) return "INTEGER";
  if (type.includes("REAL")) return "REAL";
  return "TEXT";
}

function coerceValue(value, type) {
  if (value === "" || value === undefined) return null;
  const affinity = columnAffinity(type);
  if (affinity === "INTEGER") return value === null ? null : Number.parseInt(value, 10);
  if (affinity === "REAL") return value === null ? null : Number.parseFloat(value);
  return value;
}

function createTable(db, name, definition) {
  const columns = Object.entries(definition.columns).map(([column, type]) => `${sqliteIdentifier(column)} ${type}`);
  if (definition.primaryKey?.length) {
    columns.push(`PRIMARY KEY (${definition.primaryKey.map(sqliteIdentifier).join(", ")})`);
  }
  db.exec(`CREATE TABLE ${sqliteIdentifier(name)} (${columns.join(", ")})`);
}

function importTable(db, name, definition, rows) {
  const columns = Object.keys(definition.columns);
  const placeholders = columns.map(() => "?").join(", ");
  const insert = db.prepare(
    `INSERT INTO ${sqliteIdentifier(name)} (${columns.map(sqliteIdentifier).join(", ")}) VALUES (${placeholders})`,
  );

  for (const row of rows) {
    insert.run(...columns.map((column) => coerceValue(row[column], definition.columns[column])));
  }
  return rows.length;
}

function buildRowsFromSource(source, enumSource) {
  if (!existsSync(source)) {
    throw new Error(`找不到原始数据库文件：${source}`);
  }

  const extracted = extractTables(source);
  const wugongRows = tableByName(extracted, "GWuGong");
  const wugongDetailRows = tableByName(extracted, "GWuGongDetail");
  const chainRows = tableByName(extracted, "GLianSuo");
  const customPowerRows = tableByName(extracted, "GZiChuangWeiLi");
  const customBuffRows = tableByName(extracted, "GZiChuangBuff");
  const npcRows = tableByName(extracted, "Npc");
  const areaRows = tableByName(extracted, "Area");
  const npcMartialRows = tableByName(extracted, "GNpcWuGong");
  const npcAttributeRows = tableByName(extracted, "GNpcAttribute");
  const npcWordRows = tableByName(extracted, "NPC_Word");
  const enumTypes = buildEnumTypes({ enumSource, areaRows, chainRows });
  const { locationByCode, locationById } = buildLocationLookups(areaRows);

  return {
    enums: enumRows(enumTypes),
    characters: buildCharacterRows(npcRows, npcWordRows, locationByCode),
    character_friends: buildCharacterFriendRows(npcRows),
    character_martial_arts: buildCharacterMartialRows(npcRows, npcMartialRows),
    character_attribute_snapshots: buildCharacterAttributeSnapshotRows(npcRows, npcAttributeRows),
    locations: buildLocationRows(areaRows, npcRows, locationByCode, locationById),
    location_characters: buildLocationCharacterRows(npcRows, locationByCode),
    unplaced_characters: buildUnplacedCharacterRows(npcRows, locationByCode),
    martial_arts: buildMartialArtRows(wugongRows, wugongDetailRows),
    martial_art_styles: buildMartialArtStyleRows(wugongRows),
    martial_art_effects: buildMartialArtEffectRows(wugongRows, wugongDetailRows),
    martial_art_passives: buildMartialArtPassiveRows(wugongRows, wugongDetailRows),
    status_effects: buildStatusEffectRows(enumTypes),
    sect_chains: buildChainRows(chainRows, "sect_id", "sect_id"),
    style_chains: buildChainRows(chainRows, "style_id", "style_id"),
    custom_martial_arts: buildCustomMartialArtRows(wugongRows),
    custom_martial_art_effects: buildCustomMartialArtEffectRows(wugongRows),
    custom_style_weights: buildCustomStyleWeightRows(chainRows),
    custom_martial_power_ranges: buildCustomPowerRows(customPowerRows),
    custom_martial_effect_rates: buildCustomEffectRateRows(customBuffRows),
  };
}

export function buildSqlite({
  source = DEFAULT_SOURCE,
  enumSource = DEFAULT_ENUM_SOURCE,
  output = OUTPUT,
} = {}) {
  const rowsByTable = buildRowsFromSource(source, enumSource);
  mkdirSync(dirname(output), { recursive: true });
  rmSync(output, { force: true });

  const db = new DatabaseSync(output);
  db.exec("PRAGMA journal_mode = DELETE");
  db.exec("PRAGMA foreign_keys = OFF");
  db.exec("BEGIN");

  const counts = {};
  try {
    for (const [name, definition] of Object.entries(TABLES)) {
      createTable(db, name, definition);
      counts[name] = importTable(db, name, definition, rowsByTable[name] || []);
    }
    for (const statement of INDEXES) db.exec(statement);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    db.close();
    throw error;
  }

  db.exec("VACUUM");
  db.close();

  return {
    source: relative(ROOT, source).replaceAll("\\", "/"),
    output: relative(ROOT, output).replaceAll("\\", "/"),
    tables: counts,
  };
}

function main() {
  const source = process.argv[2] || DEFAULT_SOURCE;
  const output = process.argv[3] || OUTPUT;
  const enumSource = process.argv[4] || DEFAULT_ENUM_SOURCE;
  const result = buildSqlite({ source, output, enumSource });
  console.log(`Wrote ${join(ROOT, result.output)}`);
  for (const [name, count] of Object.entries(result.tables)) {
    console.log(`${name}: ${count}`);
  }
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
