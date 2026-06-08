import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

const dbPath = join(process.cwd(), "public/data/wiki.sqlite");

function withDb(callback) {
  const db = new DatabaseSync(dbPath);
  try {
    return callback(db);
  } finally {
    db.close();
  }
}

function queryRows(db, sql, params = []) {
  return db.prepare(sql).all(...params);
}

function queryRow(db, sql, params = []) {
  return db.prepare(sql).get(...params);
}

function bool(value) {
  return Boolean(Number(value));
}

export function loadEnumTypesFromWikiDb() {
  return withDb((db) => {
    const enumTypes = {};
    for (const row of queryRows(db, "SELECT type, id, label FROM enums ORDER BY type, id")) {
      if (!enumTypes[row.type]) enumTypes[row.type] = {};
      enumTypes[row.type][String(row.id)] = row.label;
    }
    return enumTypes;
  });
}

function mapCharacter(row, extras) {
  const location = row.region_id === null || row.location_id === null
    ? null
    : { regionId: Number(row.region_id), locationId: Number(row.location_id) };

  return {
    index: Number(row.id),
    name: row.name,
    portrait: row.portrait,
    location,
    identity: {
      sectId: Number(row.sect_id),
      sex: Number(row.sex_id),
      rare: Number(row.rarity_id),
      rank: Number(row.rank_id),
      position: Number(row.position_id),
      level: Number(row.level),
      likeRare: Number(row.favorite_rarity_id),
      fame: Number(row.fame),
      chivalry: Number(row.chivalry),
      gold: Number(row.gold),
      friends: extras.friends,
      isInstructor: bool(row.is_instructor),
      isManager: bool(row.is_manager),
    },
    combat: {
      weaponTypeId: Number(row.weapon_type_id),
      growthTypeId: Number(row.growth_type_id),
      martialTypeId: Number(row.martial_type_id),
      equipment: {
        weapon: row.equipment_weapon,
        armor: row.equipment_armor,
        otherWeapon: row.equipment_other_weapon,
      },
      attributes: {
        strength: Number(row.strength),
        constitution: Number(row.constitution),
        physique: Number(row.physique),
        agility: Number(row.agility),
      },
      proficiencies: {
        cultivation: Number(row.cultivation),
        fist: Number(row.fist),
        bladeSword: Number(row.blade_sword),
        spearStaff: Number(row.spear_staff),
        hiddenWeapon: Number(row.hidden_weapon),
        internal: Number(row.internal),
      },
    },
    growth: {
      initialValue: Number(row.growth_initial_value),
      finalValue: Number(row.growth_final_value),
      baseLevel: Number(row.growth_base_level),
      baseAttributes: {
        strength: Number(row.base_strength),
        constitution: Number(row.base_constitution),
        physique: Number(row.base_physique),
        agility: Number(row.base_agility),
      },
      attributeGrowth: {
        strength: Number(row.growth_strength),
        constitution: Number(row.growth_constitution),
        physique: Number(row.growth_physique),
        agility: Number(row.growth_agility),
      },
    },
    lifeSkills: {
      mining: Number(row.mining),
      herbGathering: Number(row.herb_gathering),
      hunting: Number(row.hunting),
      forging: Number(row.forging),
      alchemy: Number(row.alchemy),
      sewing: Number(row.sewing),
    },
    martialArts: extras.martialArts,
    attributeSnapshots: extras.attributeSnapshots,
    word: row.word,
  };
}

export function loadCharacterIdsFromWikiDb() {
  return withDb((db) => queryRows(db, "SELECT id FROM characters ORDER BY id").map((row) => row.id));
}

export function loadCharacterFromWikiDb(id) {
  return withDb((db) => {
    const numericId = Number(id);
    const row = queryRow(db, "SELECT * FROM characters WHERE id = ?", [numericId]);
    if (!row) throw new Error(`找不到人物 ${id}`);

    const friends = queryRows(
      db,
      "SELECT name FROM character_friends WHERE character_id = ? ORDER BY slot",
      [numericId],
    ).map((item) => item.name);
    const martialArts = queryRows(
      db,
      "SELECT level, name, martial_level FROM character_martial_arts WHERE character_id = ? ORDER BY level, name",
      [numericId],
    ).map((item) => ({
      level: Number(item.level),
      name: item.name,
      martialLevel: Number(item.martial_level),
    }));
    const attributeSnapshots = queryRows(
      db,
      "SELECT * FROM character_attribute_snapshots WHERE character_id = ? ORDER BY slot",
      [numericId],
    ).map((item) => ({
      lv: item.level,
      gongli: item.power,
      dengji: item.rank_id,
      diwei: item.position_id,
      lvli: item.strength,
      gengu: item.constitution,
      tipo: item.physique,
      shenfa: item.agility,
      xiuwei: item.cultivation,
      quanzhang: item.fist,
      daojian: item.blade_sword,
      qiangbang: item.spear_staff,
      anqi: item.hidden_weapon,
      neigong: item.internal,
      wakuang: item.mining,
      caiyao: item.herb_gathering,
      dalie: item.hunting,
      duanzao: item.forging,
      liandan: item.alchemy,
      caifeng: item.sewing,
      wuqiname: item.weapon,
      fangjuname: item.armor,
      mingsheng: item.fame,
      xiayi: item.chivalry,
    }));

    return mapCharacter(row, { friends, martialArts, attributeSnapshots });
  });
}
