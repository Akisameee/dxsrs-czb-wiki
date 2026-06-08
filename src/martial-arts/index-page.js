import { enumMapFromRows, groupBy, queryRows } from "../shared/wiki-db.js";
import { escapeHtml, enumLabel } from "../shared/utils.js";
import { bindMartialInfoTooltip, martialDetailHref, renderMartialCard } from "./shared.js";

function optionRows(enums, type, allLabel) {
  const entries = Object.entries(enums?.[type] || {})
    .filter(([, label]) => label !== null && label !== undefined && label !== "")
    .sort((a, b) => Number(a[0]) - Number(b[0]));
  return [
    `<option value="">${escapeHtml(allLabel)}</option>`,
    ...entries.map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`),
  ].join("");
}

function initMartialArtsPage(context) {
  const { martialArts, enums } = context;
  const els = {
    status: document.getElementById("martial-arts-status"),
    search: document.getElementById("martial-art-search"),
    sect: document.getElementById("martial-art-sect"),
    type: document.getElementById("martial-art-type"),
    rare: document.getElementById("martial-art-rare"),
    style: document.getElementById("martial-art-style"),
    count: document.getElementById("martial-art-count"),
    list: document.getElementById("martial-art-list"),
  };

  function matches(item) {
    const keyword = els.search.value.trim().toLowerCase();
    if (keyword && !`${item.name} ${item.internal_name || ""}`.toLowerCase().includes(keyword)) return false;
    if (els.sect.value !== "" && Number(item.sect_id) !== Number(els.sect.value)) return false;
    if (els.type.value !== "" && Number(item.type_id) !== Number(els.type.value)) return false;
    if (els.rare.value !== "" && Number(item.rarity_id) !== Number(els.rare.value)) return false;
    if (els.style.value !== "" && !item.style_ids.includes(Number(els.style.value))) return false;
    return true;
  }

  function sorted(rows) {
    return [...rows].sort((a, b) => (
      Number(a.sect_id) - Number(b.sect_id) ||
      Number(a.type_id) - Number(b.type_id) ||
      Number(b.rarity_id) - Number(a.rarity_id) ||
      Number(a.id) - Number(b.id)
    ));
  }

  function render() {
    const rows = sorted(martialArts.filter(matches));
    els.count.textContent = `共 ${rows.length} 个武学`;
    els.list.innerHTML = rows.length
      ? rows.map((item) => renderMartialCard(item, enums, {
        href: martialDetailHref(item.id),
        infoValue: item.id,
      })).join("")
      : `<div class="empty-state">没有匹配的武学。</div>`;
  }

  els.sect.innerHTML = optionRows(enums, "LianSuo_MP", "全部门派");
  els.type.innerHTML = optionRows(enums, "BingQiType", "全部类型");
  els.rare.innerHTML = optionRows(enums, "WuGongRare", "全部品质");
  els.style.innerHTML = optionRows(enums, "LianSuo_FG", "全部风格");

  for (const input of [els.search, els.sect, els.type, els.rare, els.style]) {
    input.addEventListener(input === els.search ? "input" : "change", render);
  }

  els.list.addEventListener("click", (event) => {
    if (!event.target.closest("[data-martial-info]")) return;
    event.preventDefault();
  });
  bindMartialInfoTooltip(els.list, {
    enums,
    getItem: (id) => martialArts.find((entry) => Number(entry.id) === Number(id)),
  });
  els.status.textContent = `已载入 ${martialArts.length} 个武学。`;
  render();
}

async function loadData() {
  const [martialArts, styleRows, effectRows, passiveRows, enumRows] = await Promise.all([
    queryRows("SELECT * FROM martial_arts ORDER BY id"),
    queryRows("SELECT martial_art_id, style_id FROM martial_art_styles ORDER BY martial_art_id, slot"),
    queryRows(`
      SELECT e.martial_art_id, e.slot, e.effect_id, e.level, s.name, s.value_per_level, s.template
      FROM martial_art_effects e
      LEFT JOIN status_effects s ON s.id = e.effect_id
      ORDER BY e.martial_art_id, e.slot
    `),
    queryRows("SELECT martial_art_id, slot, text FROM martial_art_passives ORDER BY martial_art_id, slot"),
    queryRows("SELECT type, id, label FROM enums ORDER BY type, id"),
  ]);
  const stylesByMartial = groupBy(styleRows, "martial_art_id");
  const effectsByMartial = groupBy(effectRows, "martial_art_id");
  const passivesByMartial = groupBy(passiveRows, "martial_art_id");

  return {
    martialArts: martialArts.map((row) => ({
      ...row,
      style_ids: (stylesByMartial.get(row.id) || []).map((item) => Number(item.style_id)),
      effects: effectsByMartial.get(row.id) || [],
      passives: passivesByMartial.get(row.id) || [],
      effect_count: (effectsByMartial.get(row.id) || []).length,
      passive_count: (passivesByMartial.get(row.id) || []).length,
    })),
    enums: enumMapFromRows(enumRows),
  };
}

loadData()
  .then(initMartialArtsPage)
  .catch((error) => {
    const status = document.getElementById("martial-arts-status");
    const list = document.getElementById("martial-art-list");
    status.textContent = "武学数据读取失败";
    list.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
  });
