import { enumLabel, groupBy } from "../../utils";
import {
  linkCharactersInText,
  joinWikiPartGroups,
  wikiCharacter,
  type WikiEnums,
  wikiItem,
  wikiStrong,
  type WikiTextPart,
  wikiPartsToText,
  wikiText,
} from "../text";

export type { WikiEnums } from "../text";

export type CharacterSummaryRow = {
  id: number;
  name: string | null;
  portrait: string | null;
  region_id: number | null;
  location_id: number | null;
  sect_id: number | null;
  sect_name?: string | null;
  position_id: number | null;
  rank_id: number | null;
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
  reward_item_name?: string | null;
};

export type CharacterQuestTargetRow = {
  quest_id: number;
  slot: number;
  target_role: string;
  target_kind: string;
  target_id: number | null;
  target_region_id: number | null;
  target_name?: string | null;
};

export type CharacterInvitationRequirementRow = {
  character_id: number;
  slot: number;
  legacy_name: string | null;
  type_id: number;
  int_value: number | null;
  string_value: string | null;
};

export type CharacterQuestSummary = {
  id: number;
  stage: number;
  text: string;
  parts: WikiTextPart[];
};

export type CharacterInvitationRequirementSummary = {
  slot: number;
  text: string;
  parts: WikiTextPart[];
};

export type CharacterSummary = {
  id: number;
  portrait: string | null;
  name: string;
  initial: string;
  detailUrl: string;
  rarityId: number;
  location: string;
  sect: string;
  position: string;
  rank: string;
  rarity: string;
  weaponType: string;
  invitationRequirements: CharacterInvitationRequirementSummary[];
  quests: CharacterQuestSummary[];
};

export function characterName(item: Pick<CharacterSummaryRow, "id" | "name">) {
  return item.name || `人物 ${item.id}`;
}

