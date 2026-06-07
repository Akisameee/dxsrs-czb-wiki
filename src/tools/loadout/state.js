export const state = {
  wuxue: [],
  enums: {},
  effects: [],
  sectChains: [],
  styleChains: [],
  selected: new Set(),
  equipmentStyles: {
    weapon1: "",
    weapon2: "",
    armor: "",
  },
  customMartial: {
    enabled: false,
    sectId: "",
    styleId: "",
  },
  filters: {
    sect: "all",
    style: "all",
  },
};

export const els = {
  status: document.getElementById("data-status"),
  selectedCount: document.getElementById("selected-count"),
  sectFilter: document.getElementById("sect-filter"),
  styleFilter: document.getElementById("style-filter"),
  clearButton: document.getElementById("clear-button"),
  selectedList: document.getElementById("selected-list"),
  equipmentStyleControls: document.getElementById("equipment-style-controls"),
  customEnabled: document.getElementById("custom-enabled"),
  customSect: document.getElementById("custom-sect"),
  customStyle: document.getElementById("custom-style"),
  martialList: document.getElementById("martial-list"),
  sectSummary: document.getElementById("sect-summary"),
  styleSummary: document.getElementById("style-summary"),
  chainList: document.getElementById("chain-list"),
};
