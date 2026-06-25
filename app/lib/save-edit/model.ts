import {
  parseBgDatabase,
  writeBgDatabaseRowOperations,
  type BgDatabaseField,
  type BgDatabaseFile,
  type BgDatabaseRowOperation,
  type BgDatabaseTable,
} from "../bgdatabase";
import { parseEs2, writeEs2, type Es2File } from "../es2";
import { detectSaveEditFileKind } from "./detect";
import { decodeSaveEditEs2FileName } from "./es2-file-name";
import { applyEs2Draft } from "./es2";
import { formatSaveValue } from "./format";
import {
  saveEditDraftFieldValue,
  saveEditDraftRowOperations,
  type SaveEditDraft,
} from "./draft";
export type {
  SaveEditDraft,
  SaveEditDraftResetTarget,
  SaveEditInsertedRowDraft,
  SaveEditRowDraft,
  SaveEditRowDraftOperation,
  SaveEditRowDraftTarget,
  SaveEditTableDraft,
  SaveEditTableRowView,
} from "./draft";

export type SaveEditFile = BgDatabaseFile & {
  kind: "bgdatabase";
  zhuJue: BgDatabaseTable;
};

export type SaveEditEs2File = {
  kind: "es2";
  es2: Es2File;
};

export type AnySaveEditFile = SaveEditFile | SaveEditEs2File;

export function saveEditFileTypeLabel(save: AnySaveEditFile | null | undefined, fileName?: string) {
  if (!save) return "未知";
  if (save.kind === "bgdatabase") return "人物存档";

  const dbKey = fileName ? decodeSaveEditEs2FileName(fileName) : null;
  if (dbKey) return dbKey.label;

  const value = save.es2.value;
  if (value.type === "list") {
    if (value.elementTypeHash.name === "CunDang") return "存档槽索引";
    if (value.elementTypeHash.name === "string") return "进度列表存档";
    return "附属列表存档";
  }
  if (value.type === "string") return "路径/标识存档";
  if (value.type === "int" || value.type === "bool") return "游戏设置存档";
  if (value.type === "cunDang") return "存档槽索引";
  return "附属存档";
}

export function asSaveEditFile(database: BgDatabaseFile): SaveEditFile {
  const zhuJue = database.tables.find((table) => table.name === "ZhuJue");
  if (!zhuJue) {
    throw new Error("没有找到主角表 ZhuJue");
  }
  return { ...database, kind: "bgdatabase", zhuJue };
}

export function parseSaveEditFile(input: ArrayBuffer | Uint8Array): SaveEditFile {
  const kind = detectSaveEditFileKind(input);
  if (kind === "bgdatabase") return asSaveEditFile(parseBgDatabase(input));
  if (kind === "es2") throw new Error("这是 ES2 小存档，当前存档编辑器暂未支持解析");
  throw new Error("无法识别这个存档文件格式");
}

export function parseAnySaveEditFile(input: ArrayBuffer | Uint8Array): AnySaveEditFile {
  const kind = detectSaveEditFileKind(input);
  if (kind === "bgdatabase") return asSaveEditFile(parseBgDatabase(input));
  if (kind === "es2") return { kind: "es2", es2: parseEs2(input) };
  throw new Error("无法识别这个存档文件格式");
}


export function writeSaveEditFile(save: SaveEditFile, draft?: SaveEditDraft): Uint8Array {
  return writeBgDatabaseRowOperations(save, draftToRowOperations(save, draft));
}

export function writeAnySaveEditFile(save: AnySaveEditFile, draft?: SaveEditDraft): Uint8Array {
  if (save.kind === "bgdatabase") return writeSaveEditFile(save, draft);
  return writeEs2(applyEs2Draft(save, draft).es2);
}

export function draftToRowOperations(save: SaveEditFile, draft?: SaveEditDraft) {
  const rows = saveEditDraftRowOperations(draft);
  return rows.flatMap((operation): BgDatabaseRowOperation[] => {
    if (operation.type !== "update") return [];
    const table = save.tables[operation.tableIndex];
    if (!table || table.name !== operation.tableName) return [];
    return Object.entries(operation.values)
      .map(([fieldName, value]) => {
        const field = table.fields[fieldName];
        return field ? { type: "update" as const, field, rowIndex: operation.rowIndex, value } : null;
      })
      .filter((update): update is Extract<BgDatabaseRowOperation, { type: "update" }> => Boolean(update));
  }).concat(rows.flatMap((operation): BgDatabaseRowOperation[] => {
    if (operation.type === "update") return [];
    const table = save.tables[operation.tableIndex];
    if (!table || table.name !== operation.tableName) return [];
    if (operation.type === "insert") {
      return [{
        type: "insert",
        tableIndex: operation.tableIndex,
        tableName: operation.tableName,
        tempId: operation.tempId,
        values: { ...operation.values },
      }];
    }
    return [{
      type: "delete",
      tableIndex: operation.tableIndex,
      tableName: operation.tableName,
      rowIndex: operation.rowIndex,
    }];
  }));
}

export function saveEditCharacterName(save: SaveEditFile, draft?: SaveEditDraft) {
  const xing = valueWithDraft(save.zhuJue.fields.xing, 0, draft);
  const ming = valueWithDraft(save.zhuJue.fields.ming, 0, draft);
  return `${formatSaveValue(xing)}${formatSaveValue(ming)}` || "未命名";
}

export function valueWithDraft(field: BgDatabaseField | undefined, rowIndex: number, draft?: SaveEditDraft) {
  return saveEditDraftFieldValue(field, rowIndex, draft);
}





