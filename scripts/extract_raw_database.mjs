#!/usr/bin/env node
import { rmSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_SOURCE, RAW_DIR, ROOT, deriveChainEnums, extractTables, writeJson } from "./lib/bgdatabase.mjs";

function tableFileName(table) {
  return `${table.meta}.json`;
}

export function extractRawDatabase({
  source = DEFAULT_SOURCE,
  rawDir = RAW_DIR,
  clean = true,
} = {}) {
  if (clean) {
    rmSync(rawDir, { recursive: true, force: true });
  }

  const tables = extractTables(source);
  const chainTable = tables.find((table) => table.meta === "GLianSuo");
  const enums = chainTable ? deriveChainEnums(chainTable.rows) : { source: null, enumTypes: {} };

  for (const table of tables) {
    writeJson(join(rawDir, tableFileName(table)), table);
  }
  writeJson(join(rawDir, "_enums.json"), enums);

  const manifest = {
    source: relative(ROOT, source).replaceAll("\\", "/"),
    sourceFile: basename(source),
    tableCount: tables.length,
    generatedFiles: {
      enums: "_enums.json",
    },
    tables: tables.map((table) => ({
      name: table.meta,
      file: tableFileName(table),
      rows: table.rowCount,
      fields: table.fieldCount,
      parseErrors: Object.values(table.fieldMeta).filter((field) => field.error).length,
    })),
  };
  writeJson(join(rawDir, "_manifest.json"), manifest);

  return {
    source,
    rawDir,
    tables: tables.length,
    parsedTables: tables.filter((table) => table.rowCount > 0).length,
    rows: tables.reduce((sum, table) => sum + table.rowCount, 0),
    enums: Object.keys(enums.enumTypes || {}),
  };
}

function main() {
  const source = process.argv[2] || DEFAULT_SOURCE;
  const rawDir = process.argv[3] || RAW_DIR;
  const result = extractRawDatabase({ source, rawDir });
  console.log(JSON.stringify(result, null, 2));
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
