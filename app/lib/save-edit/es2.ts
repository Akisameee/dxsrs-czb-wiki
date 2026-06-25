import { ES2_TYPE_HASHES, type Es2CunDang, type Es2ListValue, type Es2Value } from "../es2";
import { decodeSaveEditEs2FileName } from "./es2-file-name";
import type { SaveEditWorkspaceItemView } from "./workspace";
import type { AnySaveEditFile, SaveEditDraft, SaveEditEs2File } from "./model";

export const ES2_DRAFT_PREFIX = "es2:";
export const ES2_DRAFT_VALUE_KEY = `${ES2_DRAFT_PREFIX}value`;
export const ES2_DRAFT_STRING_LIST_KEY = `${ES2_DRAFT_PREFIX}string-list`;
export const ES2_DRAFT_CUN_DANGS_KEY = `${ES2_DRAFT_PREFIX}cundangs`;

export type SaveEditEs2PageView = {
  item: SaveEditWorkspaceItemView;
  save: SaveEditEs2File;
  currentSave: SaveEditEs2File;
  draft: SaveEditDraft;
  fileName: string;
};

export type SaveEditMeridianGroup = {
  name: string;
  points: string[];
};

export const SAVE_EDIT_MERIDIAN_GROUPS: SaveEditMeridianGroup[] = [
  meridianGroup("任脉", 13),
  meridianGroup("督脉", 13),
  meridianGroup("冲脉", 11),
  meridianGroup("带脉", 12),
];

export const SAVE_EDIT_MERIDIAN_POINTS = SAVE_EDIT_MERIDIAN_GROUPS.flatMap((group) => group.points);

export function createSaveEditEs2PageView(
  item: SaveEditWorkspaceItemView,
  isTargetFile: (save: AnySaveEditFile | null | undefined, fileName?: string) => save is SaveEditEs2File,
): SaveEditEs2PageView | null {
  if (item.save?.kind !== "es2") return null;
  if (!isTargetFile(item.currentSave, item.fileName)) return null;
  return {
    item,
    save: item.save,
    currentSave: item.currentSave as SaveEditEs2File,
    draft: item.draft,
    fileName: item.fileName,
  };
}

export function applyEs2Draft(save: SaveEditEs2File, draft: SaveEditDraft | undefined): SaveEditEs2File {
  const value = save.es2.value;
  const es2Draft = draft?.es2 || {};

  if (value.type === "int" && ES2_DRAFT_VALUE_KEY in es2Draft) {
    const parsed = Number(es2Draft[ES2_DRAFT_VALUE_KEY]);
    return withEs2Value(save, { ...value, value: Number.isFinite(parsed) ? Math.trunc(parsed) : 0 });
  }

  if (value.type === "string" && ES2_DRAFT_VALUE_KEY in es2Draft) {
    return withEs2Value(save, { ...value, value: es2Draft[ES2_DRAFT_VALUE_KEY] });
  }

  if (value.type === "bool" && ES2_DRAFT_VALUE_KEY in es2Draft) {
    return withEs2Value(save, { ...value, value: es2Draft[ES2_DRAFT_VALUE_KEY] === "true" });
  }

  if (isStringListValue(value) && ES2_DRAFT_STRING_LIST_KEY in es2Draft) {
    return withEs2Value(save, stringListValue(readStringArrayDraft(es2Draft[ES2_DRAFT_STRING_LIST_KEY])));
  }

  if (isCunDangListValue(value) && ES2_DRAFT_CUN_DANGS_KEY in es2Draft) {
    return withEs2Value(save, cunDangListValue(readCunDangArrayDraft(es2Draft[ES2_DRAFT_CUN_DANGS_KEY])));
  }

  return save;
}

export function updateEs2ScalarDraft(save: SaveEditEs2File, draft: SaveEditDraft | undefined, nextValue: string | number | boolean) {
  const value = save.es2.value;
  if (value.type === "int") {
    const parsed = Number(nextValue);
    return withDraftValue(draft, ES2_DRAFT_VALUE_KEY, String(Number.isFinite(parsed) ? Math.trunc(parsed) : 0), String(value.value));
  }
  if (value.type === "string") {
    return withDraftValue(draft, ES2_DRAFT_VALUE_KEY, String(nextValue), value.value);
  }
  if (value.type === "bool") {
    const next = nextValue === true || nextValue === "true" || nextValue === "1";
    return withDraftValue(draft, ES2_DRAFT_VALUE_KEY, String(next), String(value.value));
  }
  return draft || { tables: {}, es2: {} };
}

export function updateEs2StringListDraft(save: SaveEditEs2File, draft: SaveEditDraft | undefined, values: string[]) {
  if (!isStringListValue(save.es2.value)) return draft || { tables: {}, es2: {} };
  return withDraftValue(
    draft,
    ES2_DRAFT_STRING_LIST_KEY,
    JSON.stringify(values),
    JSON.stringify(saveEditStringListValues(save)),
  );
}

