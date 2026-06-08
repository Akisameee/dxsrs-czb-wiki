import { enumMapFromRows, queryOne, queryRows } from "../shared/wiki-db.js";
import { getRareMeta } from "../shared/utils.js";

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

function tag(text, className = "") {
  return `<span class="tag ${className}">${escapeHtml(text)}</span>`;
}

function stat(label, value) {
  return `
    <div class="character-stat">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value ?? "-")}</strong>
    </div>
  `;
}

function numberText(value, digits = 2) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return number.toFixed(digits).replace(/\.?0+$/, "");
}

function effectText(effect) {
  if (!effect.name) return `效果 ${effect.effect_id}(${effect.level})`;
  const level = Number(effect.level);
  const value = effect.value_per_level === null || effect.value_per_level === undefined
    ? null
    : Number(effect.value_per_level) * level;
  const description = value === null
    ? effect.template
    : String(effect.template || "").replaceAll("{value*n}", String(value));
  return `${effect.name} ${level}${description ? `：${description}` : ""}`;
}

function renderList(items, emptyText, renderItem) {
  if (!items.length) return `<div class="empty-state compact">${escapeHtml(emptyText)}</div>`;
  return items.map(renderItem).join("");
}

function renderMartialArt({ martialArt, styles, effects, passives, enums }) {
  const rare = getRareMeta(martialArt.rarity_id, enums);
  const styleTags = styles
    .map((item) => tag(enumLabel(enums, "LianSuo_FG", item.style_id, String(item.style_id))))
    .join("");
  const tags = [
    tag(enumLabel(enums, "LianSuo_MP", martialArt.sect_id, "未知门派")),
    tag(enumLabel(enums, "BingQiType", martialArt.type_id, "未知类型")),
    tag(rare.label, `rarity ${rare.className}`),
    Number(martialArt.is_sect_restricted) ? tag("门派限定") : "",
  ].filter(Boolean).join("");

  document.title = `${martialArt.name} - 武学 - 大侠式人生重制版`;

  return `
    <section class="characters-head character-profile-head">
      <div>
        <a class="back-link" href="${escapeHtml(pagePath("martial-arts/"))}">返回武学索引</a>
        <h1>${escapeHtml(martialArt.name)}</h1>
        <p class="status-text">${escapeHtml(martialArt.internal_name || "")}</p>
      </div>
      <div class="tag-row">${tags}</div>
    </section>

    <section class="character-page-grid">
      <section class="character-detail-section">
        <h3>基础</h3>
        <div class="character-stat-grid">
          ${stat("门派", enumLabel(enums, "LianSuo_MP", martialArt.sect_id))}
          ${stat("类型", enumLabel(enums, "BingQiType", martialArt.type_id))}
          ${stat("品质", enumLabel(enums, "WuGongRare", martialArt.rarity_id))}
          ${stat("门派限定", Number(martialArt.is_sect_restricted) ? "是" : "否")}
          ${stat("威力", numberText(martialArt.power))}
          ${stat("真气", martialArt.cost ?? "-")}
        </div>
      </section>

      <section class="character-detail-section">
        <h3>风格</h3>
        <div class="tag-row">
          ${styleTags || `<span class="tag">未记录</span>`}
        </div>
      </section>

      <section class="character-detail-section character-page-wide">
        <h3>特殊效果</h3>
        <div class="character-skill-list">
          ${renderList(effects, "暂无特殊效果", (item) => `
            <div class="character-skill-row">
              <span>#${escapeHtml(item.slot)}</span>
              <div>${tag(effectText(item), "is-skill")}</div>
            </div>
          `)}
        </div>
      </section>

      <section class="character-detail-section character-page-wide">
        <h3>被动词条</h3>
        <div class="character-skill-list">
          ${renderList(passives, "暂无被动词条", (item) => `
            <div class="character-skill-row">
              <span>#${escapeHtml(item.slot)}</span>
              <div>${tag(item.text, "is-skill")}</div>
            </div>
          `)}
        </div>
      </section>

      <section class="character-detail-section character-page-wide">
        <h3>获取方式</h3>
        <p class="character-word">${escapeHtml(martialArt.obtain_method || "未记录")}</p>
      </section>

      ${martialArt.special ? `
        <section class="character-detail-section character-page-wide">
          <h3>特殊说明</h3>
          <p class="character-word">${escapeHtml(martialArt.special)}</p>
        </section>
      ` : ""}
    </section>
  `;
}

function detailId() {
  const id = Number(new URLSearchParams(window.location.search).get("id"));
  return Number.isInteger(id) && id >= 0 ? id : null;
}

async function loadData(id) {
  const [martialArt, styles, effects, passives, enumRows] = await Promise.all([
    queryOne("SELECT * FROM martial_arts WHERE id = ?", [id]),
    queryRows("SELECT * FROM martial_art_styles WHERE martial_art_id = ? ORDER BY slot", [id]),
    queryRows(`
      SELECT e.slot, e.effect_id, e.level, s.name, s.value_per_level, s.template
      FROM martial_art_effects e
      LEFT JOIN status_effects s ON s.id = e.effect_id
      WHERE e.martial_art_id = ?
      ORDER BY e.slot
    `, [id]),
    queryRows("SELECT * FROM martial_art_passives WHERE martial_art_id = ? ORDER BY slot", [id]),
    queryRows("SELECT type, id, label FROM enums ORDER BY type, id"),
  ]);

  return {
    martialArt,
    styles,
    effects,
    passives,
    enums: enumMapFromRows(enumRows),
  };
}

async function initMartialArtDetailPage() {
  const root = document.getElementById("martial-art-detail-root");
  const id = detailId();
  if (id === null) {
    root.innerHTML = `
      <section class="characters-head">
        <a class="back-link" href="${escapeHtml(pagePath("martial-arts/"))}">返回武学索引</a>
        <h1>武学详情</h1>
        <p class="status-text">缺少武学 id。</p>
      </section>
    `;
    return;
  }

  const data = await loadData(id);
  if (!data.martialArt) {
    root.innerHTML = `
      <section class="characters-head">
        <a class="back-link" href="${escapeHtml(pagePath("martial-arts/"))}">返回武学索引</a>
        <h1>武学详情</h1>
        <p class="status-text">找不到武学：${escapeHtml(id)}</p>
      </section>
    `;
    return;
  }

  root.innerHTML = renderMartialArt(data);
}

initMartialArtDetailPage().catch((error) => {
  const root = document.getElementById("martial-art-detail-root");
  root.innerHTML = `
    <section class="characters-head">
      <a class="back-link" href="${escapeHtml(pagePath("martial-arts/"))}">返回武学索引</a>
      <h1>武学详情</h1>
      <p class="status-text">武学数据读取失败：${escapeHtml(error.message)}</p>
    </section>
  `;
});
