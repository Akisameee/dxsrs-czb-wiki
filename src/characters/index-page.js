import { enumMapFromRows, queryRows } from "../shared/wiki-db.js";
import { bindCharacterInfoTooltip, renderCharacterCard } from "./shared.js";
import { getPaginationAction, pageFromPaginationAction, renderPagination } from "../shared/pagination.js";

const CHARACTER_PAGE_SIZE = 30;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function enumLabel(enums, type, id, fallback = "未知") {
  if (id === null || id === undefined || Number.isNaN(Number(id))) return fallback;
  return enums?.[type]?.[String(id)] ?? fallback;
}

function optionRows(enums, type, allLabel) {
  const entries = Object.entries(enums?.[type] || {})
    .filter(([, label]) => label !== null && label !== undefined && label !== "")
    .sort((a, b) => Number(a[0]) - Number(b[0]));
  return [
    `<option value="">${escapeHtml(allLabel)}</option>`,
    ...entries.map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`),
  ].join("");
}

function buildLocationTree(locations, enums) {
  return locations.regions.map((region) => `
    <details class="location-region">
      <summary>
        <span>${escapeHtml(enumLabel(enums, "DiDian", region.region_id))}</span>
        <strong>${escapeHtml(region.character_count)}</strong>
      </summary>
      <div class="location-list">
        ${region.locations.map((location) => `
          <button class="location-button" type="button" data-location="${escapeHtml(location.location_id)}">
            <span>${escapeHtml(enumLabel(enums, "Area", location.location_id))}</span>
            <strong>${escapeHtml(location.character_count)}</strong>
          </button>
        `).join("")}
      </div>
    </details>
  `).join("");
}

function buildLocations(locationRows, locationCharacterRows, unplacedRows) {
  const characterIdsByLocation = new Map();
  for (const row of locationCharacterRows) {
    const key = `${row.region_id}:${row.location_id}`;
    if (!characterIdsByLocation.has(key)) characterIdsByLocation.set(key, []);
    characterIdsByLocation.get(key).push(Number(row.character_id));
  }

  const regions = new Map();
  for (const row of locationRows) {
    if (!regions.has(row.region_id)) {
      regions.set(row.region_id, {
        region_id: Number(row.region_id),
        character_count: 0,
        locations: [],
      });
    }
    const region = regions.get(row.region_id);
    const characterIds = characterIdsByLocation.get(`${row.region_id}:${row.location_id}`) || [];
    const location = {
      region_id: Number(row.region_id),
      location_id: Number(row.location_id),
      character_count: Number(row.character_count),
      characterIds,
    };
    region.locations.push(location);
    region.character_count += location.character_count;
  }

  return {
    regions: [...regions.values()],
    unplacedCharacterIds: unplacedRows.map((row) => Number(row.character_id)),
  };
}

function initCharactersPage(context) {
  const { characters, locations, enums } = context;
  const byId = new Map(characters.map((character) => [Number(character.id), character]));
  const els = {
    status: document.getElementById("characters-status"),
    search: document.getElementById("character-search"),
    sect: document.getElementById("character-sect"),
    rare: document.getElementById("character-rare"),
    weapon: document.getElementById("character-weapon"),
    martialType: document.getElementById("character-martial-type"),
    all: document.getElementById("location-all"),
    unplaced: document.getElementById("location-unplaced"),
    tree: document.getElementById("location-tree"),
    count: document.getElementById("character-count"),
    pager: document.getElementById("character-pager"),
    list: document.getElementById("character-list"),
  };
  const state = {
    location: null,
    unplaced: false,
    page: 1,
  };

  function selectedLocationIndexes() {
    if (state.unplaced) return new Set(locations.unplacedCharacterIds || []);
    if (!state.location) return null;

    for (const region of locations.regions || []) {
      const location = region.locations.find((item) => String(item.location_id) === state.location);
      if (location) return new Set(location.characterIds || []);
    }
    return new Set();
  }

  function matchesFilters(character) {
    const indexes = selectedLocationIndexes();
    if (indexes && !indexes.has(Number(character.id))) return false;

    const keyword = els.search.value.trim().toLowerCase();
    if (keyword && !character.name.toLowerCase().includes(keyword)) return false;

    if (els.sect.value !== "" && Number(character.sect_id) !== Number(els.sect.value)) return false;
    if (els.rare.value !== "" && Number(character.rarity_id) !== Number(els.rare.value)) return false;
    if (els.weapon.value !== "" && Number(character.weapon_type_id) !== Number(els.weapon.value)) return false;
    if (els.martialType.value !== "" && Number(character.martial_type_id) !== Number(els.martialType.value)) return false;
    return true;
  }

  function sortedCharacters(rows) {
    return [...rows].sort((a, b) => (
      Number(b.rarity_id) - Number(a.rarity_id) ||
      Number(a.sect_id) - Number(b.sect_id) ||
      Number(a.id) - Number(b.id)
    ));
  }

  function setLocation(nextLocation, isUnplaced = false) {
    state.location = nextLocation;
    state.unplaced = isUnplaced;
    state.page = 1;
    for (const button of document.querySelectorAll(".location-button")) {
      const active = (
        (!nextLocation && !isUnplaced && button.id === "location-all") ||
        (isUnplaced && button.id === "location-unplaced") ||
        (button.dataset.location === nextLocation)
      );
      button.classList.toggle("is-active", active);
    }
    render();
  }

  function render() {
    const rows = sortedCharacters(characters.filter(matchesFilters));
    const pageCount = Math.max(1, Math.ceil(rows.length / CHARACTER_PAGE_SIZE));
    state.page = Math.max(1, Math.min(state.page, pageCount));
    const start = (state.page - 1) * CHARACTER_PAGE_SIZE;
    const pageRows = rows.slice(start, start + CHARACTER_PAGE_SIZE);
    const pagerHtml = renderPagination({
      page: state.page,
      pageCount,
    });

    els.count.textContent = `共 ${rows.length} 人`;
    els.list.innerHTML = rows.length
      ? pageRows.map((character) => renderCharacterCard(character, enums)).join("")
      : `<div class="empty-state">没有匹配的人物。</div>`;
    els.pager.innerHTML = pagerHtml;
  }

  function setPage(nextPage) {
    state.page = nextPage;
    render();
    els.list.scrollTop = 0;
  }

  function handlePagerClick(event) {
    const action = getPaginationAction(event);
    if (!action) return;
    const rows = sortedCharacters(characters.filter(matchesFilters));
    const pageCount = Math.max(1, Math.ceil(rows.length / CHARACTER_PAGE_SIZE));
    setPage(pageFromPaginationAction(action, state.page, pageCount));
  }

  els.sect.innerHTML = optionRows(enums, "LianSuo_MP", "全部门派");
  els.rare.innerHTML = optionRows(enums, "NPC_Rare", "全部资质");
  els.weapon.innerHTML = optionRows(enums, "BingQiType", "全部武器");
  els.martialType.innerHTML = optionRows(enums, "NPC_WuGongType", "全部路线");
  els.tree.innerHTML = buildLocationTree(locations, enums);

  els.all.addEventListener("click", () => setLocation(null, false));
  els.unplaced.addEventListener("click", () => setLocation(null, true));
  els.tree.addEventListener("click", (event) => {
    const button = event.target.closest("[data-location]");
    if (!button) return;
    setLocation(button.dataset.location, false);
  });

  for (const input of [els.search, els.sect, els.rare, els.weapon, els.martialType]) {
    input.addEventListener(input === els.search ? "input" : "change", () => {
      state.page = 1;
      render();
    });
  }

  els.pager.addEventListener("click", handlePagerClick);

  els.list.addEventListener("click", (event) => {
    if (!event.target.closest("[data-character-info]")) return;
    event.preventDefault();
  });
  bindCharacterInfoTooltip(els.list, {
    enums,
    getItem: (id) => byId.get(Number(id)),
  });

  els.status.textContent = `已载入 ${characters.length} 个人物，${locations.regions.length} 个一级地点。`;
  render();
}

async function loadData() {
  const [characters, locationRows, locationCharacters, unplacedRows, enumRows] = await Promise.all([
    queryRows("SELECT * FROM characters ORDER BY id"),
    queryRows("SELECT * FROM locations ORDER BY region_id, location_id"),
    queryRows("SELECT * FROM location_characters ORDER BY region_id, location_id, sort_order"),
    queryRows("SELECT * FROM unplaced_characters ORDER BY sort_order"),
    queryRows("SELECT type, id, label FROM enums ORDER BY type, id"),
  ]);
  return {
    characters,
    locations: buildLocations(locationRows, locationCharacters, unplacedRows),
    enums: enumMapFromRows(enumRows),
  };
}

loadData()
  .then(initCharactersPage)
  .catch((error) => {
    const status = document.getElementById("characters-status");
    const list = document.getElementById("character-list");
    status.textContent = "人物数据读取失败";
    list.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
  });
