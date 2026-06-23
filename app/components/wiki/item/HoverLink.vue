<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import { CircleHelp } from "@lucide/vue";
import WikiHoverLink from "~/components/wiki/WikiHoverLink.vue";
import { rarityTextClass } from "~/lib/rarity";
import { useItemData } from "~/composables/useItemData";
import type { ItemRecipeSummary, ItemSummary } from "~/lib/wiki/item";

const ItemSummaryPanel = defineAsyncComponent(() => import("./SummaryPanel.vue"));

const props = withDefaults(defineProps<{
  id: number | string | null | undefined;
  mode?: "link" | "button";
  label?: string;
  rarityId?: number | string | null;
  triggerTabindex?: number | string;
}>(), {
  mode: "link",
  label: "",
  rarityId: null,
  triggerTabindex: undefined,
});

const open = ref(false);
const itemId = computed(() => {
  const value = Number(props.id);
  return Number.isFinite(value) ? value : null;
});
const detailUrl = computed(() => (
  itemId.value === null ? "/items/" : `/items/detail/?id=${itemId.value}`
));
const { loadItemDetail } = useItemData();
const summary = shallowRef<ItemSummary | null>(null);
const recipe = shallowRef<ItemRecipeSummary | null>(null);
const pending = ref(false);
const error = shallowRef<Error | null>(null);
const displayLabel = computed(() => (
  props.label
  || summary.value?.name
  || `道具 ${props.id ?? "-"}`
));
const rarityId = computed(() => (
  props.rarityId
  ?? summary.value?.rarityId
  ?? null
));
const linkClass = computed(() => [
  "font-semibold underline-offset-4 hover:underline",
  rarityTextClass(rarityId.value),
]);

async function load() {
  const value = itemId.value;
  if (value === null) return null;

  pending.value = true;
  error.value = null;
  try {
    const detail = await loadItemDetail(value);
    if (itemId.value === value) {
      summary.value = detail.summary;
      recipe.value = detail.recipe;
    }
    return detail.summary;
  } catch (caught) {
    if (itemId.value === value) {
      error.value = caught instanceof Error ? caught : new Error(String(caught));
    }
    return null;
  } finally {
    if (itemId.value === value) pending.value = false;
  }
}

watch(open, (value) => {
  if (value) void load();
});

watch(itemId, () => {
  summary.value = null;
  recipe.value = null;
  error.value = null;
});

onMounted(() => {
  if (props.mode === "link" && (!props.label || props.rarityId === null)) void load();
});
</script>

<template>
  <WikiHoverLink
    v-model:open="open"
    :mode="mode"
    :to="detailUrl"
    :label="displayLabel"
    :link-class="linkClass"
    button-label="查看道具摘要"
    :trigger-tabindex="triggerTabindex"
  >
    <template #trigger>
      <slot>
        <CircleHelp v-if="mode === 'button'" />
        <template v-else>{{ displayLabel }}</template>
      </slot>
    </template>
    <ItemSummaryPanel
      :summary="summary"
      :recipe="recipe"
      :pending="pending"
      :error="error"
    />
  </WikiHoverLink>
</template>