export function updateEs2CunDangsDraft(save: SaveEditEs2File, draft: SaveEditDraft | undefined, values: Es2CunDang[]) {
  if (!isCunDangListValue(save.es2.value)) return draft || { tables: {}, es2: {} };
  return withDraftValue(
    draft,
    ES2_DRAFT_CUN_DANGS_KEY,
    JSON.stringify(values),
    JSON.stringify(saveEditCharacterSlotsValues(save)),
  );
}

export function isSaveEditStringListFile(save: AnySaveEditFile | null | undefined): save is SaveEditEs2File {
  return save?.kind === "es2" && isStringListValue(save.es2.value);
}

export function saveEditStringListValues(save: SaveEditEs2File | null | undefined) {
  if (!save || !isStringListValue(save.es2.value)) return [];
  return save.es2.value.values.map((value) => (value.type === "string" ? value.value : ""));
}

export function isSaveEditTrackingFile(save: AnySaveEditFile | null | undefined, fileName?: string): save is SaveEditEs2File {
  return decodeSaveEditEs2FileName(fileName || "")?.key === "DS埋点" && isSaveEditStringListFile(save);
}

export function saveEditTrackingValues(save: SaveEditEs2File | null | undefined) {
  return saveEditStringListValues(save);
}

export function isSaveEditMeridianFile(save: AnySaveEditFile | null | undefined, fileName?: string): save is SaveEditEs2File {
  if (save?.kind !== "es2") return false;
  return decodeSaveEditEs2FileName(fileName || "")?.key === "经脉" && isStringListValue(save.es2.value);
}

export function saveEditMeridianValues(save: SaveEditEs2File | null | undefined) {
  return saveEditStringListValues(save).filter(Boolean);
}

export function isSaveEditCharacterSlotsFile(save: AnySaveEditFile | null | undefined, fileName?: string): save is SaveEditEs2File {
  if (decodeSaveEditEs2FileName(fileName || "")?.key !== "CunDangs") return false;
  const value = save?.kind === "es2" ? save.es2.value : null;
  return value?.type === "list" && value.elementTypeHash.name === "CunDang";
}

export function isSaveEditNewestCharacterSlotFile(save: AnySaveEditFile | null | undefined, fileName?: string): save is SaveEditEs2File {
  return decodeSaveEditEs2FileName(fileName || "")?.key === "NewestCunDang" &&
    save?.kind === "es2" &&
    save.es2.value.type === "string";
}

export function saveEditCharacterSlotsValues(save: SaveEditEs2File | null | undefined) {
  const value = save?.es2.value;
  if (!isCunDangListValue(value)) return [];
  return value.values.map((item) => (item.type === "cunDang" ? item.value : null)).filter((item): item is Es2CunDang => Boolean(item));
}

function withDraftValue(draft: SaveEditDraft | undefined, key: string, value: string, initialValue: string) {
  const next: SaveEditDraft = {
    tables: draft?.tables || {},
    es2: { ...(draft?.es2 || {}) },
  };
  if (value === initialValue) delete next.es2[key];
  else next.es2[key] = value;
  return next;
}

function withEs2Value(save: SaveEditEs2File, value: Es2Value): SaveEditEs2File {
  return {
    ...save,
    es2: {
      ...save.es2,
      value,
    },
  };
}

function stringListValue(values: string[]): Es2Value {
  return {
    type: "list",
    elementTypeHash: ES2_TYPE_HASHES.string,
    values: values.map((value) => ({
      type: "string",
      value,
      typeHash: ES2_TYPE_HASHES.string,
    })),
  };
}

function cunDangListValue(values: Es2CunDang[]): Es2Value {
  return {
    type: "list",
    elementTypeHash: ES2_TYPE_HASHES.cunDang,
    values: values.map((value) => ({
      type: "cunDang",
      typeHash: ES2_TYPE_HASHES.cunDang,
      value,
    })),
  };
}

function readStringArrayDraft(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function readCunDangArrayDraft(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed.map((item) => ({ ...item })) as Es2CunDang[]) : [];
  } catch {
    return [];
  }
}

function meridianGroup(name: string, count: number): SaveEditMeridianGroup {
  return {
    name,
    points: Array.from({ length: count }, (_, index) => `${name}${index + 1}`),
  };
}

function isStringListValue(value: Es2Value | null | undefined): value is Es2ListValue {
  return value?.type === "list" && value.elementTypeHash.name === "string";
}

function isCunDangListValue(value: Es2Value | null | undefined): value is Es2ListValue {
  return value?.type === "list" && value.elementTypeHash.name === "CunDang";
}
