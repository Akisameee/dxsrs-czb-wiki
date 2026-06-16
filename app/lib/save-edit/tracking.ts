import { decodeSaveEditEs2FileName } from "./es2-file-name";
import {
  isSaveEditStringListFile,
  saveEditStringListValues,
  withSaveEditStringListValues,
  type AnySaveEditFile,
  type SaveEditEs2File,
} from "./model";

export function isSaveEditTrackingFile(save: AnySaveEditFile | null | undefined, fileName?: string): save is SaveEditEs2File {
  return decodeSaveEditEs2FileName(fileName || "")?.key === "DS埋点" && isSaveEditStringListFile(save);
}

export function saveEditTrackingValues(save: SaveEditEs2File | null | undefined) {
  return saveEditStringListValues(save);
}

export function withSaveEditTrackingValues(save: SaveEditEs2File, values: string[]) {
  return withSaveEditStringListValues(save, values);
}
