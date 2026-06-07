import { JOINABLE_SECTS } from "../../shared/constants.js?v=20260607-01";

export function getTournamentPrizeSect(item) {
  return item?.sectRestricted && JOINABLE_SECTS.includes(item.sect) ? item.sect : "";
}

export function getJoinableSects() {
  return [...JOINABLE_SECTS];
}

export function getSelectedMartialItems(state) {
  return state.wuxue.filter((item) => state.selected.has(item.name));
}

export function getCustomMartial(state) {
  const { enabled, sect, style } = state.customMartial;
  if (!enabled || !sect || !style) return null;
  return {
    name: "自创武功",
    type: "外功",
    sect,
    styles: [style],
    isCustom: true,
  };
}

export function getSelectedTournamentPrizeSect(state) {
  return getSelectedMartialItems(state)
    .map(getTournamentPrizeSect)
    .find(Boolean) || "";
}

export function getCustomMartialSect(state) {
  return state.customMartial.enabled ? state.customMartial.sect : "";
}

export function getLockedSect(state) {
  return getSelectedTournamentPrizeSect(state) || getCustomMartialSect(state);
}

export function getCustomMartialConflictSect(state) {
  const lockedByPrizeSect = getSelectedTournamentPrizeSect(state);
  const customSect = state.customMartial.sect;
  return lockedByPrizeSect && customSect && lockedByPrizeSect !== customSect ? lockedByPrizeSect : "";
}

export function canEnableCustomMartial(state, maxSelection) {
  if (!state.customMartial.sect || !state.customMartial.style) return false;
  if (getCustomMartialConflictSect(state)) return false;
  if (!state.customMartial.enabled && getSelectedMartialItems(state).length >= maxSelection) return false;
  return true;
}

export function getMartialConflictSect(state, item) {
  const itemSect = getTournamentPrizeSect(item);
  if (!itemSect) return "";
  const lockedSect = getLockedSect(state);
  return lockedSect && lockedSect !== itemSect ? lockedSect : "";
}

export function canSelectMartialItem(state, item) {
  return !getMartialConflictSect(state, item);
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
      styles: [style],
      isEquipmentStyle: true,
    }));
}

export function getStyleCountItems(state) {
  return [...getMartialCountItems(state), ...getEquipmentStyleItems(state)];
}

export function getMartialSelectionCount(state) {
  return getMartialCountItems(state).length;
}
