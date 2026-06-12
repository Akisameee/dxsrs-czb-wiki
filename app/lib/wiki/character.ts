import { enumLabel, groupBy } from "../utils";
import {
  joinWikiPartGroups,
  wikiCharacter,
  type WikiEnums,
  wikiItem,
  type WikiTextPart,
  wikiPartsToText,
  wikiText,
} from "./text";

export type { WikiEnums } from "./text";

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
  parts: WikiTextPart[];
};

export type CharacterSummary = {
  id: number;
  name: string;
  initial: string;
  detailUrl: string;
  rarityId: number;
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

function questTargetParts(
  target: CharacterQuestTargetRow | undefined,
  enums: WikiEnums,
  fallback: string,
): WikiTextPart[] {
  if (!target || target.target_id === null) return [wikiText(fallback)];
  const text = questTargetLabel(target, enums);

  if (target.target_kind === "character") {
    return [wikiCharacter(target.target_id, text)];
  }
  if (target.target_kind === "item") {
    return [wikiItem(target.target_id, text)];
  }
  return [wikiText(text)];
}

function withQuestReward(quest: CharacterQuestRow, parts: WikiTextPart[], enums: WikiEnums) {
  if (quest.reward_item_id === null) return parts;
  return [
    ...parts,
    wikiText("，奖励 "),
    wikiItem(quest.reward_item_id, enumLabel(enums, "Item", quest.reward_item_id, `道具 ${quest.reward_item_id}`)),
  ];
}

export function formatQuestParts(
  quest: CharacterQuestRow,
  targets: CharacterQuestTargetRow[],
  enums: WikiEnums,
): WikiTextPart[] {
  const mainTarget = targets.find((target) => target.target_role === "main");
  const extras = targets.filter((target) => target.target_role !== "main");
  const main = (fallback: string) => questTargetParts(mainTarget, enums, fallback);
  const extraGroups = (fallback: string) => extras.map((target) => questTargetParts(target, enums, fallback));

  if (quest.quest_type_id === 240) {
    return withQuestReward(quest, [wikiText("交付"), ...main("指定物品")], enums);
  }
  if (quest.quest_type_id === 241) {
    return withQuestReward(quest, [wikiText("教训"), ...main("指定人物")], enums);
  }
  if (quest.quest_type_id === 242) {
    const parts = [...main("指定地点"), wikiText("寻宝")];
    if (extras.length) {
      parts.push(wikiText("，击败"));
      parts.push(...joinWikiPartGroups(extraGroups("未知人物"), "、"));
    }
    return withQuestReward(quest, parts, enums);
  }
  if (quest.quest_type_id === 243) {
    return withQuestReward(quest, [wikiText("给"), ...main("指定人物"), wikiText("下挑战书")], enums);
  }
  if (quest.quest_type_id === 244) {
    return withQuestReward(quest, [wikiText("赢得与"), ...main("指定人物"), wikiText("的比武")], enums);
  }
  if (quest.quest_type_id === 720) {
    const sectParts = extras.length
      ? joinWikiPartGroups(extraGroups("指定门派"), "、")
      : main("指定门派");
    return withQuestReward(quest, [wikiText("参加"), ...sectParts, wikiText("武林大会")], enums);
  }

  const questType = enumLabel(enums, "QuestType", quest.quest_type_id, "任务").replace(/^情缘_/, "");
  const targetGroups = targets.map((target) => questTargetParts(target, enums, ""));
  const targetText = joinWikiPartGroups(targetGroups, "、");
  return withQuestReward(
    quest,
    targetText.length ? [wikiText(`${questType}：`), ...targetText] : [wikiText(questType)],
    enums,
  );
}

export function questSummary(
  quest: CharacterQuestRow,
  targets: CharacterQuestTargetRow[],
  enums: WikiEnums,
) {
  return wikiPartsToText(formatQuestParts(quest, targets, enums));
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
    rarityId: character.rarity_id,
    location: characterLocationText(character, enums),
    sect: enumLabel(enums, "LianSuo_MP", character.sect_id, "无门派"),
    rarity: enumLabel(enums, "NPC_Rare", character.rarity_id, "资质"),
    weaponType: enumLabel(enums, "BingQiType", character.weapon_type_id, "未知"),
    quests: quests.map((quest) => {
      const parts = formatQuestParts(quest, targetsByQuest.get(quest.id) || [], enums);
      return {
        id: quest.id,
        stage: quest.stage,
        parts,
        text: wikiPartsToText(parts),
      };
    }),
  };
}
