import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const root = fileURLToPath(new URL("../", import.meta.url));
const jiti = createJiti(root);
const { parseBgDatabase, writeBgDatabaseUpdates } = jiti("./app/lib/bgdatabase/index.ts");

const savesDir = join(root, "re", "saves");
const bgDatabaseUniqueId = "97d8682545f14748ae495284cdfcdcc7";
const requiredFields = ["xing", "ming", "sex", "menpai", "old", "maxold", "gold"];

const saveFiles = readdirSync(savesDir, { withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => join(savesDir, entry.name))
  .filter(isBgDatabaseV5Save)
  .sort();

assert.ok(saveFiles.length > 0, "re/saves 里应该至少有一个 BGDatabase V5 主存档样本");

for (const savePath of saveFiles) {
  const bytes = readFileSync(savePath);
  const parsed = parseBgDatabase(bytes);
  const zhuJue = parsed.tables.find((table) => table.name === "ZhuJue");

  assert.ok(zhuJue, `${basename(savePath)} 应包含 ZhuJue 表`);
  assert.equal(zhuJue.rowCount, 1, `${basename(savePath)} 的 ZhuJue 应只有一行主角数据`);

  for (const fieldName of requiredFields) {
    const field = zhuJue.fields[fieldName];
    assert.ok(field, `${basename(savePath)} 缺少 ZhuJue.${fieldName}`);
    assert.equal(field.parsed, true, `${basename(savePath)} 的 ZhuJue.${fieldName} 应可解析`);
    assert.ok(field.values.length >= 1, `${basename(savePath)} 的 ZhuJue.${fieldName} 应至少有一行值`);
  }

  const output = writeBgDatabaseUpdates(parsed, []);
  assert.equal(output.length, bytes.length, `${basename(savePath)} 不改值写回后长度应一致`);
  assert.deepEqual(Buffer.from(output), bytes, `${basename(savePath)} 不改值写回后字节应一致`);

  printSaveReport(savePath, parsed, zhuJue);
}

console.log(`bgdatabase save parse regression passed (${saveFiles.length} saves)`);

function isBgDatabaseV5Save(savePath) {
  const bytes = readFileSync(savePath);
  if (bytes.length < 20) return false;
  const version = bytes.readInt32LE(0);
  const uniqueId = bytes.subarray(4, 20).toString("hex");
  return version === 5 && uniqueId === bgDatabaseUniqueId;
}

function printSaveReport(savePath, parsed, zhuJue) {
  const characterName = `${zhuJue.fields.xing.values[0] ?? ""}${zhuJue.fields.ming.values[0] ?? ""}` || "未命名";
  console.log("");
  console.log(`save: ${basename(savePath)}`);
  console.log(
    `character: ${characterName} old=${zhuJue.fields.old.values[0]} menpai=${zhuJue.fields.menpai.values[0]} gold=${zhuJue.fields.gold.values[0]}`,
  );
  console.log(`tables: ${parsed.tables.length}`);
  console.log("table | rows | fields | parsed | unparsed | unparsed types");

  let totalUnparsed = 0;
  for (const table of parsed.tables) {
    const fields = Object.values(table.fields);
    const parsedFields = fields.filter((field) => field.parsed);
    const unparsedFields = fields.filter((field) => !field.parsed);
    totalUnparsed += unparsedFields.length;
    console.log(
      [
        table.name,
        table.rowCount,
        table.fieldCount,
        parsedFields.length,
        unparsedFields.length,
        summarizeUnparsedTypes(unparsedFields),
      ].join(" | "),
    );
  }
  console.log(`unparsed total: ${totalUnparsed}`);
}

function summarizeUnparsedTypes(fields) {
  if (!fields.length) return "-";
  const counts = new Map();
  for (const field of fields) counts.set(field.fieldType, (counts.get(field.fieldType) || 0) + 1);
  return [...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([type, count]) => `${type}:${count}`)
    .join(", ");
}
