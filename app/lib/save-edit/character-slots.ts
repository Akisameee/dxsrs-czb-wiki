import { ES2_TYPE_HASHES, type Es2CunDang, type Es2Value } from "../es2";
import { decodeSaveEditEs2FileName } from "./es2-file-name";
import type { AnySaveEditFile, SaveEditEs2File } from "./model";

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
  if (value?.type !== "list" || value.elementTypeHash.name !== "CunDang") return [];
  return value.values.map((item) => (item.type === "cunDang" ? item.value : null)).filter((item): item is Es2CunDang => Boolean(item));
}

export function withSaveEditCharacterSlotsValues(save: SaveEditEs2File, values: Es2CunDang[]): SaveEditEs2File {
  return {
    ...save,
    es2: {
      ...save.es2,
      value: {
        type: "list",
        elementTypeHash: ES2_TYPE_HASHES.cunDang,
        values: values.map<Es2Value>((value) => ({
          type: "cunDang",
          typeHash: ES2_TYPE_HASHES.cunDang,
          value,
        })),
      },
    },
  };
}

export function saveEditNewestCharacterSlotValue(save: SaveEditEs2File | null | undefined) {
  return save?.es2.value.type === "string" ? save.es2.value.value : "";
}

export function withSaveEditNewestCharacterSlotValue(save: SaveEditEs2File, value: string): SaveEditEs2File {
  if (save.es2.value.type !== "string") return save;
  return {
    ...save,
    es2: {
      ...save.es2,
      value: {
        ...save.es2.value,
        value,
      },
    },
  };
}
