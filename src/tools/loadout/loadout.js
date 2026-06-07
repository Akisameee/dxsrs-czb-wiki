import { JOINABLE_SECT_IDS } from "../../shared/constants.js";

export function getTournamentPrizeSect(item) {
  return item?.sectRestricted && JOINABLE_SECT_IDS.includes(Number(item.sectId)) ? Number(item.sectId) : "";
}

export function getJoinableSects() {
  return [...JOINABLE_SECT_IDS];
}

export function getSelectedMartialItems(state) {
  return state.wuxue.filter((item) => state.selected.has(item.name));
}

export function getCustomMartial(state) {
  const { enabled, sectId, styleId } = state.customMartial;
  if (!enabled || sectId === "" || styleId === "") return null;
  return {
    name: "自创武功",
    typeId: 0,
    sectId: Number(sectId),
    styleIds: [Number(styleId)],
    isCustom: true,
  };
}

export function getSelectedTournamentPrizeSect(state) {
  return getSelectedMartialItems(state)
    .map(getTournamentPrizeSect)
    .find((sectId) => sectId !== "") ?? "";
}

export function getCustomMartialSect(state) {
  return state.customMartial.enabled ? state.customMartial.sectId : "";
}

export function getLockedSect(state) {
  const tournamentPrizeSect = getSelectedTournamentPrizeSect(state);
  return tournamentPrizeSect !== "" ? tournamentPrizeSect : getCustomMartialSect(state);
}

export function getCustomMartialConflictSect(state) {
  const lockedByPrizeSect = getSelectedTournamentPrizeSect(state);
  const customSect = state.customMartial.sectId;
  return lockedByPrizeSect !== "" && customSect !== "" && Number(lockedByPrizeSect) !== Number(customSect) ? lockedByPrizeSect : "";
}

export function canEnableCustomMartial(state, maxSelection) {
  if (state.customMartial.sectId === "" || state.customMartial.styleId === "") return false;
  if (getCustomMartialConflictSect(state) !== "") return false;
  if (!state.customMartial.enabled && getSelectedMartialItems(state).length >= maxSelection) return false;
  return true;
}

export function getMartialConflictSect(state, item) {
  const itemSect = getTournamentPrizeSect(item);
  if (itemSect === "") return "";
  const lockedSect = getLockedSect(state);
  return lockedSect !== "" && Number(lockedSect) !== Number(itemSect) ? lockedSect : "";
}

export function canSelectMartialItem(state, item) {
  return getMartialConflictSect(state, item) === "";
}

export function getMartialCountItems(state) {
  const customMartial = getCustomMartial(state);
  return customMartial
    ? [...getSelectedMartialItems(state), customMartial]
    : getSelectedMartialItems(state);
}

export function getEquipmentStyleItems(state) {
  return Object.entries(state.equipmentStyles)
    .filter(([, style]) => Boolean(style))
    .map(([slot, style]) => ({
      slot,
      styleIds: [Number(style)],
      isEquipmentStyle: true,
    }));
}

export function getStyleCountItems(state) {
  return [...getMartialCountItems(state), ...getEquipmentStyleItems(state)];
}

export function getMartialSelectionCount(state) {
  return getMartialCountItems(state).length;
}
