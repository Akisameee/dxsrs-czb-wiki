export type Es2ValueType =
  | "int"
  | "bool"
  | "string"
  | "list"
  | "cunDang"
  | "unknown";

export type Es2TypeHash = {
  bytes: number[];
  hex: string;
  name: string;
};

export type Es2PrimitiveValue =
  | { type: "int"; value: number; typeHash: Es2TypeHash }
  | { type: "bool"; value: boolean; typeHash: Es2TypeHash }
  | { type: "string"; value: string; typeHash: Es2TypeHash };

export type Es2ListValue = {
  type: "list";
  elementTypeHash: Es2TypeHash;
  values: Es2Value[];
};

export type Es2CunDangValue = {
  type: "cunDang";
  typeHash: Es2TypeHash;
  value: Es2CunDang;
};

export type Es2UnknownValue = {
  type: "unknown";
  typeHash?: Es2TypeHash;
  bytes: Uint8Array;
};

export type Es2Value = Es2PrimitiveValue | Es2ListValue | Es2CunDangValue | Es2UnknownValue;

export type Es2File = {
  magic: number;
  payloadLength: number;
  value: Es2Value;
  bytes: Uint8Array;
};

export type Es2CunDang = {
  uid: string;
  isNormalMode: boolean;
  slotid: number;
  player: string;
  menPai: number;
  old: number;
  qianfa: string;
  houfa: string;
  maozi: string;
  meimao: string;
  lianshi: string;
  yifu: string;
  houbei: string;
  huzi: string;
  isplaying: boolean;
  savepath: string;
  zhujue: number;
  gongli: number;
  difficult: number;
  sex: number;
};
