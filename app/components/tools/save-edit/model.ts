import {
  writeBgDatabaseUpdates,
  type BgDatabaseField,
  type BgDatabaseFieldUpdate,
  type BgDatabaseFile,
  type BgDatabaseTable,
  type BgDatabaseValue,
} from "~/lib/bgdatabase";
import type { WikiEnums } from "~/lib/wiki/text";

export type SaveEditDraft = Record<string, string>;

export type SaveEditFile = BgDatabaseFile & {
  zhuJue: BgDatabaseTable;
};

export type SaveEditFieldDefinition = {
  key: string;
  label: string;
  input: "text" | "number" | "select";
  group: "basic" | "attributes" | "martial" | "life" | "portrait" | "equipment";
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ id: string; label: string }>;
};

const SAVE_EDIT_FALLBACK_ENUM_BY_FIELD: Record<string, string> = {
  sex: "Sex",
  menpai: "MenPai",
  diwei: "DiWei",
  dengji: "Dengji",
  liansuo_mp: "LianSuo_MP",
  liansuo_fg1: "LianSuo_FG",
  liansuo_fg2: "LianSuo_FG",
  rare: "NPC_Rare",
  type: "JueSeType",
};

export const SAVE_EDIT_ENUM_FIELD_TYPES: Record<string, string> = {
  // 存档仍保留部分旧字段。menpai 是旧门派 id，必须用 MenPai；liansuo_mp 才是重制版链锁门派 id。
  "ZhuJue.sex": "Sex",
  "ZhuJue.menpai": "MenPai",
  "ZhuJue.diwei": "DiWei",
  "ZhuJue.dengji": "Dengji",
  "ZhuJue.xiuxingarea": "XiuXingArea",

  "XingNang.type": "ItemType",
  "XingNang.rare": "ItemRare",
  "XingNang.mingke_fg": "LianSuo_FG",

  "ShangBing.type": "ShangBingType",
  "ShangBing.buwei": "ShangBingBuWei",
  "ShangBing.chengdu": "ShangBingChengDu",

  "JSWugong.wugongtype": "BingQiType",
  "JSWugong.liansuo_mp": "LianSuo_MP",
  "JSWugong.liansuo_fg1": "LianSuo_FG",
  "JSWugong.liansuo_fg2": "LianSuo_FG",

  "GWuGong.type": "BingQiType",
  "GWuGong.rare": "WuGongRare",
  "GWuGong.liansuo_mp": "LianSuo_MP",
  "GWuGong.liansuo_fg1": "LianSuo_FG",
  "GWuGong.liansuo_fg2": "LianSuo_FG",
  "GWuGong.slashfx": "SlashFXType",
  "GWuGong.hitfx": "FXType",
  "GWuGong.buff1": "BuffType",
  "GWuGong.buff2": "BuffType",
  "GWuGong.buff3": "BuffType",
  "GWuGong.bufftarget1": "BuffTarget",
  "GWuGong.bufftarget2": "BuffTarget",
  "GWuGong.bufftarget3": "BuffTarget",
  "GWuGong.beidong1": "BeiDongType",
  "GWuGong.beidong2": "BeiDongType",
  "GWuGong.beidong3": "BeiDongType",

  "RenWu.missiontype": "MissionType",
  "RenWu.questtype": "QuestType",
  "RenWu.rewardtype": "RewardType",

  "Npc.type": "JueSeType",
  "Npc.sex": "Sex",
  "Npc.menpai": "MenPai",
  "Npc.diwei": "DiWei",
  "Npc.dengji": "Dengji",
  "Npc.likerare": "ItemRare",
  "Npc.shengchantype": "ShengChanType",
  "Npc.bingqitype": "BingQiType",
  "Npc.changzhangtype": "NPC_ChengZhangType",
  "Npc.wugongtype": "NPC_WuGongType",
  "Npc.rare": "NPC_Rare",
  "Npc.tupotype": "TouXiangType",

  "CaiJi.itemrare": "ItemRare",
  "CaiJi.itemtype": "ItemType",
  "MingZi.sex": "Sex",

  "MuBiao.type": "MuBiaoType",
  "MuBiao.MuBiaoRewardType": "MuBiaoRewardType",
  "ChengHao.rare": "ChengHaoRare",
  "ChengHao.shuxingtype": "ShuXingType",

  "MenPaiInfo.fangzhen": "FangZhen",
  "MenPaiInfo.zengyitufa": "MenPaiTuFa",
  "MenPaiInfo.fenglutufa": "MenPaiTuFa",
  "MenPaiInfo.exptufa": "MenPaiTuFa",
  "Ads.type": "AdsType",

  "ShiJian.affairtype": "AffairType",
  "ShiJian.rewardtype": "RewardType",
  "Option.diffcult": "Difficult",
  "Option.juben": "JuBen",
  "Option.zhujue": "GameZhuJue",

  "FuBen.yuan": "FuBenYuan",
  "FuBenDetail.type": "FuBenOptionType",
  "FuBenRecord.type": "FuBenRecordType",
};

