import initSqlJs from "sql.js";

let dbPromise = null;

function dataRoot() {
  return document.body.dataset.dataRoot || "data/";
}

function dataUrl(path) {
  return new URL(path, new URL(dataRoot(), window.location.href));
}

export async function loadWikiDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const SQL = await initSqlJs({
        locateFile: () => dataUrl("sql-wasm.wasm").toString(),
      });
      const response = await fetch(dataUrl("wiki.sqlite"));
      if (!response.ok) {
        throw new Error(`wiki.sqlite 读取失败：${response.status}`);
      }
      return new SQL.Database(new Uint8Array(await response.arrayBuffer()));
    })();
  }
  return dbPromise;
}

export async function queryRows(sql, params = []) {
  const db = await loadWikiDb();
  const stmt = db.prepare(sql);
  const rows = [];
  try {
    if (params.length > 0) stmt.bind(params);
    while (stmt.step()) rows.push(stmt.getAsObject());
  } finally {
    stmt.free();
  }
  return rows;
}

function groupBy(rows, key) {
  const grouped = new Map();
  for (const row of rows) {
    const value = row[key];
    if (!grouped.has(value)) grouped.set(value, []);
    grouped.get(value).push(row);
  }
  return grouped;
}

function bool(value) {
  return Boolean(Number(value));
}

function mapEnumRows(rows) {
  const enumTypes = {};
  for (const row of rows) {
    if (!enumTypes[row.type]) enumTypes[row.type] = {};
    enumTypes[row.type][String(row.id)] = row.label;
  }
  return enumTypes;
}

export async function loadEnums() {
  return mapEnumRows(await queryRows("SELECT type, id, label FROM enums ORDER BY type, id"));
}

function mapCharacter(row, extras = {}) {
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
      friends: extras.friends || [],
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
    preferences: {
      tea: bool(row.likes_tea),
      wine: bool(row.likes_wine),
      music: bool(row.likes_music),
      chess: bool(row.likes_chess),
      book: bool(row.likes_book),
      painting: bool(row.likes_painting),
    },
    martialArts: extras.martialArts || [],
    attributeSnapshots: extras.attributeSnapshots || [],
    word: row.word,
  };
}

function buildLocations(locationRows, locationCharacterRows, unplacedRows) {
  const charactersByLocation = new Map();
  for (const row of locationCharacterRows) {
    const key = `${row.region_id}:${row.location_id}`;
    if (!charactersByLocation.has(key)) charactersByLocation.set(key, []);
    charactersByLocation.get(key).push({
      id: Number(row.character_id),
      sortOrder: Number(row.sort_order),
    });
  }

  const regions = new Map();
  for (const row of locationRows) {
    const regionId = Number(row.region_id);
    if (!regions.has(regionId)) {
      regions.set(regionId, {
        regionId,
        npcCount: 0,
        locationCount: 0,
        locations: [],
      });
    }

    const key = `${row.region_id}:${row.location_id}`;
    const characterIds = (charactersByLocation.get(key) || [])
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => item.id);
    const location = {
      locationId: Number(row.location_id),
      npcCount: Number(row.character_count),
      characterIds,
    };
    const region = regions.get(regionId);
    region.locations.push(location);
    region.npcCount += location.npcCount;
    region.locationCount += 1;
  }

  return {
    regions: [...regions.values()].sort((a, b) => a.regionId - b.regionId),
    unplacedCharacterIds: unplacedRows
      .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
      .map((row) => Number(row.character_id)),
  };
}

export async function loadCharactersData() {
  const [characters, locations, locationCharacters, unplaced, enums] = await Promise.all([
    queryRows("SELECT * FROM characters ORDER BY id"),
    queryRows("SELECT * FROM locations ORDER BY region_id, location_id"),
    queryRows("SELECT * FROM location_characters ORDER BY region_id, location_id, sort_order"),
    queryRows("SELECT * FROM unplaced_characters ORDER BY sort_order"),
    loadEnums(),
  ]);

  return {
    characters: characters.map((row) => mapCharacter(row)),
    locations: buildLocations(locations, locationCharacters, unplaced),
    enums,
  };
}

function mapChainRows(rows, idColumn, outputKey) {
  return [...groupBy(rows, idColumn).entries()]
    .map(([id, chains]) => ({
      [outputKey]: Number(id),
      chains: chains
        .sort((a, b) => Number(a.count) - Number(b.count))
        .map((row) => ({ count: Number(row.count), effect: row.effect })),
    }))
    .sort((a, b) => Number(a[outputKey]) - Number(b[outputKey]));
}

