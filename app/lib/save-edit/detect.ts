export type SaveEditFileKind = "bgdatabase" | "es2" | "unknown";

const BG_BINARY_VERSION = 5;
const BG_UNIQUE_ID = [
  0x97, 0xd8, 0x68, 0x25, 0x45, 0xf1, 0x47, 0x48,
  0xae, 0x49, 0x52, 0x84, 0xcd, 0xfc, 0xdc, 0xc7,
];

export function detectSaveEditFileKind(input: ArrayBuffer | Uint8Array): SaveEditFileKind {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (isBgDatabaseSave(bytes)) return "bgdatabase";
  if (isEs2Save(bytes)) return "es2";
  return "unknown";
}

export function isBgDatabaseSave(bytes: Uint8Array) {
  if (bytes.byteLength < 20) return false;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getInt32(0, true) !== BG_BINARY_VERSION) return false;
  return BG_UNIQUE_ID.every((value, index) => bytes[index + 4] === value);
}

export function isEs2Save(bytes: Uint8Array) {
  return bytes.byteLength >= 2 && bytes[0] === 0x7e && bytes[1] === 0x00;
}