export const SAVE_EDIT_FIELD_DEFINITIONS: SaveEditFieldDefinition[] = [
  { key: "xing", label: "姓", input: "text", group: "basic" },
  { key: "ming", label: "名", input: "text", group: "basic" },
  { key: "sex", label: "性别", input: "select", group: "basic", options: optionRows({ 0: "男", 1: "女" }) },
  {
    key: "menpai",
    label: "门派",
    input: "select",
    group: "basic",
    options: optionRows({
      0: "少林寺",
      1: "武当派",
      2: "丐帮",
      3: "全真教",
      4: "华山派",
      5: "逍遥派",
      6: "古墓派",
      7: "桃花岛",
      8: "日月神教",
      9: "五毒教",
      10: "明教",
      11: "白驼山",
      12: "六扇门",
      13: "天龙寺",
      14: "追魂阁",
      15: "长风镖局",
      16: "江湖",
      17: "青龙会",
    }),
  },
  {
    key: "diwei",
    label: "地位",
    input: "select",
    group: "basic",
    options: optionRows({
      0: "记名弟子",
      1: "入门弟子",
      2: "入室弟子",
      3: "嫡传弟子",
      4: "长老",
      5: "护法",
      6: "掌门",
    }),
  },
  { key: "old", label: "年龄", input: "number", group: "basic", min: 0, max: 999 },
  { key: "maxold", label: "寿命", input: "number", group: "basic", min: 1, max: 999 },
  { key: "gold", label: "银两", input: "number", group: "basic", min: 0 },
  { key: "xingdongli", label: "行动力", input: "number", group: "basic", min: 0 },
  { key: "maxxingdongli", label: "最大行动力", input: "number", group: "basic", min: 0 },
  { key: "chenghao", label: "称号", input: "text", group: "basic" },

  { key: "lvli", label: "膂力", input: "number", group: "attributes", min: 0, max: 9999 },
  { key: "gengu", label: "根骨", input: "number", group: "attributes", min: 0, max: 9999 },
  { key: "tipo", label: "体魄", input: "number", group: "attributes", min: 0, max: 9999 },
  { key: "shenfa", label: "身法", input: "number", group: "attributes", min: 0, max: 9999 },
  { key: "lvli_plus", label: "膂力加成", input: "number", group: "attributes", min: -9999, max: 9999 },
  { key: "genfu_plus", label: "根骨加成", input: "number", group: "attributes", min: -9999, max: 9999 },
  { key: "tipo_plus", label: "体魄加成", input: "number", group: "attributes", min: -9999, max: 9999 },
  { key: "shenfa_plus", label: "身法加成", input: "number", group: "attributes", min: -9999, max: 9999 },

  { key: "wuxuexiuwei", label: "武学修为", input: "number", group: "martial", min: 0, max: 9999 },
  { key: "quanzhang", label: "拳掌", input: "number", group: "martial", min: 0, max: 9999 },
  { key: "daojian", label: "刀剑", input: "number", group: "martial", min: 0, max: 9999 },
  { key: "qiangbang", label: "枪棒", input: "number", group: "martial", min: 0, max: 9999 },
  { key: "anqi", label: "暗器", input: "number", group: "martial", min: 0, max: 9999 },
  { key: "neigong", label: "内功", input: "number", group: "martial", min: 0, max: 9999 },
  { key: "maxwugongqty", label: "武功上限", input: "number", group: "martial", min: 0, max: 99 },

  { key: "mingsheng", label: "名声", input: "number", group: "life", min: -9999, max: 9999 },
  { key: "xiayi", label: "侠义", input: "number", group: "life", min: -9999, max: 9999 },
  { key: "gongxian", label: "贡献", input: "number", group: "life", min: 0 },
  { key: "wakuang", label: "挖矿", input: "number", group: "life", min: 0, max: 9999 },
  { key: "caiyao", label: "采药", input: "number", group: "life", min: 0, max: 9999 },
  { key: "dalie", label: "打猎", input: "number", group: "life", min: 0, max: 9999 },
  { key: "duanzao", label: "锻造", input: "number", group: "life", min: 0, max: 9999 },
  { key: "liandan", label: "炼丹", input: "number", group: "life", min: 0, max: 9999 },
  { key: "caifeng", label: "裁缝", input: "number", group: "life", min: 0, max: 9999 },

  { key: "qianfa", label: "前发", input: "text", group: "portrait" },
  { key: "houfa", label: "后发", input: "text", group: "portrait" },
  { key: "maozi", label: "嘴巴/帽子位", input: "text", group: "portrait" },
  { key: "meimao", label: "眉毛", input: "text", group: "portrait" },
  { key: "lianshi", label: "脸型", input: "text", group: "portrait" },
  { key: "yifu", label: "衣服", input: "text", group: "portrait" },
  { key: "houbei", label: "背部", input: "text", group: "portrait" },
  { key: "huzi", label: "胡子", input: "text", group: "portrait" },

  { key: "wq1_uid", label: "武器 1 UID", input: "text", group: "equipment" },
  { key: "wq2_uid", label: "武器 2 UID", input: "text", group: "equipment" },
  { key: "fj_uid", label: "防具 UID", input: "text", group: "equipment" },
];

