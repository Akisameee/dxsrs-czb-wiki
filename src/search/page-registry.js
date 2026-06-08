import { queryRows } from "../shared/wiki-db.js";

const STATIC_PAGES = [
  { type: "页面", title: "首页", href: "" },
  { type: "武学", title: "武学图鉴", href: "martial-arts/" },
  { type: "人物", title: "人物地点索引", href: "characters/" },
  { type: "工具", title: "武学配装", href: "tools/loadout/" },
  { type: "工具", title: "自创武学模拟", href: "tools/self-create/" },
];

function siteRoot() {
  return (document.body.dataset.dataRoot || "data/").replace(/data\/?$/, "");
}

function pagePath(path) {
  return `${siteRoot()}${path.replace(/^\/+/, "")}`;
}

function registeredStaticPages() {
  return STATIC_PAGES.map((page) => ({
    ...page,
    href: pagePath(page.href),
  }));
}

async function registeredCharacterPages() {
  const rows = await queryRows("SELECT id, name AS title FROM characters ORDER BY id");
  return rows.map((row) => ({
    type: "人物",
    title: row.title,
    href: pagePath(`characters/detail/?id=${row.id}`),
  }));
}

async function registeredMartialArtPages() {
  const rows = await queryRows("SELECT id, name AS title FROM martial_arts ORDER BY id");
  return rows.map((row) => ({
    type: "武学",
    title: row.title,
    href: pagePath(`martial-arts/detail/?id=${row.id}`),
  }));
}

export async function registeredPages() {
  const [characters, martialArts] = await Promise.all([
    registeredCharacterPages(),
    registeredMartialArtPages(),
  ]);

  return [
    ...registeredStaticPages(),
    ...characters,
    ...martialArts,
  ];
}
