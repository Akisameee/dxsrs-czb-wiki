#!/usr/bin/env node
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { RAW_DIR, ROOT, readJson, writeJson } from "./lib/bgdatabase.mjs";

const DEFAULT_ENUM_SOURCE = join(ROOT, "re/dump/cpp2il_analysis/types/Assembly-CSharp");
const DEFAULT_OUTPUT = join(ROOT, "public/data/enums.json");

function parseEnumFile(path) {
  const text = readFileSync(path, "utf8");
  if (!text.includes("System.Enum")) return null;

  const type = text.match(/^Type:\s*([^:\r\n]+):/m)?.[1];
  if (!type) return null;

  const entries = {};
  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const field = lines[index].match(/^\s*Static Field:\s*(.+?)\s*$/)?.[1];
    if (!field || field === "value__") continue;

    for (let scan = index + 1; scan < Math.min(index + 8, lines.length); scan += 1) {
      const value = lines[scan].match(/^\s*Default Value:\s*(-?\d+)\s*$/)?.[1];
      if (!value) continue;
      entries[value] = field;
      break;
    }
  }

  if (Object.keys(entries).length === 0) return null;
  return {
    type,
    values: Object.fromEntries(
      Object.entries(entries).sort(([a], [b]) => Number(a) - Number(b)),
    ),
  };
}

export function buildEnums({
  sourceDir = DEFAULT_ENUM_SOURCE,
  output = DEFAULT_OUTPUT,
  rawDir = RAW_DIR,
} = {}) {
  const enumFiles = readdirSync(sourceDir)
    .filter((name) => name.endsWith("_metadata.txt"))
    .map((name) => join(sourceDir, name));

  const enumTypes = {};
  for (const file of enumFiles) {
    const parsed = parseEnumFile(file);
    if (!parsed) continue;
    enumTypes[parsed.type] = parsed.values;
  }

  const rawEnums = readJson(join(rawDir, "_enums.json"));
  if (rawEnums?.enumTypes) {
    enumTypes.LianSuo_MP = rawEnums.enumTypes.LianSuo_MP || enumTypes.LianSuo_MP;
    enumTypes.LianSuo_FG = rawEnums.enumTypes.LianSuo_FG || enumTypes.LianSuo_FG;
  }

  const result = { enumTypes };
  writeJson(output, result);
  return {
    output: relative(ROOT, output).replaceAll("\\", "/"),
    enumCount: Object.keys(enumTypes).length,
  };
}

function main() {
  const sourceDir = process.argv[2] || DEFAULT_ENUM_SOURCE;
  const output = process.argv[3] || DEFAULT_OUTPUT;
  console.log(JSON.stringify(buildEnums({ sourceDir, output }), null, 2));
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
