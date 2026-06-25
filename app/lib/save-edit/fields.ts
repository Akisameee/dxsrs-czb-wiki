import type { BgDatabaseValue } from "../bgdatabase";
import type { WikiEnums } from "../wiki/text";

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
