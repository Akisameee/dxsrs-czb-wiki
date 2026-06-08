import { loadCharactersData } from "../shared/wiki-db.js";

const SITE_ROOT = (document.body.dataset.dataRoot || "data/").replace(/data\/?$/, "");

function pagePath(path) {
  return `${SITE_ROOT}${path}`;
}

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

function locationText(character, enums) {
  const location = character.location;
  if (!location) return "无地点";
  return `${enumLabel(enums, "DiDian", location.regionId)} / ${enumLabel(enums, "Area", location.locationId)}`;
}

function numberText(value, digits = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return digits > 0 ? number.toFixed(digits) : String(Math.round(number));
}

function statRow(label, value) {
  return `
    <div class="character-stat">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function tag(text, className = "") {
  return `<span class="tag ${className}">${escapeHtml(text)}</span>`;
}

function renderMartialArts(character) {
  if (!character.martialArts.length) return `<div class="empty-state compact">暂无武功配置</div>`;

  const byLevel = new Map();
  for (const item of character.martialArts) {
    if (!byLevel.has(item.level)) byLevel.set(item.level, []);
    byLevel.get(item.level).push(item);
  }

  return [...byLevel.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([level, rows]) => `
      <div class="character-skill-row">
        <span>Lv ${escapeHtml(level)}</span>
        <div>
          ${rows.map((item) => tag(`${item.name} ${item.martialLevel}`, "is-skill")).join("")}
        </div>
      </div>
    `)
    .join("");
}

function renderSnapshots(character) {
  if (!character.attributeSnapshots.length) return "";
  return `
    <section class="character-detail-section">
      <h3>成长快照</h3>
      <div class="character-snapshot-list">
        ${character.attributeSnapshots.map((item) => `
          <div class="character-snapshot">
            <strong>Lv ${escapeHtml(item.lv)}</strong>
            <span>四维 ${escapeHtml(item.lvli)} / ${escapeHtml(item.gengu)} / ${escapeHtml(item.tipo)} / ${escapeHtml(item.shenfa)}</span>
            <span>精通 ${escapeHtml(item.quanzhang)} / ${escapeHtml(item.daojian)} / ${escapeHtml(item.qiangbang)} / ${escapeHtml(item.anqi)} / ${escapeHtml(item.neigong)}</span>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function renderCharacterCard(character, enums) {
  const identity = character.identity;
  const combat = character.combat;

  const tags = [
    tag(enumLabel(enums, "LianSuo_MP", identity.sectId, "未知门派"), "sect"),
    tag(enumLabel(enums, "NPC_Rare", identity.rare, "未知品质"), `rarity rarity-npc-${identity.rare}`),
    tag(enumLabel(enums, "BingQiType", combat.weaponTypeId, "未知武器")),
    tag(enumLabel(enums, "NPC_WuGongType", combat.martialTypeId, "未知路线")),
    identity.isInstructor ? tag("教头") : "",
    identity.isManager ? tag("管事人") : "",
  ].filter(Boolean).join("");

  return `
    <a class="character-card character-card-link" href="${escapeHtml(pagePath(`characters/${character.index}/`))}">
        <div class="character-card-main">
          <strong>${escapeHtml(character.name)}</strong>
          <span>${escapeHtml(locationText(character, enums))}</span>
        </div>
        <div class="tag-row">${tags}</div>
        <span class="character-card-action">查看详情</span>
    </a>
  `;
}

function buildLocationTree(locations, enums) {
  return locations.regions.map((region) => `
    <details class="location-region">
      <summary>
        <span>${escapeHtml(enumLabel(enums, "DiDian", region.regionId))}</span>
        <strong>${escapeHtml(region.npcCount)}</strong>
      </summary>
      <div class="location-list">
        ${region.locations.map((location) => `
          <button class="location-button" type="button" data-location="${escapeHtml(location.locationId)}">
            <span>${escapeHtml(enumLabel(enums, "Area", location.locationId))}</span>
            <strong>${escapeHtml(location.npcCount)}</strong>
          </button>
        `).join("")}
      </div>
    </details>
  `).join("");
}

function initCharactersPage(context) {
  const { characters, locations, enums } = context;
  const byIndex = new Map(characters.map((character) => [Number(character.index), character]));
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
    list: document.getElementById("character-list"),
  };
  const state = {
    location: null,
    unplaced: false,
  };

  function selectedLocationIndexes() {
    if (state.unplaced) return new Set(locations.unplacedCharacterIds || []);
    if (!state.location) return null;

    for (const region of locations.regions || []) {
      const location = region.locations.find((item) => String(item.locationId) === state.location);
      if (location) return new Set(location.characterIds || []);
    }
    return new Set();
  }

  function matchesFilters(character) {
    const indexes = selectedLocationIndexes();
    if (indexes && !indexes.has(Number(character.index))) return false;

    const keyword = els.search.value.trim().toLowerCase();
    if (keyword && !character.name.toLowerCase().includes(keyword)) return false;

    if (els.sect.value !== "" && Number(character.identity.sectId) !== Number(els.sect.value)) return false;
    if (els.rare.value !== "" && Number(character.identity.rare) !== Number(els.rare.value)) return false;
    if (els.weapon.value !== "" && Number(character.combat.weaponTypeId) !== Number(els.weapon.value)) return false;
    if (els.martialType.value !== "" && Number(character.combat.martialTypeId) !== Number(els.martialType.value)) return false;
    return true;
  }

  function sortedCharacters(rows) {
    return [...rows].sort((a, b) => (
      b.identity.rare - a.identity.rare ||
      a.identity.sectId - b.identity.sectId ||
      a.index - b.index
    ));
  }

  function setLocation(nextLocation, isUnplaced = false) {
    state.location = nextLocation;
    state.unplaced = isUnplaced;
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
    els.count.textContent = `共 ${rows.length} 人`;
    els.list.innerHTML = rows.length
      ? rows.map((character) => renderCharacterCard(character, enums)).join("")
      : `<div class="empty-state">没有匹配的人物。</div>`;
  }

  els.sect.innerHTML = optionRows(enums, "LianSuo_MP", "全部门派");
  els.rare.innerHTML = optionRows(enums, "NPC_Rare", "全部品质");
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
    input.addEventListener(input === els.search ? "input" : "change", render);
  }

  els.status.textContent = `已载入 ${characters.length} 个人物，${locations.regions.length} 个一级地点。`;
  render();

  window.__charactersByIndex = byIndex;
}

async function loadData() {
  return loadCharactersData();
}

loadData()
  .then(initCharactersPage)
  .catch((error) => {
    const status = document.getElementById("characters-status");
    const list = document.getElementById("character-list");
    status.textContent = "人物数据读取失败";
    list.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
  });
