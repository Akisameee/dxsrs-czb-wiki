#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_SOURCE, ROOT, deriveChainEnums, extractTables } from "./lib/bgdatabase.mjs";
import { martialArtPassiveTemplateRows } from "./lib/martial-art-passive-templates.mjs";
import { writeSqlite } from "./sqlite/write-sqlite.mjs";

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

const LEGACY_SECT_TARGET_IDS = new Map([
  ["少林寺", 0],
  ["武当派", 1],
  ["丐帮", 2],
  ["逍遥派", 5],
  ["古墓派", 6],
  ["日月神教", 8],
  ["五毒教", 9],
]);

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
  character_martial_arts: {
    primaryKey: ["character_id", "slot"],
    columns: {
      character_id: "INTEGER NOT NULL",
      slot: "INTEGER NOT NULL",
      level: "INTEGER NOT NULL",
      martial_art_id: "INTEGER NOT NULL",
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
  character_quests: {
    primaryKey: ["id"],
    columns: {
      id: "INTEGER NOT NULL",
      character_id: "INTEGER NOT NULL",
      stage: "INTEGER NOT NULL",
      required_affinity: "INTEGER NOT NULL",
      quest_type_id: "INTEGER NOT NULL",
      reward_item_id: "INTEGER",
      sort_order: "INTEGER NOT NULL",
    },
  },
  character_quest_targets: {
    primaryKey: ["quest_id", "slot"],
    columns: {
      quest_id: "INTEGER NOT NULL",
      slot: "INTEGER NOT NULL",
      target_role: "TEXT NOT NULL",
      target_kind: "TEXT NOT NULL",
      target_id: "INTEGER",
      target_region_id: "INTEGER",
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
  items: {
    primaryKey: ["id"],
    columns: {
      id: "INTEGER NOT NULL",
      icon: "TEXT",
      description: "TEXT",
      type_id: "INTEGER",
      rarity_id: "INTEGER",
      use_type_id: "INTEGER",
      use_text: "TEXT",
      use_value: "REAL",
      use_value2: "INTEGER",
      use_value3: "REAL",
      cost: "REAL",
      required_strength: "INTEGER",
      required_constitution: "INTEGER",
      required_physique: "INTEGER",
      required_agility: "INTEGER",
      required_cultivation: "INTEGER",
      required_mastery: "INTEGER",
      is_material: "INTEGER NOT NULL",
    },
  },
  martial_arts: {
    primaryKey: ["id"],
    columns: {
      id: "INTEGER NOT NULL",
      sect_id: "INTEGER",
      type_id: "INTEGER",
      rarity_id: "INTEGER",
      attack_area_id: "INTEGER",
      slash_effect_id: "INTEGER",
      hit_effect_id: "INTEGER",
      power: "REAL",
      cost: "INTEGER",
      interval: "INTEGER",
      accuracy: "INTEGER",
      obtain_method: "TEXT",
      is_sect_restricted: "INTEGER NOT NULL",
      is_custom_source: "INTEGER NOT NULL",
      passive_1_id: "INTEGER",
      passive_1_value: "REAL",
      passive_2_id: "INTEGER",
      passive_2_value: "REAL",
      passive_3_id: "INTEGER",
      passive_3_value: "REAL",
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
      target_id: "INTEGER",
      level: "INTEGER NOT NULL",
    },
  },
  martial_art_levels: {
    primaryKey: ["martial_art_id", "level"],
    columns: {
      martial_art_id: "INTEGER NOT NULL",
      level: "INTEGER NOT NULL",
      training_exp: "INTEGER",
      required_strength: "INTEGER",
      required_constitution: "INTEGER",
      required_physique: "INTEGER",
      required_agility: "INTEGER",
      required_mastery: "INTEGER",
      power: "REAL",
      effect_1_level: "INTEGER",
      effect_2_level: "INTEGER",
      effect_3_level: "INTEGER",
      hp: "INTEGER",
      qi_recovery: "REAL",
    },
  },
  martial_art_passive_templates: {
    primaryKey: ["id"],
    columns: {
      id: "TEXT NOT NULL",
      template: "TEXT NOT NULL",
    },
  },
  status_effects: {
    primaryKey: ["id"],
    columns: {
      id: "INTEGER NOT NULL",
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
      type_id: "INTEGER",
      rarity_id: "INTEGER",
      cost: "INTEGER",
      slash_effect_id: "INTEGER",
      hit_effect_id: "INTEGER",
      attack_area_id: "INTEGER",
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
  "CREATE INDEX idx_characters_location ON characters(region_id, location_id)",
  "CREATE INDEX idx_characters_sect ON characters(sect_id)",
  "CREATE INDEX idx_characters_rarity ON characters(rarity_id)",
  "CREATE INDEX idx_characters_weapon ON characters(weapon_type_id)",
  "CREATE INDEX idx_location_characters_character ON location_characters(character_id)",
  "CREATE INDEX idx_character_martial_arts_character ON character_martial_arts(character_id)",
  "CREATE INDEX idx_character_martial_arts_martial ON character_martial_arts(martial_art_id)",
  "CREATE INDEX idx_character_attribute_snapshots_character ON character_attribute_snapshots(character_id)",
  "CREATE INDEX idx_character_quests_character ON character_quests(character_id)",
  "CREATE INDEX idx_character_quests_type ON character_quests(quest_type_id)",
  "CREATE INDEX idx_character_quests_reward_item ON character_quests(reward_item_id)",
  "CREATE INDEX idx_character_quest_targets_quest ON character_quest_targets(quest_id)",
  "CREATE INDEX idx_items_type ON items(type_id)",
  "CREATE INDEX idx_items_rarity ON items(rarity_id)",
  "CREATE INDEX idx_martial_arts_sect ON martial_arts(sect_id)",
  "CREATE INDEX idx_martial_arts_type ON martial_arts(type_id)",
  "CREATE INDEX idx_martial_arts_rarity ON martial_arts(rarity_id)",
  "CREATE INDEX idx_martial_art_styles_style ON martial_art_styles(style_id)",
  "CREATE INDEX idx_martial_art_effects_effect ON martial_art_effects(effect_id)",
  "CREATE INDEX idx_martial_art_levels_martial ON martial_art_levels(martial_art_id)",
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

function namedEnumRows(type, rows, idGetter, labelGetter) {
  return rows
    .map((row, index) => ({
      type,
      id: Number(idGetter(row, index)),
      label: labelGetter(row, index) ?? null,
    }))
    .filter((row) => Number.isFinite(row.id) && row.label !== null && row.label !== undefined && row.label !== "")
    .sort((a, b) => a.id - b.id);
}

function npcName(row) {
  return `${row.xing || ""}${row.ming || ""}` || `NPC ${row.index}`;
}

function attackAreaLookups(wugongRows) {
  const names = [...new Set((wugongRows || []).map((row) => row.attackareaname).filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b), "zh-Hans-CN"));
  const attackAreaByName = new Map(names.map((name, id) => [name, id]));
  const attackAreaEnums = names.map((name, id) => ({ type: "AttackArea", id, label: name }));
  return { attackAreaByName, attackAreaEnums };
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

function characterIdLookup(npcRows) {
  const idByName = new Map();
  for (const row of npcRows) {
    const id = Number(row.index);
    if (row.name) idByName.set(row.name, id);
    idByName.set(npcName(row), id);
  }
  return idByName;
}

function buildCharacterRows(npcRows, npcWordRows, locationByCode) {
  const wordByName = new Map((npcWordRows || []).filter((row) => row.juesename).map((row) => [row.juesename, row.word]));
  return npcRows.map((row) => {
    const location = row.area ? locationByCode.get(row.area) : null;
    const name = npcName(row);
    return {
      id: Number(row.index),
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

function martialArtIdByInternalName(wugongRows) {
  const lookup = new Map();
  const duplicates = [];
  wugongRows.forEach((row, index) => {
    if (!row.name) return;
    const id = Number(row.index ?? index);
    if (lookup.has(row.name)) duplicates.push(row.name);
    lookup.set(row.name, id);
  });

  if (duplicates.length > 0) {
    throw new Error(`GWuGong.name 存在重名，无法安全映射 NPC 武功：${[...new Set(duplicates)].join("、")}`);
  }
  return lookup;
}

function buildCharacterMartialRows(npcRows, npcMartialRows, wugongRows) {
  const idByName = characterIdLookup(npcRows);
  const martialIdByName = martialArtIdByInternalName(wugongRows);
  const missing = [...new Set((npcMartialRows || [])
    .map((row) => row.wugongname)
    .filter((name) => name && !martialIdByName.has(name)))];

  if (missing.length > 0) {
    throw new Error(`GNpcWuGong.wugongname 无法映射到 GWuGong.name：${missing.join("、")}`);
  }

  return (npcMartialRows || [])
    .filter((row) => idByName.has(row.juesename) && martialIdByName.has(row.wugongname))
    .sort((a, b) => (
      idByName.get(a.juesename) - idByName.get(b.juesename)
      || Number(a.lv) - Number(b.lv)
      || martialIdByName.get(a.wugongname) - martialIdByName.get(b.wugongname)
    ))
    .map((row, slot) => ({
      character_id: idByName.get(row.juesename),
      slot,
      level: Number(row.lv),
      martial_art_id: martialIdByName.get(row.wugongname),
      martial_level: Number(row.wugonglv),
    }));
}

function buildCharacterAttributeSnapshotRows(npcRows, npcAttributeRows) {
  const idByName = characterIdLookup(npcRows);
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

function buildItemLookups(itemRows) {
  const itemByName = new Map();
  const duplicates = [];
  for (const row of itemRows || []) {
    const item = {
      id: Number(row.index),
    };
    for (const name of [row.name, row.chnname].filter(Boolean)) {
      if (itemByName.has(name) && itemByName.get(name).id !== item.id) duplicates.push(name);
      itemByName.set(name, item);
    }
  }
  if (duplicates.length > 0) {
    throw new Error(`GItem 名称存在重名，无法安全映射物品：${[...new Set(duplicates)].join("、")}`);
  }
  return { itemByName };
}

function buildItemRows(itemRows) {
  return itemRows.map((row) => ({
    id: Number(row.index),
    icon: row.png || null,
    description: cleanText(row.desc),
    type_id: Number(row.type),
    rarity_id: Number(row.rare),
    use_type_id: Number(row.usetype),
    use_text: cleanText(row.usestring),
    use_value: Number(row.usevalue),
    use_value2: Number(row.usevalue2),
    use_value3: Number(row.usevalue3),
    cost: Number(row.ccost),
    required_strength: Number(row.xianzhi_lvli),
    required_constitution: Number(row.xianzhi_gengu),
    required_physique: Number(row.xianzhi_tipo),
    required_agility: Number(row.xianzhi_shenfa),
    required_cultivation: Number(row.xianzhi_xiuwei),
    required_mastery: Number(row.xianzhi_jingtong),
    is_material: boolInt(row.iscailiao),
  }));
}

function resolveQuestTarget(rawValue, lookups) {
  if (!rawValue) return null;

  const location = lookups.locationByCode.get(rawValue);
  if (location) {
    return {
      target_kind: "location",
      target_id: location.locationId,
      target_region_id: location.regionId,
    };
  }

  const characterId = lookups.characterIdByName.get(rawValue);
  if (characterId !== undefined) {
    return {
      target_kind: "character",
      target_id: characterId,
      target_region_id: null,
    };
  }

  const item = lookups.itemByName.get(rawValue);
  if (item) {
    return {
      target_kind: "item",
      target_id: item.id,
      target_region_id: null,
    };
  }

  const sectId = LEGACY_SECT_TARGET_IDS.get(rawValue);
  if (sectId !== undefined) {
    return {
      target_kind: "sect",
      target_id: sectId,
      target_region_id: null,
    };
  }

  return {
    target_kind: "unknown",
    target_id: null,
    target_region_id: null,
  };
}

function buildCharacterQuestData(qingYuanRows, npcRows, areaRows, itemRows, locationByCode) {
  const characterIdByName = characterIdLookup(npcRows);
  const { itemByName } = buildItemLookups(itemRows);
  const locationLookup = new Map();
  for (const [code, location] of locationByCode.entries()) {
    locationLookup.set(code, location);
  }

  const rows = (qingYuanRows || [])
    .filter((row) => characterIdByName.has(row.juesename))
    .sort((a, b) =>
      characterIdByName.get(a.juesename) - characterIdByName.get(b.juesename)
      || Number(a.youhaodu) - Number(b.youhaodu)
      || Number(a.index) - Number(b.index),
    );
  const missingRewards = [...new Set(rows
    .map((row) => row.reward)
    .filter((reward) => reward && !itemByName.has(reward)))];
  if (missingRewards.length > 0) {
    throw new Error(`QingYuan.reward 无法映射到 GItem：${missingRewards.join("、")}`);
  }

  const stageByCharacter = new Map();
  const quests = [];
  const targets = [];
  const lookups = {
    characterIdByName,
    itemByName,
    locationByCode: locationLookup,
  };

  rows.forEach((row, sortOrder) => {
    const characterId = characterIdByName.get(row.juesename);
    const stage = (stageByCharacter.get(characterId) || 0) + 1;
    stageByCharacter.set(characterId, stage);

    const questId = Number(row.index);
    quests.push({
      id: questId,
      character_id: characterId,
      stage,
      required_affinity: Number(row.youhaodu),
      quest_type_id: Number(row.questtype),
      reward_item_id: row.reward ? itemByName.get(row.reward).id : null,
      sort_order: sortOrder,
    });

    const targetValues = [
      { role: "main", value: row.missiontarget },
      { role: "extra", value: row.strparam1 },
      { role: "extra", value: row.strparam2 },
    ].filter((item) => item.value);

    targetValues.forEach((item, slot) => {
      targets.push({
        quest_id: questId,
        slot,
        target_role: item.role,
        ...resolveQuestTarget(item.value, lookups),
      });
    });
  });

  return { quests, targets };
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

function highestLevelDetailRow(detailRows, martialIndex) {
  return detailRows.slice(martialIndex * 10, martialIndex * 10 + 10).sort((a, b) => b.lv - a.lv)[0];
}

function buildMartialArtRows(wugongRows, detailRows, attackAreaByName) {
  return wugongRows.map((row, index) => {
    const typeId = Number(row.type);
    const maxDetail = maxLevelDetailRow(detailRows, index);
    const highestDetail = highestLevelDetailRow(detailRows, index);
    const obtainMethod = cleanText(row.huodefangfa);
    return {
      id: Number(row.index ?? index),
      sect_id: Number(row.liansuo_mp),
      type_id: typeId,
      rarity_id: Number(row.rare),
      attack_area_id: attackAreaByName.get(row.attackareaname) ?? null,
      slash_effect_id: Number(row.slashfx),
      hit_effect_id: Number(row.hitfx),
      power: typeId === 6 || !maxDetail ? null : roundNumber(maxDetail.weili),
      cost: typeId === 6 ? null : Number(row.cost),
      interval: Number(row.jiange),
      accuracy: Number(row.mingzhong),
      obtain_method: obtainMethod,
      is_sect_restricted: boolInt(obtainMethod && obtainMethod.startsWith("武林大会奖品")),
      is_custom_source: boolInt(row.iszichuang),
      passive_1_id: Number(row.beidong1) || null,
      passive_1_value: Number(highestDetail?.b1value ?? 0),
      passive_2_id: Number(row.beidong2) || null,
      passive_2_value: Number(highestDetail?.b2value ?? 0),
      passive_3_id: Number(row.beidong3) || null,
      passive_3_value: Number(highestDetail?.b3value ?? 0),
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
        target_id: Number(row[`bufftarget${slot}`]),
        level: Number(detail?.[`b${slot}value`] ?? 0),
      }))
      .filter((item) => Number.isFinite(item.effect_id) && item.effect_id !== 99 && item.level >= 0);
  });
}

function buildMartialArtLevelRows(wugongRows, detailRows) {
  const martialIdByName = martialArtIdByInternalName(wugongRows);
  return detailRows
    .filter((row) => martialIdByName.has(row.wugongname))
    .map((row) => ({
      martial_art_id: martialIdByName.get(row.wugongname),
      level: Number(row.lv),
      training_exp: Number(row.maxexp),
      required_strength: Number(row.xiulian_lvli),
      required_constitution: Number(row.xiulian_gengu),
      required_physique: Number(row.xiulian_tipo),
      required_agility: Number(row.xiulian_shenfa),
      required_mastery: Number(row.xiulian_wuyi),
      power: roundNumber(row.weili),
      effect_1_level: Number(row.b1value),
      effect_2_level: Number(row.b2value),
      effect_3_level: Number(row.b3value),
      hp: Number(row.hp),
      qi_recovery: roundNumber(row.zhenqiup),
    }))
    .sort((a, b) => a.martial_art_id - b.martial_art_id || a.level - b.level);
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
    .map(([id]) => ({
      id: Number(id),
      ...STATUS_EFFECT_META[Number(id)],
    }))
    .sort((a, b) => a.id - b.id);
}

function buildCustomMartialArtRows(wugongRows, attackAreaByName) {
  return wugongRows.map((row, id) => ({
    id,
    type_id: Number(row.type),
    rarity_id: Number(row.rare),
    cost: Number(row.cost),
    slash_effect_id: Number(row.slashfx),
    hit_effect_id: Number(row.hitfx),
    attack_area_id: attackAreaByName.get(row.attackareaname) ?? null,
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
  const qingYuanRows = tableByName(extracted, "QingYuan");
  const itemRows = tableByName(extracted, "GItem");
  const enumTypes = buildEnumTypes({ enumSource, areaRows, chainRows });
  const { locationByCode, locationById } = buildLocationLookups(areaRows);
  const { attackAreaByName, attackAreaEnums } = attackAreaLookups(wugongRows);
  const characterQuestData = buildCharacterQuestData(qingYuanRows, npcRows, areaRows, itemRows, locationByCode);
  const displayEnumRows = [
    ...namedEnumRows("Character", npcRows, (row) => row.index, npcName),
    ...namedEnumRows("MartialArt", wugongRows, (row, index) => row.index ?? index, (row) => row.chnname),
    ...namedEnumRows("Item", itemRows, (row) => row.index, (row) => row.chnname || row.name),
    ...attackAreaEnums,
  ];

  return {
    enums: [...enumRows(enumTypes), ...displayEnumRows],
    characters: buildCharacterRows(npcRows, npcWordRows, locationByCode),
    character_martial_arts: buildCharacterMartialRows(npcRows, npcMartialRows, wugongRows),
    character_attribute_snapshots: buildCharacterAttributeSnapshotRows(npcRows, npcAttributeRows),
    character_quests: characterQuestData.quests,
    character_quest_targets: characterQuestData.targets,
    locations: buildLocationRows(areaRows, npcRows, locationByCode, locationById),
    location_characters: buildLocationCharacterRows(npcRows, locationByCode),
    unplaced_characters: buildUnplacedCharacterRows(npcRows, locationByCode),
    items: buildItemRows(itemRows),
    martial_arts: buildMartialArtRows(wugongRows, wugongDetailRows, attackAreaByName),
    martial_art_styles: buildMartialArtStyleRows(wugongRows),
    martial_art_effects: buildMartialArtEffectRows(wugongRows, wugongDetailRows),
    martial_art_levels: buildMartialArtLevelRows(wugongRows, wugongDetailRows),
    martial_art_passive_templates: martialArtPassiveTemplateRows(),
    status_effects: buildStatusEffectRows(enumTypes),
    sect_chains: buildChainRows(chainRows, "sect_id", "sect_id"),
    style_chains: buildChainRows(chainRows, "style_id", "style_id"),
    custom_martial_arts: buildCustomMartialArtRows(wugongRows, attackAreaByName),
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
  const counts = writeSqlite({
    output,
    tables: TABLES,
    indexes: INDEXES,
    rowsByTable,
  });

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