export function asSaveEditFile(database: BgDatabaseFile): SaveEditFile {
  const zhuJue = database.tables.find((table) => table.name === "ZhuJue");
  if (!zhuJue) {
    throw new Error("没有找到主角表 ZhuJue");
  }
  return { ...database, zhuJue };
}

export function createSaveEditDraft(save: SaveEditFile): SaveEditDraft {
  const draft: SaveEditDraft = {};
  for (const definition of SAVE_EDIT_FIELD_DEFINITIONS) {
    const field = save.zhuJue.fields[definition.key];
    if (!field) continue;
    const value = field.values[0];
    if (value === null || value === undefined) continue;
    draft[fieldDraftKey(field, 0)] = String(value);
  }
  return draft;
}

export function writeSaveEditFile(save: SaveEditFile, draft: SaveEditDraft): Uint8Array {
  return writeBgDatabaseUpdates(save, draftToUpdates(save, draft));
}

export function draftToUpdates(save: SaveEditFile, draft: SaveEditDraft) {
  return Object.entries(draft)
    .map(([key, value]) => {
      const parsed = parseFieldDraftKey(key);
      if (!parsed) return null;
      const table = save.tables[parsed.tableIndex];
      const field = table?.fieldNames
        .map((fieldName) => table.fields[fieldName])
        .find((candidate) => candidate?.fieldIndex === parsed.fieldIndex);
      return field ? { field, rowIndex: parsed.rowIndex, value } : null;
    })
    .filter((update): update is BgDatabaseFieldUpdate => Boolean(update));
}

export function fieldDraftKey(field: BgDatabaseField, rowIndex: number) {
  return `${field.tableIndex}:${field.fieldIndex}:${rowIndex}`;
}

export function parseFieldDraftKey(key: string) {
  const parts = key.split(":").map(Number);
  if (parts.length !== 3) return null;
  const [tableIndex, fieldIndex, rowIndex] = parts as [number, number, number];
  if (![tableIndex, fieldIndex, rowIndex].every(Number.isInteger)) return null;
  return { tableIndex, fieldIndex, rowIndex };
}

export function saveEditCharacterName(save: SaveEditFile, draft: SaveEditDraft = {}) {
  const xing = valueWithDraft(save.zhuJue.fields.xing, 0, draft);
  const ming = valueWithDraft(save.zhuJue.fields.ming, 0, draft);
  return `${formatSaveValue(xing)}${formatSaveValue(ming)}` || "未命名";
}

export function valueWithDraft(field: BgDatabaseField | undefined, rowIndex: number, draft: SaveEditDraft) {
  if (!field) return null;
  const key = fieldDraftKey(field, rowIndex);
  return draft[key] ?? field.values[rowIndex] ?? null;
}

export function isEditableSaveValue(value: BgDatabaseValue) {
  return value === null || ["string", "number", "boolean"].includes(typeof value);
}

export function saveEditEnumType(tableName: string, fieldName: string) {
  return SAVE_EDIT_ENUM_FIELD_TYPES[`${tableName}.${fieldName}`] ?? SAVE_EDIT_FALLBACK_ENUM_BY_FIELD[fieldName];
}

export function saveEditEnumOptions(
  enums: WikiEnums | null | undefined,
  tableName: string,
  fieldName: string,
) {
  const enumType = saveEditEnumType(tableName, fieldName);
  if (!enumType) return [];
  return Object.entries(enums?.[enumType] || {})
    .sort(([left], [right]) => Number(left) - Number(right))
    .map(([id, label]) => ({ id, label: label ?? `${enumType} ${id}` }));
}

export function formatSaveValue(value: BgDatabaseValue | undefined) {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function formatSaveFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

function optionRows(values: Record<number, string>) {
  return Object.entries(values)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([id, label]) => ({ id, label }));
}
