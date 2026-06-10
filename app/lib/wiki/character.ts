import { enumLabel, groupBy } from "../utils";

export type WikiEnums = Record<string, Record<string, string | null>>;

export type CharacterSummaryRow = {
  id: number;
  region_id: number | null;
  location_id: number | null;
  sect_id: number;
  rarity_id: number;
  weapon_type_id: number;
};

export type CharacterQuestRow = {
  id: number;
  character_id: number;
  stage: number;
  required_affinity: number;
  quest_type_id: number;
  reward_item_id: number | null;
};

export type CharacterQuestTargetRow = {
  quest_id: number;
  slot: number;
  target_role: string;
  target_kind: string;
  target_id: number | null;
  target_region_id: number | null;
};

export type CharacterQuestSummary = {
  id: number;
  stage: number;
  text: string;
};

export type CharacterSummary = {
  id: number;
  name: string;
  initial: string;
  detailUrl: string;
  location: string;
  sect: string;
  rarity: string;
  weaponType: string;
  quests: CharacterQuestSummary[];
};

export function characterName(item: Pick<CharacterSummaryRow, "id">, enums: WikiEnums) {
  return enumLabel(enums, "Character", item.id, `人物 ${item.id}`);
}

export function characterInitial(item: Pick<CharacterSummaryRow, "id">, enums: WikiEnums) {
  return characterName(item, enums).slice(0, 1);
}

export function characterDetailUrl(id: number) {
  return `/characters/detail/?id=${id}`;
}

export function characterLocationText(item: CharacterSummaryRow, enums: WikiEnums) {
  if (item.region_id === null || item.location_id === null) return "无地点";
  return `${enumLabel(enums, "DiDian", item.region_id)} / ${enumLabel(enums, "Area", item.location_id)}`;
}

export function questTargetLabel(target: CharacterQuestTargetRow, enums: WikiEnums) {
  if (target.target_kind === "character") {
    return enumLabel(enums, "Character", target.target_id, "未知人物");
  }
  if (target.target_kind === "item") {
    return enumLabel(enums, "Item", target.target_id, "未知道具");
  }
  if (target.target_kind === "location") {
    const region = enumLabel(enums, "DiDian", target.target_region_id, "未知地点");
    const location = enumLabel(enums, "Area", target.target_id, "");
    return location ? `${region} / ${location}` : region;
  }
  if (target.target_kind === "sect") {
    return enumLabel(enums, "LianSuo_MP", target.target_id, "未知门派");
  }
  return target.target_id === null ? "-" : String(target.target_id);
}

function questRewardText(quest: CharacterQuestRow, enums: WikiEnums) {
  return quest.reward_item_id === null
    ? ""
    : enumLabel(enums, "Item", quest.reward_item_id, `道具 ${quest.reward_item_id}`);
}

function withQuestReward(quest: CharacterQuestRow, text: string, enums: WikiEnums) {
  const reward = questRewardText(quest, enums);
  return reward ? `${text} -> ${reward}` : text;
}

export function questSummary(
  quest: CharacterQuestRow,
  targets: CharacterQuestTargetRow[],
  enums: WikiEnums,
) {
  const mainTarget = targets.find((target) => target.target_role === "main");
  const main = mainTarget ? questTargetLabel(mainTarget, enums) : "";
  const extras = targets
    .filter((target) => target.target_role !== "main")
    .map((target) => questTargetLabel(target, enums))
    .filter(Boolean);

  if (quest.quest_type_id === 240) {
    return withQuestReward(quest, `交付 ${main || "指定物品"}`, enums);
  }
  if (quest.quest_type_id === 241) {
    return withQuestReward(quest, `教训 ${main || "指定人物"}`, enums);
  }
  if (quest.quest_type_id === 242) {
    const related = extras.length ? `，找 ${extras.join("、")}` : "";
    return withQuestReward(quest, `${main || "指定地点"} 寻宝${related}`, enums);
  }
  if (quest.quest_type_id === 243) {
    return withQuestReward(quest, `给 ${main || "指定人物"} 下挑战书`, enums);
  }
  if (quest.quest_type_id === 244) {
    return withQuestReward(quest, `赢得与 ${main || "指定人物"} 的比武`, enums);
  }
  if (quest.quest_type_id === 720) {
    const sect = extras.length ? extras.join("、") : main;
    return withQuestReward(quest, `参加 ${sect || "指定门派"} 武林大会`, enums);
  }

  const questType = enumLabel(enums, "QuestType", quest.quest_type_id, "任务").replace(/^情缘_/, "");
  const targetText = targets.map((target) => questTargetLabel(target, enums)).join("、");
  return withQuestReward(quest, targetText ? `${questType}：${targetText}` : questType, enums);
}

export function buildCharacterSummary(
  character: CharacterSummaryRow,
  quests: CharacterQuestRow[],
  questTargets: CharacterQuestTargetRow[],
  enums: WikiEnums,
): CharacterSummary {
  const targetsByQuest = groupBy(questTargets, "quest_id");
  return {
    id: character.id,
    name: characterName(character, enums),
    initial: characterInitial(character, enums),
    detailUrl: characterDetailUrl(character.id),
    location: characterLocationText(character, enums),
    sect: enumLabel(enums, "LianSuo_MP", character.sect_id, "无门派"),
    rarity: enumLabel(enums, "NPC_Rare", character.rarity_id, "资质"),
    weaponType: enumLabel(enums, "BingQiType", character.weapon_type_id, "未知"),
    quests: quests.map((quest) => ({
      id: quest.id,
      stage: quest.stage,
      text: questSummary(quest, targetsByQuest.get(quest.id) || [], enums),
    })),
  };
}
