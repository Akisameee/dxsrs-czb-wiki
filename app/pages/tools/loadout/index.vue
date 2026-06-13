<script setup lang="ts">
import {
  MAX_SELECTION,
  canEnableCustomMartial,
  canSelectMartialItem,
  getCustomMartial,
  getCustomMartialConflictSect,
  getJoinableSects,
  getLockedSect,
  getMartialConflictSect,
  getMartialCountItems,
  getMartialSelectionCount,
  getPenglaiModifier,
  getSelectedMartialItems,
  getStyleCountItems,
  buildVisibleChainRecords,
  isBasicChainUnlocked,
} from "~/lib/loadout";
import CustomMartialCard from "~/components/tools/loadout/CustomMartialCard.vue";
import FilterCard from "~/components/tools/loadout/FilterCard.vue";
import InscriptionCard from "~/components/tools/loadout/InscriptionCard.vue";
import MartialArtGrid from "~/components/tools/loadout/MartialArtGrid.vue";
import SelectedArtsCard from "~/components/tools/loadout/SelectedArtsCard.vue";
import { loadoutEnumLabel, useLoadoutData } from "~/composables/useLoadoutData";
import type {
  ChainRecordView,
  CustomMartialState,
  EquipmentStyleKey,
  EquipmentStyles,
  LoadoutCountItem,
  LoadoutVisibleChainRecord,
} from "~/components/tools/loadout/types";
import type { LoadoutMartialArt } from "~/lib/loadout/types";

useHead({ title: "配装工具" });

const EMPTY_OPTION = "none";
const EQUIPMENT_STYLE_OPTION_IDS = [1, 2, 3, 4, 6, 10, 11];

const { data, pending, error } = useLoadoutData();

const sectFilter = ref("all");
const styleFilter = ref("all");
const selected = ref(new Set<number>());
const equipmentStyles = reactive<EquipmentStyles>({
  weapon1: EMPTY_OPTION,
  weapon2: EMPTY_OPTION,
  armor: EMPTY_OPTION,
});
const customMartial = reactive<CustomMartialState>({
  enabled: false,
  sectId: EMPTY_OPTION,
  styleId: EMPTY_OPTION,
});

const wuxue = computed(() => data.value?.wuxue || []);
const enums = computed(() => data.value?.enums || {});
const sectChains = computed(() => data.value?.sectChains || []);
const styleChains = computed(() => data.value?.styleChains || []);
const errorMessage = computed(() => error.value?.message || "");

const loadoutState = computed(() => ({
  wuxue: wuxue.value,
  selected: selected.value,
  equipmentStyles: Object.fromEntries(
    Object.entries(equipmentStyles).map(([key, value]) => [key, value === EMPTY_OPTION ? "" : value]),
  ),
  customMartial: {
    enabled: customMartial.enabled,
    sectId: customMartial.sectId === EMPTY_OPTION ? "" : customMartial.sectId,
    styleId: customMartial.styleId === EMPTY_OPTION ? "" : customMartial.styleId,
  },
}));

type CountValue = number | string | null | undefined;

