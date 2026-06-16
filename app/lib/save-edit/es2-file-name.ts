import {
  Activity,
  Archive,
  BadgeInfo,
  BadgePercent,
  BookOpen,
  Bug,
  DatabaseBackup,
  Flag,
  FolderOpen,
  FolderSymlink,
  Gauge,
  GitBranch,
  History,
  ListChecks,
  LockOpen,
  Mail,
  MousePointerClick,
  Music,
  Radio,
  Save,
  ScrollText,
  Smartphone,
  Swords,
  Ticket,
  Trophy,
  UserRound,
  Volume2,
} from "@lucide/vue";
import type { Component } from "vue";

export const SAVE_EDIT_ES2_FILE_NAME_HASH_OFFSET = 31_489;

export type SaveEditDbKeyInfo = {
  key: string;
  label: string;
  icon: Component;
};

export const SAVE_EDIT_DB_KEYS: SaveEditDbKeyInfo[] = [
  { key: "JingMaiPoint", label: "真元", icon: BadgePercent },
  { key: "SavePath", label: "存档路径", icon: FolderOpen },
  { key: "BackUpPath", label: "备份路径", icon: DatabaseBackup },
  { key: "BGM", label: "背景音乐设置", icon: Music },
  { key: "SE", label: "音效设置", icon: Volume2 },
  { key: "PlayID", label: "玩家 ID", icon: UserRound },
  { key: "CDKEY", label: "兑换码记录", icon: Ticket },
  { key: "IsClear", label: "通关记录", icon: Trophy },
  { key: "HandBattle", label: "手动战斗设置", icon: Swords },
  { key: "经脉", label: "经脉存档", icon: GitBranch },
  { key: "难度", label: "已解锁难度", icon: Gauge },
  { key: "LastNanDu", label: "上次难度", icon: History },
  { key: "GameMail", label: "邮件存档", icon: Mail },
  { key: "XKMUnlock", label: "侠客剧本解锁", icon: LockOpen },
  { key: "XKMClear", label: "侠客模式通关记录", icon: Flag },
  { key: "XKMSavePath", label: "侠客模式存档路径", icon: FolderSymlink },
  { key: "DS埋点", label: "埋点记录", icon: Radio },
  { key: "DS人生剧", label: "人生剧记录", icon: BookOpen },
  { key: "DS侠客传", label: "侠客传记录", icon: ScrollText },
  { key: "RenShengDesc", label: "人生剧描述记录", icon: ListChecks },
  { key: "XiaKeDesc", label: "侠客传描述记录", icon: ListChecks },
  { key: "IosRank", label: "iOS 排行记录", icon: Smartphone },
  { key: "BackUpInfo", label: "备份信息", icon: Archive },
  { key: "Version", label: "版本记录", icon: BadgeInfo },
  { key: "AffiarCheat", label: "事件调试记录", icon: Bug },
  { key: "CunDangs", label: "存档槽索引", icon: Save },
  { key: "NewestCunDang", label: "当前存档槽", icon: MousePointerClick },
  { key: "TapTapStatus", label: "TapTap 状态", icon: Activity },
];

export function encodeSaveEditEs2FileName(key: string) {
  return String(Math.abs(oldDotNetStringHash(key)) + SAVE_EDIT_ES2_FILE_NAME_HASH_OFFSET);
}

export function decodeSaveEditEs2FileName(fileName: string): SaveEditDbKeyInfo | null {
  return SAVE_EDIT_DB_KEYS.find((item) => encodeSaveEditEs2FileName(item.key) === fileName) || null;
}

export function saveEditDbKeyInfoByKey(key: string): SaveEditDbKeyInfo | null {
  return SAVE_EDIT_DB_KEYS.find((item) => item.key === key) || null;
}

function oldDotNetStringHash(value: string) {
  let hash1 = 5381;
  let hash2 = hash1;

  for (let index = 0; index < value.length; index += 2) {
    hash1 = (((hash1 << 5) + hash1) ^ value.charCodeAt(index)) | 0;
    if (index === value.length - 1) break;
    hash2 = (((hash2 << 5) + hash2) ^ value.charCodeAt(index + 1)) | 0;
  }

  return (hash1 + Math.imul(hash2, 1_566_083_941)) | 0;
}
