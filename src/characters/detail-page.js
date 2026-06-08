import { enumMapFromRows, queryOne, queryRows } from "../shared/wiki-db.js";

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

function numberText(value, digits = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return digits > 0 ? number.toFixed(digits) : String(Math.round(number));
}

function tag(text, className = "") {
  return `<span class="tag ${className}">${escapeHtml(text)}</span>`;
}

function stat(label, value) {
  return `
    <div class="character-stat">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function locationText(character, enums) {
  if (character.region_id === null || character.location_id === null) return "无地点";
  return `${enumLabel(enums, "DiDian", character.region_id)} / ${enumLabel(enums, "Area", character.location_id)}`;
}

function martialArtsByLevel(martialArts) {
  const byLevel = new Map();
  for (const item of martialArts) {
    if (!byLevel.has(item.level)) byLevel.set(item.level, []);
    byLevel.get(item.level).push(item);
  }
  return [...byLevel.entries()].sort((a, b) => Number(a[0]) - Number(b[0]));
}

function renderMartialArts(martialArts) {
  const rows = martialArtsByLevel(martialArts);
  if (!rows.length) return `<div class="empty-state compact">暂无武功配置</div>`;
  return rows.map(([level, items]) => `
    <div class="character-skill-row">
      <span>Lv ${escapeHtml(level)}</span>
      <div>
        ${items.map((item) => `
          <a class="tag is-skill" href="${escapeHtml(pagePath(`martial-arts/detail/?id=${item.martial_art_id}`))}">
            ${escapeHtml(`${item.name} ${item.martial_level}`)}
          </a>
        `).join("")}
      </div>
    </div>
  `).join("");
}

function renderSnapshots(snapshots) {
  if (!snapshots.length) return "";
  return `
    <section class="character-detail-section character-page-wide">
      <h3>成长快照</h3>
      <div class="character-snapshot-list">
        ${snapshots.map((item) => `
          <div class="character-snapshot">
            <strong>Lv ${escapeHtml(item.level)}</strong>
            <span>四维 ${escapeHtml(item.strength)} / ${escapeHtml(item.constitution)} / ${escapeHtml(item.physique)} / ${escapeHtml(item.agility)}</span>
            <span>精通 ${escapeHtml(item.fist)} / ${escapeHtml(item.blade_sword)} / ${escapeHtml(item.spear_staff)} / ${escapeHtml(item.hidden_weapon)} / ${escapeHtml(item.internal)}</span>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function targetLabel(target) {
  const name = target.target_name || target.raw_value;
  if (target.target_kind === "character" && target.target_id !== null && target.target_id !== undefined) {
    return `<a href="${escapeHtml(pagePath(`characters/detail/?id=${target.target_id}`))}">${escapeHtml(name)}</a>`;
  }
  return escapeHtml(name);
}

function renderQuestTargets(targets) {
  if (!targets.length) return `<span class="muted-text">未记录</span>`;
  return targets.map((target) => `
    <span class="character-quest-target">
      ${targetLabel(target)}
    </span>
  `).join("");
}

function questTypeLabel(enums, id) {
  return enumLabel(enums, "QuestType", id, `类型 ${id}`).replace(/^情缘_/, "");
}

function renderQuests(quests, targetsByQuest, enums) {
  if (!quests.length) return "";
  return `
    <section class="character-detail-section character-page-wide">
      <h3>心愿任务</h3>
      <div class="character-quest-list">
        ${quests.map((quest) => `
          <article class="character-quest">
            <header>
              <strong>阶段 ${escapeHtml(quest.stage)}</strong>
            </header>
            <div class="character-quest-body">
              <div>
                <span>亲密度</span>
                <strong>${escapeHtml(quest.required_affinity)}</strong>
              </div>
              <div>
                <span>类型</span>
                <strong>${escapeHtml(questTypeLabel(enums, quest.quest_type_id))}</strong>
              </div>
              <div>
                <span>目标</span>
                <strong>${renderQuestTargets(targetsByQuest.get(quest.id) || [])}</strong>
              </div>
              <div>
                <span>奖励</span>
                <strong>${escapeHtml(quest.reward || "-")}</strong>
              </div>
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderCharacter({ character, martialArts, snapshots, quests, questTargets, enums }) {
  const targetsByQuest = new Map();
  for (const target of questTargets) {
    if (!targetsByQuest.has(target.quest_id)) targetsByQuest.set(target.quest_id, []);
    targetsByQuest.get(target.quest_id).push(target);
  }

  const tags = [
    tag(enumLabel(enums, "LianSuo_MP", character.sect_id, "未知门派")),
    tag(enumLabel(enums, "NPC_Rare", character.rarity_id, "未知资质"), `rarity rarity-npc-${character.rarity_id}`),
    tag(enumLabel(enums, "BingQiType", character.weapon_type_id, "未知武器")),
    tag(enumLabel(enums, "NPC_WuGongType", character.martial_type_id, "未知路线")),
    Number(character.is_instructor) ? tag("教头") : "",
    Number(character.is_manager) ? tag("管事人") : "",
  ].filter(Boolean).join("");

  document.title = `${character.name} - 人物 - 大侠式人生重制版`;

  return `
    <section class="characters-head character-profile-head">
      <div>
        <a class="back-link" href="${escapeHtml(pagePath("characters/"))}">返回人物索引</a>
        <h1>${escapeHtml(character.name)}</h1>
        <p class="status-text">${escapeHtml(locationText(character, enums))}</p>
      </div>
      <div class="tag-row">${tags}</div>
    </section>

    <section class="character-page-grid">
      <section class="character-detail-section">
        <h3>基础</h3>
        <div class="character-stat-grid">
          ${stat("性别", enumLabel(enums, "Sex", character.sex_id))}
          ${stat("江湖等级", enumLabel(enums, "Dengji", character.rank_id))}
          ${stat("门派地位", enumLabel(enums, "DiWei", character.position_id))}
          ${stat("人物等级", character.level)}
          ${stat("名声", character.fame)}
          ${stat("侠义", character.chivalry)}
          ${stat("喜好品质", enumLabel(enums, "ItemRare", character.favorite_rarity_id, character.favorite_rarity_id))}
          ${stat("金钱", character.gold)}
        </div>
      </section>

      <section class="character-detail-section">
        <h3>战斗</h3>
        <div class="character-stat-grid">
          ${stat("膂力", character.strength)}
          ${stat("根骨", character.constitution)}
          ${stat("体魄", character.physique)}
          ${stat("身法", character.agility)}
          ${stat("修为", character.cultivation)}
          ${stat("拳掌", character.fist)}
          ${stat("刀剑", character.blade_sword)}
          ${stat("枪棒", character.spear_staff)}
          ${stat("暗器", character.hidden_weapon)}
          ${stat("内功", character.internal)}
        </div>
      </section>

      <section class="character-detail-section">
        <h3>成长</h3>
        <div class="character-stat-grid">
          ${stat("成长类型", enumLabel(enums, "NPC_ChengZhangType", character.growth_type_id))}
          ${stat("初始值", character.growth_initial_value)}
          ${stat("最终值", character.growth_final_value)}
          ${stat("基础等级", character.growth_base_level)}
          ${stat("膂力成长", numberText(character.growth_strength, 1))}
          ${stat("根骨成长", numberText(character.growth_constitution, 1))}
          ${stat("体魄成长", numberText(character.growth_physique, 1))}
          ${stat("身法成长", numberText(character.growth_agility, 1))}
        </div>
      </section>

      <section class="character-detail-section">
        <h3>装备与生活</h3>
        <div class="character-stat-grid">
          ${stat("武器", character.equipment_weapon || "-")}
          ${stat("防具", character.equipment_armor || "-")}
          ${stat("备用武器", character.equipment_other_weapon || "-")}
          ${stat("挖矿", character.mining)}
          ${stat("采药", character.herb_gathering)}
          ${stat("打猎", character.hunting)}
          ${stat("锻造", character.forging)}
          ${stat("炼丹", character.alchemy)}
          ${stat("裁缝", character.sewing)}
        </div>
      </section>

      <section class="character-detail-section character-page-wide">
        <h3>武功配置</h3>
        <div class="character-skill-list">${renderMartialArts(martialArts)}</div>
      </section>

      ${renderQuests(quests, targetsByQuest, enums)}

      ${renderSnapshots(snapshots)}

      ${character.word ? `
        <section class="character-detail-section character-page-wide">
          <h3>台词</h3>
          <p class="character-word">${escapeHtml(character.word)}</p>
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
  const [character, martialArts, snapshots, quests, questTargets, enumRows] = await Promise.all([
    queryOne("SELECT * FROM characters WHERE id = ?", [id]),
    queryRows(`
      SELECT c.level, c.martial_art_id, m.name, c.martial_level
      FROM character_martial_arts c
      JOIN martial_arts m ON m.id = c.martial_art_id
      WHERE c.character_id = ?
      ORDER BY c.level, c.slot
    `, [id]),
    queryRows(`
      SELECT *
      FROM character_attribute_snapshots
      WHERE character_id = ?
      ORDER BY level, slot
    `, [id]),
    queryRows(`
      SELECT *
      FROM character_quests
      WHERE character_id = ?
      ORDER BY sort_order
    `, [id]),
    queryRows(`
      SELECT t.*
      FROM character_quest_targets t
      JOIN character_quests q ON q.id = t.quest_id
      WHERE q.character_id = ?
      ORDER BY q.sort_order, t.slot
    `, [id]),
    queryRows("SELECT type, id, label FROM enums ORDER BY type, id"),
  ]);

  return {
    character,
    martialArts,
    snapshots,
    quests,
    questTargets,
    enums: enumMapFromRows(enumRows),
  };
}

async function initCharacterDetailPage() {
  const root = document.getElementById("character-detail-root");
  const id = detailId();
  if (id === null) {
    root.innerHTML = `
      <section class="characters-head">
        <a class="back-link" href="${escapeHtml(pagePath("characters/"))}">返回人物索引</a>
        <h1>人物详情</h1>
        <p class="status-text">缺少人物 id。</p>
      </section>
    `;
    return;
  }

  const data = await loadData(id);
  if (!data.character) {
    root.innerHTML = `
      <section class="characters-head">
        <a class="back-link" href="${escapeHtml(pagePath("characters/"))}">返回人物索引</a>
        <h1>人物详情</h1>
        <p class="status-text">找不到人物：${escapeHtml(id)}</p>
      </section>
    `;
    return;
  }

  root.innerHTML = renderCharacter(data);
}

initCharacterDetailPage().catch((error) => {
  const root = document.getElementById("character-detail-root");
  root.innerHTML = `
    <section class="characters-head">
      <a class="back-link" href="${escapeHtml(pagePath("characters/"))}">返回人物索引</a>
      <h1>人物详情</h1>
      <p class="status-text">人物数据读取失败：${escapeHtml(error.message)}</p>
    </section>
  `;
});