function countBy<T>(items: T[], getter: (item: T) => CountValue | CountValue[]) {
  const counts = new Map<number, number>();
  for (const item of items) {
    const values = getter(item);
    for (const value of Array.isArray(values) ? values : [values]) {
      const key = Number(value);
      if (!Number.isFinite(key)) continue;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }
  return counts;
}

function enumName(type: string, id: number | string | null | undefined, fallback = "未知") {
  return loadoutEnumLabel(enums.value, type, id, fallback);
}

function selectionKey(item: LoadoutMartialArt) {
  return item.id;
}

function isSelected(item: LoadoutMartialArt) {
  return selected.value.has(selectionKey(item));
}

const selectedCount = computed(() => getMartialSelectionCount(loadoutState.value));
const selectedItems = computed(() => getSelectedMartialItems(loadoutState.value));
const customMartialItem = computed(() => getCustomMartial(loadoutState.value));
const customMartialActive = computed(() => Boolean(customMartialItem.value));
const martialCountItems = computed<LoadoutCountItem[]>(() => getMartialCountItems(loadoutState.value));
const styleCountItems = computed(() => getStyleCountItems(loadoutState.value));
const sectCounts = computed(() => countBy(martialCountItems.value, (item) => item.sectId));
const styleCounts = computed(() => countBy(styleCountItems.value, (item) => item.styleIds || []));
const penglaiModifier = computed(() => getPenglaiModifier(sectCounts.value));
const basicUnlocked = computed(() => isBasicChainUnlocked(styleChains.value, styleCounts.value, penglaiModifier.value));
const visibleChainRecords = computed<LoadoutVisibleChainRecord[]>(() => buildVisibleChainRecords(
  sectChains.value,
  styleChains.value,
  sectCounts.value,
  styleCounts.value,
  penglaiModifier.value,
  basicUnlocked.value,
));
const lockedSect = computed(() => getLockedSect(loadoutState.value));
const lockedSectLabel = computed(() => lockedSect.value === "" ? "" : enumName("LianSuo_MP", lockedSect.value));
const customConflictSect = computed(() => getCustomMartialConflictSect(loadoutState.value));
const customConflictSectLabel = computed(() => (
  customConflictSect.value === "" ? "" : enumName("LianSuo_MP", customConflictSect.value)
));
const customCanBeEnabled = computed(() => canEnableCustomMartial(loadoutState.value, MAX_SELECTION));

const filteredRows = computed(() => {
  return wuxue.value.filter((item) => {
    if (sectFilter.value !== "all" && String(item.sectId) !== sectFilter.value) return false;
    if (styleFilter.value !== "all" && !item.styleIds.map(String).includes(styleFilter.value)) return false;
    return true;
  });
});

const sectOptions = computed(() => [...new Set(wuxue.value.map((item) => item.sectId).filter((id) => id !== null))]
  .sort((a, b) => Number(a) - Number(b))
  .map((id) => ({ id: String(id), label: enumName("LianSuo_MP", id, "无门派") })));

const styleOptions = computed(() => [...new Set(wuxue.value.flatMap((item) => item.styleIds))]
  .sort((a, b) => a - b)
  .map((id) => ({ id: String(id), label: enumName("LianSuo_FG", id, `风格 ${id}`) })));

const joinableSectOptions = computed(() => getJoinableSects()
  .map((id) => ({ id: String(id), label: enumName("LianSuo_MP", id, `门派 ${id}`) })));

const customStyleOptions = computed(() => styleChains.value
  .map((record) => Number(record.styleId))
  .filter(Number.isFinite)
  .sort((a, b) => a - b)
  .map((id) => ({ id: String(id), label: enumName("LianSuo_FG", id, `风格 ${id}`) })));

const equipmentStyleOptions = computed(() => EQUIPMENT_STYLE_OPTION_IDS.map((id) => ({
  id: String(id),
  label: enumName("LianSuo_FG", id, `风格 ${id}`),
})));

const sectCountRows = computed(() => [...sectCounts.value.entries()].map(([id, count]) => ({
  id,
  label: enumName("LianSuo_MP", id),
  count,
})));

const styleCountRows = computed(() => [...styleCounts.value.entries()].map(([id, count]) => ({
  id,
  label: enumName("LianSuo_FG", id),
  count,
})));

const chainRecordViews = computed<ChainRecordView[]>(() => visibleChainRecords.value.map((record) => ({
  key: `${record.groupType}-${record.groupName}`,
  label: record.groupType === "sect"
    ? enumName("LianSuo_MP", record.groupName, `门派 ${record.groupName}`)
    : enumName("LianSuo_FG", record.groupName, `风格 ${record.groupName}`),
  typeLabel: record.groupType === "sect" ? "门派" : "风格",
  groupType: record.groupType,
  groupName: Number(record.groupName),
  count: record.count,
  level: record.level,
  met: record.met,
  activeEffect: record.activeEffect,
  activeEffectParts: record.activeEffectParts,
  icon: record.activeChain?.chain.icon || record.chains[0]?.icon || null,
  descriptions: record.chains.map((chain) => chain.effect).filter(Boolean),
  blocks: record.blocks.map((block) => ({
    value: block.value,
    state: block.state,
    effect: block.effect || "",
    effectParts: block.effectParts,
    tooltip: block.effect ? `${block.value}: ${block.effect}` : String(block.value),
  })),
})));

function canSelect(item: LoadoutMartialArt) {
  if (isSelected(item)) return true;
  if (selectedCount.value >= MAX_SELECTION) return false;
  return canSelectMartialItem(loadoutState.value, item);
}

function disabledReason(item: LoadoutMartialArt) {
  if (canSelect(item)) return "";
  const conflictSect = getMartialConflictSect(loadoutState.value, item);
  if (conflictSect !== "") return `当前已加入${enumName("LianSuo_MP", conflictSect)}，不能选择其它门派限定武学`;
  return `最多选择 ${MAX_SELECTION} 个武学`;
}

function toggleMartialArt(item: LoadoutMartialArt, checked = !isSelected(item)) {
  if (!checked) {
    const next = new Set(selected.value);
    next.delete(selectionKey(item));
    selected.value = next;
    return;
  }

  if (!canSelect(item)) return;
  const next = new Set(selected.value);
  next.add(selectionKey(item));
  selected.value = next;
}

function clearSelection() {
  selected.value = new Set();
  customMartial.enabled = false;
}

function removeSelected(item: LoadoutMartialArt) {
  toggleMartialArt(item, false);
}

function updateEquipmentStyle(key: EquipmentStyleKey, value: string) {
  equipmentStyles[key] = value;
}

function updateCustomMartial(patch: Partial<CustomMartialState>) {
  Object.assign(customMartial, patch);
}

watch(customCanBeEnabled, (value) => {
  if (!value) customMartial.enabled = false;
});
</script>

<template>
  <main class="container mx-auto grid gap-6 p-6">
    <FilterCard
      :pending="pending"
      :total="wuxue.length"
      :filtered="filteredRows.length"
      :sect-filter="sectFilter"
      :style-filter="styleFilter"
      :sect-options="sectOptions"
      :style-options="styleOptions"
      @update:sect-filter="sectFilter = $event"
      @update:style-filter="styleFilter = $event"
    />

    <div class="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section class="grid min-w-0 content-start gap-6">
        <div class="grid gap-6 lg:grid-cols-2">
          <InscriptionCard
            :equipment-styles="equipmentStyles"
            :equipment-style-options="equipmentStyleOptions"
            :empty-option="EMPTY_OPTION"
            @update-equipment-style="updateEquipmentStyle"
          />

          <CustomMartialCard
            :empty-option="EMPTY_OPTION"
            :custom-martial="customMartial"
            :custom-can-be-enabled="customCanBeEnabled"
            :custom-conflict-sect-label="customConflictSectLabel"
            :joinable-sect-options="joinableSectOptions"
            :custom-style-options="customStyleOptions"
            @update-custom-martial="updateCustomMartial"
          />
        </div>

        <MartialArtGrid
          :error-message="errorMessage"
          :rows="filteredRows"
          :is-selected="isSelected"
          :can-select="canSelect"
          :disabled-reason="disabledReason"
          @toggle-martial-art="toggleMartialArt"
        />
      </section>

      <aside class="grid min-w-0 content-start gap-6">
        <SelectedArtsCard
          :selected-items="selectedItems"
          :selected-count="selectedCount"
          :locked-sect-label="lockedSectLabel"
          :custom-martial-active="customMartialActive"
          :sect-counts="sectCountRows"
          :style-counts="styleCountRows"
          :chain-records="chainRecordViews"
          @clear-selection="clearSelection"
          @remove-selected="removeSelected"
        />
      </aside>
    </div>
  </main>
</template>