export function characterInitial(item: Pick<CharacterSummaryRow, "id" | "name">) {
  return characterName(item).slice(0, 1);
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
    return target.target_name || `人物 ${target.target_id ?? "?"}`;
  }
  if (target.target_kind === "item") {
    return target.target_name || `道具 ${target.target_id ?? "?"}`;
  }
  if (target.target_kind === "location") {
    const region = enumLabel(enums, "DiDian", target.target_region_id, "未知地点");
    const location = enumLabel(enums, "Area", target.target_id, "");
    return location ? `${region} / ${location}` : region;
  }
  if (target.target_kind === "sect") {
    return target.target_name || `门派 ${target.target_id ?? "?"}`;
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

function withQuestReward(quest: CharacterQuestRow, parts: WikiTextPart[]) {
  if (quest.reward_item_id === null) return parts;
  return [
    ...parts,
    wikiText("，奖励"),
    wikiItem(quest.reward_item_id, quest.reward_item_name || `道具 ${quest.reward_item_id}`),
  ];
}

type InvitationTemplateParam = string | number | null | undefined | WikiTextPart | WikiTextPart[];
type InvitationFormatOptions = {
  linkedStringValue?: WikiTextPart[];
};

function isWikiTextPart(value: InvitationTemplateParam): value is WikiTextPart {
  return Boolean(
    value
      && typeof value === "object"
      && !Array.isArray(value)
      && "type" in value
      && "text" in value,
  );
}

function formatInvitationTemplateParts(
  template: string,
  params: InvitationTemplateParam[] = [],
): WikiTextPart[] {
  const parts: WikiTextPart[] = [];
  let index = 0;
  const pattern = /\{param(\d*)\}/g;
  for (const match of template.matchAll(pattern)) {
    if (match.index === undefined) continue;
    if (match.index > index) parts.push(wikiText(template.slice(index, match.index)));

    const valueIndex = match[1] ? Number(match[1]) - 1 : 0;
    const value = params[valueIndex];
    if (Array.isArray(value)) {
      parts.push(...value);
    } else if (isWikiTextPart(value)) {
      parts.push(value);
    } else {
      parts.push(wikiStrong(String(value ?? "-")));
    }
    index = match.index + match[0].length;
  }
  if (index < template.length) parts.push(wikiText(template.slice(index)));
  return parts;
}

type InvitationRequirementTemplate = {
  template: string;
  params?: (row: CharacterInvitationRequirementRow, options: InvitationFormatOptions) => InvitationTemplateParam[];
};

const invitationRequirementTemplates: Record<number, InvitationRequirementTemplate> = {
  0: { template: "成为门派的{param}", params: (row) => [row.string_value || "-"] },
  1: { template: "功力达到{param}" },
  2: { template: "名声达到{param}" },
  3: { template: "侠义值大于{param}" },
  4: { template: "侠义值小于{param}" },
  5: { template: "膂力达到{param}" },
  6: { template: "根骨达到{param}" },
  7: { template: "体魄达到{param}" },
  8: { template: "身法达到{param}" },
  9: { template: "拥有{param}名或以上队友" },
  10: { template: "拥有{param}名或以上男性队友" },
  11: { template: "拥有{param}名或以上女性队友" },
  12: { template: "挖矿达到{param}级" },
  13: { template: "采药达到{param}级" },
  14: { template: "打猎达到{param}级" },
  15: { template: "锻造达到{param}级" },
  16: { template: "炼丹达到{param}级" },
  17: { template: "裁缝达到{param}级" },
  18: { template: "财富达到{param}" },
  19: { template: "等级达到{param}" },
  20: {
    template: "将{param}邀请成为你的队友",
    params: (row, options) => [options.linkedStringValue?.length ? options.linkedStringValue : row.string_value || "指定人物"],
  },
};

export function formatInvitationRequirementParts(
  row: CharacterInvitationRequirementRow,
  enums: WikiEnums,
  options: InvitationFormatOptions = {},
): WikiTextPart[] {
  const intValue = row.int_value ?? 0;
  const item = invitationRequirementTemplates[Number(row.type_id)];
  if (item) return formatInvitationTemplateParts(item.template, item.params?.(row, options) || [intValue]);

  return formatInvitationTemplateParts(`${enumLabel(enums, "YaoQingType", row.type_id, "邀请条件")}：{param}`, [
    row.string_value || intValue,
  ]);
}

export async function formatInvitationRequirementLinkedParts(
  row: CharacterInvitationRequirementRow,
  enums: WikiEnums,
): Promise<WikiTextPart[]> {
  const linkedStringValue = Number(row.type_id) === 20
    ? await linkCharactersInText(row.string_value)
    : [];
  return formatInvitationRequirementParts(row, enums, { linkedStringValue });
}

export async function buildInvitationRequirementSummaries(
  invitationRequirements: CharacterInvitationRequirementRow[],
  enums: WikiEnums,
): Promise<CharacterInvitationRequirementSummary[]> {
  return Promise.all(invitationRequirements.map(async (requirement) => {
    const parts = await formatInvitationRequirementLinkedParts(requirement, enums);
    return {
      slot: requirement.slot,
      parts,
      text: wikiPartsToText(parts),
    };
  }));
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
    return withQuestReward(quest, [wikiText("交付"), ...main("指定物品")]);
  }
  if (quest.quest_type_id === 241) {
    return withQuestReward(quest, [wikiText("教训"), ...main("指定人物")]);
  }
  if (quest.quest_type_id === 242) {
    const parts = [...main("指定地点"), wikiText("寻宝")];
    if (extras.length) {
      parts.push(wikiText("，击败"));
      parts.push(...joinWikiPartGroups(extraGroups("未知人物"), "、"));
    }
    return withQuestReward(quest, parts);
  }
  if (quest.quest_type_id === 243) {
    return withQuestReward(quest, [wikiText("给"), ...main("指定人物"), wikiText("下挑战书")]);
  }
  if (quest.quest_type_id === 244) {
    return withQuestReward(quest, [wikiText("赢得与"), ...main("指定人物"), wikiText("的比武")]);
  }
  if (quest.quest_type_id === 720) {
    const sectParts = extras.length
      ? joinWikiPartGroups(extraGroups("指定门派"), "、")
      : main("指定门派");
    return withQuestReward(quest, [wikiText("参加"), ...sectParts, wikiText("武林大会")]);
  }

  const questType = enumLabel(enums, "QuestType", quest.quest_type_id, "任务").replace(/^情缘_/, "");
  const targetGroups = targets.map((target) => questTargetParts(target, enums, ""));
  const targetText = joinWikiPartGroups(targetGroups, "、");
  return withQuestReward(
    quest,
    targetText.length ? [wikiText(`${questType}：`), ...targetText] : [wikiText(questType)],
  );
}

export function questSummary(
  quest: CharacterQuestRow,
  targets: CharacterQuestTargetRow[],
  enums: WikiEnums,
) {
  return wikiPartsToText(formatQuestParts(quest, targets, enums));
}

export async function buildCharacterSummary(
  character: CharacterSummaryRow,
  quests: CharacterQuestRow[],
  questTargets: CharacterQuestTargetRow[],
  invitationRequirements: CharacterInvitationRequirementRow[],
  enums: WikiEnums,
): Promise<CharacterSummary> {
  const targetsByQuest = groupBy(questTargets, "quest_id");
  const invitationRequirementSummaries = await buildInvitationRequirementSummaries(invitationRequirements, enums);
  return {
    id: character.id,
    portrait: character.portrait,
    name: characterName(character),
    initial: characterInitial(character),
    detailUrl: characterDetailUrl(character.id),
    rarityId: character.rarity_id,
    location: characterLocationText(character, enums),
    sect: character.sect_name || "无门派",
    position: enumLabel(enums, "DiWei", character.position_id, "地位"),
    rank: enumLabel(enums, "Dengji", character.rank_id, "资历"),
    rarity: enumLabel(enums, "NPC_Rare", character.rarity_id, "资质"),
    weaponType: enumLabel(enums, "BingQiType", character.weapon_type_id, "未知"),
    invitationRequirements: invitationRequirementSummaries,
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
