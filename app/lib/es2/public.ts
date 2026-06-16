import { readEs2File, writeEs2File } from "./codec";
import type { Es2File } from "./types";

export function parseEs2(input: ArrayBuffer | Uint8Array): Es2File {
  const bytes = input instanceof Uint8Array ? new Uint8Array(input) : new Uint8Array(input);
  return readEs2File(bytes);
}

export function writeEs2(file: Es2File) {
  return writeEs2File(file);
}