export async function loadLoadoutData() {
  const [
    martialArts,
    martialStyles,
    martialEffects,
    martialPassives,
    effects,
    sectChains,
    styleChains,
    enums,
  ] = await Promise.all([
    queryRows("SELECT * FROM martial_arts ORDER BY id"),
    queryRows("SELECT * FROM martial_art_styles ORDER BY martial_art_id, slot"),
    queryRows("SELECT * FROM martial_art_effects ORDER BY martial_art_id, slot"),
    queryRows("SELECT * FROM martial_art_passives ORDER BY martial_art_id, slot"),
    queryRows("SELECT * FROM status_effects ORDER BY id"),
    queryRows("SELECT * FROM sect_chains ORDER BY sect_id, count"),
    queryRows("SELECT * FROM style_chains ORDER BY style_id, count"),
    loadEnums(),
  ]);
  const stylesByMartial = groupBy(martialStyles, "martial_art_id");
  const effectsByMartial = groupBy(martialEffects, "martial_art_id");
  const passivesByMartial = groupBy(martialPassives, "martial_art_id");

  return {
    wuxue: martialArts.map((row) => ({
      id: Number(row.id),
      name: row.name,
      sectId: Number(row.sect_id),
      styleIds: (stylesByMartial.get(row.id) || []).map((item) => Number(item.style_id)),
      typeId: Number(row.type_id),
      rare: Number(row.rarity_id),
      power: row.power === null ? undefined : Number(row.power),
      cost: row.cost === null ? undefined : Number(row.cost),
      effect: (effectsByMartial.get(row.id) || []).map((item) => ({
        id: Number(item.effect_id),
        level: Number(item.level),
      })),
      passives: (passivesByMartial.get(row.id) || []).map((item) => item.text),
      special: row.special,
      obtainMethod: row.obtain_method,
      sectRestricted: bool(row.is_sect_restricted),
    })),
    effects: effects.map((row) => ({
      id: Number(row.id),
      name: row.name,
      valuePerLevel: row.value_per_level === null ? null : Number(row.value_per_level),
      template: row.template,
    })),
    sectChains: mapChainRows(sectChains, "sect_id", "sectId"),
    styleChains: mapChainRows(styleChains, "style_id", "styleId"),
    enums,
  };
}

export async function loadSelfCreateData() {
  const [templates, templateEffects, styleWeights, powerRanges, effectRates, effects, enums] = await Promise.all([
    queryRows("SELECT * FROM custom_martial_arts ORDER BY id"),
    queryRows("SELECT * FROM custom_martial_art_effects ORDER BY custom_martial_art_id, slot"),
    queryRows("SELECT * FROM custom_style_weights ORDER BY id"),
    queryRows("SELECT * FROM custom_martial_power_ranges ORDER BY id"),
    queryRows("SELECT * FROM custom_martial_effect_rates ORDER BY id"),
    queryRows("SELECT * FROM status_effects ORDER BY id"),
    loadEnums(),
  ]);
  const effectsByTemplate = groupBy(templateEffects, "custom_martial_art_id");

  const data = {
    wugongRows: templates.map((row) => {
      const effectSlots = new Map((effectsByTemplate.get(row.id) || []).map((item) => [Number(item.slot), item]));
      const output = {
        chnname: row.name,
        type: Number(row.type_id),
        rare: Number(row.rarity_id),
        cost: Number(row.cost),
        slashfx: Number(row.slash_effect_id),
        hitfx: Number(row.hit_effect_id),
        attackareaname: row.attack_area_name,
        iszichuang: bool(row.is_custom),
      };
      for (let slot = 1; slot <= 3; slot += 1) {
        const effect = effectSlots.get(slot);
        output[`buff${slot}`] = effect ? Number(effect.effect_id) : 99;
        output[`bufftarget${slot}`] = effect ? Number(effect.target_id) : 1;
      }
      return output;
    }),
    chainRows: styleWeights.map((row) => ({
      fengge: Number(row.style_id),
      qty: Number(row.weight),
    })),
    ziChuangWeiLiRows: powerRanges.map((row) => ({
      bingqitype: Number(row.weapon_type_id),
      rare: Number(row.rarity_id),
      cost: Number(row.cost),
      weilimin: Number(row.power_min),
      weilimax: Number(row.power_max),
      percentmin: Number(row.percent_min),
      percentmax: Number(row.percent_max),
    })),
    ziChuangBuffRows: effectRates.map((row) => ({
      rare: Number(row.rarity_id),
      bufftype: Number(row.effect_id),
      bufftarget: Number(row.target_id),
      value: Number(row.level),
      percent: Number(row.percent),
    })),
  };

  return {
    data,
    enums,
    effects: effects.map((row) => ({
      id: Number(row.id),
      name: row.name,
      valuePerLevel: row.value_per_level === null ? null : Number(row.value_per_level),
      template: row.template,
    })),
    effectNames: new Map(effects.map((item) => [Number(item.id), item.name])),
  };
}
