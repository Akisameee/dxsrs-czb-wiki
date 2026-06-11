import type { LoadoutMartialArt } from "~/composables/useLoadoutData";

export type LoadoutOption = {
  id: string;
  label: string;
};

export type CustomMartialState = {
  enabled: boolean;
  sectId: string;
  styleId: string;
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
