import type { WikiTextPart } from "~/lib/wiki/text";

export type LoadoutOption = {
  id: string;
  label: string;
};

export type LoadoutPassiveChainRecord = {
  count: number;
  effect: string;
  effectParts: WikiTextPart[];
  imageId?: string | null;
};

export type LoadoutMartialArt = {
  id: number;
  name: string;
  initial: string;
  sectId: number | null;
  sect: string;
  styleIds: number[];
  styles: string[];
  typeId: number | null;
  type: string;
  rare: number | null;
  rarityToneId: number | null;
  power: number | null;
  cost: number | null;
  obtainMethod: string | null;
  sectRestricted: boolean;
};

export type LoadoutChainGroup = {
  sectId?: number;
  styleId?: number;
  chains: LoadoutPassiveChainRecord[];
};

export type LoadoutData = {
  wuxue: LoadoutMartialArt[];
  sectChains: LoadoutChainGroup[];
  styleChains: LoadoutChainGroup[];
  enums: Record<string, Record<string, string | null>>;
  sectNames: Record<string, string | null>;
};

export type CustomMartialState = {
  enabled: boolean;
  sectId: string;
  styleId: string;
};

export type EquipmentStyleKey = "weapon1" | "weapon2" | "armor";

export type EquipmentStyles = Record<EquipmentStyleKey, string>;

export type LoadoutState<T extends LoadoutMartialArt = LoadoutMartialArt> = {
  wuxue: T[];
  selected: Set<number>;
  equipmentStyles: Record<string, string>;
  customMartial: CustomMartialState;
};

export type LoadoutCustomMartialItem = {
  name: string;
  typeId: number;
  sectId: number;
  styleIds: number[];
  isCustom: true;
};

export type LoadoutEquipmentStyleItem = {
  slot: string;
  styleIds: number[];
  isEquipmentStyle: true;
};

export type LoadoutCountItem = {
  sectId?: number | string | null;
  styleIds?: number[];
};

export type PenglaiModifier = {
  active: boolean;
  minimum: number;
  decrease: number;
};

export type LoadoutChainGroupType = "sect" | "style";

export type LoadoutChainRequirement = {
  original: number;
  effective: number;
  affected: boolean;
};

export type LoadoutRequirementNode = {
  chain: LoadoutPassiveChainRecord;
  requirement: LoadoutChainRequirement;
};

export type LoadoutChainBlockState =
  | "active-node"
  | "reached-node"
  | "progress"
  | "empty-node"
  | "empty";

export type LoadoutChainStateBlock = {
  value: number;
  node: LoadoutRequirementNode | null;
  state: LoadoutChainBlockState;
  effect: string | null;
  effectParts: WikiTextPart[];
};

export type LoadoutChainRecordInput = LoadoutChainGroup & {
  groupName: number | undefined;
  groupType: LoadoutChainGroupType;
  count: number;
};

export type LoadoutVisibleChainRecord = LoadoutChainRecordInput & {
  level: number;
  met: boolean;
  activeChain: LoadoutRequirementNode | null;
  activeEffect: string;
  activeEffectParts: WikiTextPart[];
  displayCount: number;
  blocks: LoadoutChainStateBlock[];
};
