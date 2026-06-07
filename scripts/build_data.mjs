#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { DATA_DIR, DEFAULT_SOURCE, RAW_DIR } from "./lib/bgdatabase.mjs";
import { buildFrontendData } from "./build_frontend_data.mjs";
import { extractRawDatabase } from "./extract_raw_database.mjs";

export function buildData({
  source = DEFAULT_SOURCE,
  rawDir = RAW_DIR,
  dataDir = DATA_DIR,
} = {}) {
  const raw = extractRawDatabase({ source, rawDir });
  const frontend = buildFrontendData({ rawDir, dataDir });
  return { raw, frontend };
}

function main() {
  const source = process.argv[2] || DEFAULT_SOURCE;
  const rawDir = process.argv[3] || RAW_DIR;
  const dataDir = process.argv[4] || DATA_DIR;
  const result = buildData({ source, rawDir, dataDir });
  console.log(JSON.stringify(result, null, 2));
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
