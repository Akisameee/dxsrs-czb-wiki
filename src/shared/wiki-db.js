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
      if (!response.ok) throw new Error(`wiki.sqlite 读取失败：${response.status}`);
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

export async function queryOne(sql, params = []) {
  return (await queryRows(sql, params))[0] || null;
}

export function enumMapFromRows(rows) {
  const enums = {};
  for (const row of rows) {
    if (!enums[row.type]) enums[row.type] = {};
    enums[row.type][String(row.id)] = row.label;
  }
  return enums;
}

export function groupBy(rows, key) {
  const grouped = new Map();
  for (const row of rows) {
    if (!grouped.has(row[key])) grouped.set(row[key], []);
    grouped.get(row[key]).push(row);
  }
  return grouped;
}
