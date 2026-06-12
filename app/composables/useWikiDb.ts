import initSqlJs from "sql.js";
import type { Database, Statement } from "sql.js";

type SqlValue = string | number | Uint8Array | null;

let dbPromise: Promise<Database> | null = null;

function statementRows(statement: Statement) {
  const rows: Record<string, SqlValue>[] = [];
  while (statement.step()) rows.push(statement.getAsObject());
  return rows;
}

export function useWikiDb() {
  const config = useRuntimeConfig();
  const baseURL = config.app.baseURL;

  async function getDb() {
    if (!import.meta.client) throw new Error("wiki.sqlite 只能在浏览器端读取");
    if (!dbPromise) {
      dbPromise = Promise.all([
        initSqlJs({ locateFile: () => `${baseURL}data/sql-wasm.wasm` }),
        fetch(`${baseURL}data/wiki.sqlite`).then((response) => {
          if (!response.ok) throw new Error(`读取 wiki.sqlite 失败：${response.status}`);
          return response.arrayBuffer();
        }),
      ]).then(([SQL, buffer]) => new SQL.Database(new Uint8Array(buffer)));
    }
    return dbPromise;
  }

  async function queryRows<T = Record<string, SqlValue>>(sql: string, params: SqlValue[] = []) {
    const db = await getDb();
    const statement = db.prepare(sql);
    try {
      statement.bind(params);
      return statementRows(statement) as T[];
    } finally {
      statement.free();
    }
  }

  async function queryOne<T = Record<string, SqlValue>>(sql: string, params: SqlValue[] = []) {
    return (await queryRows<T>(sql, params))[0] ?? null;
  }

  return { queryRows, queryOne };
}
