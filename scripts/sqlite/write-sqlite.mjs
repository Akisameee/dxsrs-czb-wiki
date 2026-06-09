import { mkdirSync, rmSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

function sqliteIdentifier(name) {
  return `"${name.replaceAll('"', '""')}"`;
}

function columnAffinity(type) {
  if (type.includes("INTEGER")) return "INTEGER";
  if (type.includes("REAL")) return "REAL";
  return "TEXT";
}

function coerceValue(value, type) {
  if (value === "" || value === undefined) return null;
  const affinity = columnAffinity(type);
  if (affinity === "INTEGER") return value === null ? null : Number.parseInt(value, 10);
  if (affinity === "REAL") return value === null ? null : Number.parseFloat(value);
  return value;
}

function createTable(db, name, definition) {
  const columns = Object.entries(definition.columns).map(([column, type]) => `${sqliteIdentifier(column)} ${type}`);
  if (definition.primaryKey?.length) {
    columns.push(`PRIMARY KEY (${definition.primaryKey.map(sqliteIdentifier).join(", ")})`);
  }
  db.exec(`CREATE TABLE ${sqliteIdentifier(name)} (${columns.join(", ")})`);
}

function importTable(db, name, definition, rows) {
  const columns = Object.keys(definition.columns);
  const placeholders = columns.map(() => "?").join(", ");
  const insert = db.prepare(
    `INSERT INTO ${sqliteIdentifier(name)} (${columns.map(sqliteIdentifier).join(", ")}) VALUES (${placeholders})`,
  );

  for (const row of rows) {
    insert.run(...columns.map((column) => coerceValue(row[column], definition.columns[column])));
  }
  return rows.length;
}

export function writeSqlite({ output, tables, indexes, rowsByTable }) {
  mkdirSync(dirname(output), { recursive: true });
  rmSync(output, { force: true });

  const db = new DatabaseSync(output);
  db.exec("PRAGMA journal_mode = DELETE");
  db.exec("PRAGMA foreign_keys = OFF");
  db.exec("BEGIN");

  const counts = {};
  try {
    for (const [name, definition] of Object.entries(tables)) {
      createTable(db, name, definition);
      counts[name] = importTable(db, name, definition, rowsByTable[name] || []);
    }
    for (const statement of indexes) db.exec(statement);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    db.close();
    throw error;
  }

  db.exec("VACUUM");
  db.close();
  return counts;
}
