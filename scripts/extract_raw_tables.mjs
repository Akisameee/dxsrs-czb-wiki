import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_SOURCE, extractTables } from "./lib/bgdatabase.mjs";

const cwd = process.cwd();
const repoRoot = resolve(cwd);
const defaultOutDir = join(repoRoot, "re", "raw");

function sanitizeName(value) {
  return String(value)
    .trim()
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_");
}

function getArg(index, fallback) {
  return process.argv[index] ? resolve(cwd, process.argv[index]) : fallback;
}

const sourcePath = getArg(2, DEFAULT_SOURCE);
const outDir = getArg(3, defaultOutDir);
const tablesDir = join(outDir, "tables");

mkdirSync(tablesDir, { recursive: true });

const tables = extractTables(sourcePath);
const manifest = [];

for (const table of tables) {
  const fileName = `${String(table.tableIndex).padStart(3, "0")}-${sanitizeName(table.meta)}.json`;
  const payload = {
    tableIndex: table.tableIndex,
    meta: table.meta,
    range: table.range,
    fieldCount: table.fieldCount,
    rowCount: table.rowCount,
    fields: table.fields,
    fieldMeta: table.fieldMeta,
    rows: table.rows,
  };

  writeFileSync(join(tablesDir, fileName), `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  manifest.push({
    tableIndex: table.tableIndex,
    meta: table.meta,
    file: `tables/${fileName}`,
    fieldCount: table.fieldCount,
    rowCount: table.rowCount,
  });
}

writeFileSync(
  join(outDir, "manifest.json"),
  `${JSON.stringify({
    source: sourcePath,
    tableCount: tables.length,
    tables: manifest,
  }, null, 2)}\n`,
  "utf8",
);

console.log(`Extracted ${tables.length} tables to ${outDir}`);
