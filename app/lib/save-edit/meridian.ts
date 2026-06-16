import { ES2_TYPE_HASHES } from "../es2";
import type { Es2Value } from "../es2";
import { decodeSaveEditEs2FileName } from "./es2-file-name";
import type { AnySaveEditFile, SaveEditEs2File } from "./model";

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

export function isSaveEditMeridianFile(save: AnySaveEditFile | null | undefined, fileName?: string) {
  if (save?.kind !== "es2") return false;
  return decodeSaveEditEs2FileName(fileName || "")?.key === "经脉" && isStringListValue(save.es2.value);
}

export function saveEditMeridianValues(save: SaveEditEs2File | null | undefined) {
  if (!save || !isStringListValue(save.es2.value)) return [];
  return save.es2.value.values
    .map((value) => (value.type === "string" ? value.value : ""))
    .filter(Boolean);
}

export function withSaveEditMeridianValues(save: SaveEditEs2File, values: string[]): SaveEditEs2File {
  const uniqueValues = [...new Set(values)].filter((value) => SAVE_EDIT_MERIDIAN_POINTS.includes(value));
  const orderedValues = SAVE_EDIT_MERIDIAN_POINTS.filter((point) => uniqueValues.includes(point));

  return {
    ...save,
    es2: {
      ...save.es2,
      value: {
        type: "list",
        elementTypeHash: ES2_TYPE_HASHES.string,
        values: orderedValues.map<Es2Value>((value) => ({
          type: "string",
          value,
          typeHash: ES2_TYPE_HASHES.string,
        })),
      },
    },
  };
}

function meridianGroup(name: string, count: number): SaveEditMeridianGroup {
  return {
    name,
    points: Array.from({ length: count }, (_, index) => `${name}${index + 1}`),
  };
}

function isStringListValue(value: Es2Value) {
  return value.type === "list" && value.elementTypeHash.name === "string";
}
