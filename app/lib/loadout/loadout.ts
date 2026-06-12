import type {
  LoadoutCountItem,
  LoadoutCustomMartialItem,
  LoadoutEquipmentStyleItem,
  LoadoutMartialArt,
  LoadoutState,
} from "./types";

export const MAX_SELECTION = 12;
export const JOINABLE_SECT_IDS = [0, 1, 2, 5, 6, 8, 9];

export function getTournamentPrizeSect(item: LoadoutCountItem & { sectRestricted?: boolean }) {
  return item.sectRestricted && JOINABLE_SECT_IDS.includes(Number(item.sectId)) ? Number(item.sectId) : "";
}

export function getJoinableSects() {
  return [...JOINABLE_SECT_IDS];
}

function martialSelectionKey(item: Pick<LoadoutMartialArt, "id">) {
  return item.id;
}

export function getSelectedMartialItems<T extends LoadoutMartialArt>(state: LoadoutState<T>) {
  return state.wuxue.filter((item) => state.selected.has(martialSelectionKey(item)));
}

export function getCustomMartial(state: LoadoutState): LoadoutCustomMartialItem | null {
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

export function getSelectedTournamentPrizeSect(state: LoadoutState) {
  return getSelectedMartialItems(state)
    .map(getTournamentPrizeSect)
    .find((sectId) => sectId !== "") ?? "";
}

export function getCustomMartialSect(state: LoadoutState) {
  return state.customMartial.enabled ? state.customMartial.sectId : "";
}

export function getLockedSect(state: LoadoutState) {
  const tournamentPrizeSect = getSelectedTournamentPrizeSect(state);
  return tournamentPrizeSect !== "" ? tournamentPrizeSect : getCustomMartialSect(state);
}

export function getCustomMartialConflictSect(state: LoadoutState) {
  const lockedByPrizeSect = getSelectedTournamentPrizeSect(state);
  const customSect = state.customMartial.sectId;
  return lockedByPrizeSect !== "" && customSect !== "" && Number(lockedByPrizeSect) !== Number(customSect)
    ? lockedByPrizeSect
    : "";
}

export function canEnableCustomMartial(state: LoadoutState, maxSelection: number) {
  if (state.customMartial.sectId === "" || state.customMartial.styleId === "") return false;
  if (getCustomMartialConflictSect(state) !== "") return false;
  if (!state.customMartial.enabled && getSelectedMartialItems(state).length >= maxSelection) return false;
  return true;
}

export function getMartialConflictSect(state: LoadoutState, item: LoadoutMartialArt) {
  const itemSect = getTournamentPrizeSect(item);
  if (itemSect === "") return "";
  const lockedSect = getLockedSect(state);
  return lockedSect !== "" && Number(lockedSect) !== Number(itemSect) ? lockedSect : "";
}

export function canSelectMartialItem(state: LoadoutState, item: LoadoutMartialArt) {
  return getMartialConflictSect(state, item) === "";
}

export function getMartialCountItems(state: LoadoutState): Array<LoadoutMartialArt | LoadoutCustomMartialItem> {
  const customMartial = getCustomMartial(state);
  return customMartial
    ? [...getSelectedMartialItems(state), customMartial]
    : getSelectedMartialItems(state);
}

export function getEquipmentStyleItems(state: LoadoutState): LoadoutEquipmentStyleItem[] {
  return Object.entries(state.equipmentStyles)
    .filter(([, style]) => Boolean(style))
    .map(([slot, style]) => ({
      slot,
      styleIds: [Number(style)],
      isEquipmentStyle: true,
    }));
}

export function getStyleCountItems(state: LoadoutState): LoadoutCountItem[] {
  return [...getMartialCountItems(state), ...getEquipmentStyleItems(state)];
}

export function getMartialSelectionCount(state: LoadoutState) {
  return getMartialCountItems(state).length;
}
