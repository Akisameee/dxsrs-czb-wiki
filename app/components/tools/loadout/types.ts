import type {
  CustomMartialState,
  EquipmentStyleKey,
  EquipmentStyles,
  LoadoutCountItem,
  LoadoutMartialArt,
  LoadoutOption,
  LoadoutVisibleChainRecord,
} from "~/lib/loadout/types";
import type { WikiTextPart } from "~/lib/wiki/text";
import type { LoadoutChainBlockState } from "~/lib/loadout/types";

export type {
  CustomMartialState,
  EquipmentStyleKey,
  EquipmentStyles,
  LoadoutCountItem,
  LoadoutOption,
  LoadoutVisibleChainRecord,
};

export type CountRow = {
  id: number;
  label: string;
  count: number;
};

export type ChainBlockView = {
  value: number;
  state: LoadoutChainBlockState;
  tooltip: string;
  effect: string;
  effectParts: WikiTextPart[];
};

export type ChainRecordView = {
  key: string;
  label: string;
  typeLabel: string;
  groupType: "sect" | "style";
  groupName: number;
  count: number;
  level: number;
  met: boolean;
  activeEffect: string;
  activeEffectParts: WikiTextPart[];
  icon?: string | null;
  descriptions?: string[];
  blocks: ChainBlockView[];
};

export type SelectableMartialArt = LoadoutMartialArt;
