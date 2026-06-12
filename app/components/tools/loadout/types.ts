import type {
  CustomMartialState,
  EquipmentStyleKey,
  EquipmentStyles,
  LoadoutCountItem,
  LoadoutMartialArt,
  LoadoutOption,
  LoadoutVisibleChainRecord,
} from "~/lib/loadout/types";

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
  class: string;
  tooltip: string;
};

export type ChainRecordView = {
  key: string;
  label: string;
  typeLabel: string;
  count: number;
  level: number;
  met: boolean;
  activeEffect: string;
  blocks: ChainBlockView[];
};

export type SelectableMartialArt = LoadoutMartialArt;
