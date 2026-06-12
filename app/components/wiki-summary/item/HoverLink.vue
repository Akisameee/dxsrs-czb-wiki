<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import { CircleHelp } from "@lucide/vue";
import { Button } from "~/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card";
import { rarityTextClass } from "~/lib/rarity";
import { useItemData } from "~/composables/useItemData";
import type { ItemSummary } from "~/lib/wiki/item";

const ItemSummaryPanel = defineAsyncComponent(() => import("./SummaryPanel.vue"));

const props = withDefaults(defineProps<{
  id: number | string | null | undefined;
  mode?: "link" | "button";
  label?: string;
  rarityId?: number | string | null;
}>(), {
  mode: "link",
  label: "",
  rarityId: null,
});

const open = ref(false);
const itemId = computed(() => {
  const value = Number(props.id);
  return Number.isFinite(value) ? value : null;
});
const detailUrl = computed(() => (
  itemId.value === null ? "/items/" : `/items/detail/?id=${itemId.value}`
));
const { loadItemSummary } = useItemData();
const summary = shallowRef<ItemSummary | null>(null);
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
  "font-medium underline-offset-4 hover:underline",
  rarityTextClass(rarityId.value),
]);

async function load() {
  const value = itemId.value;
  if (value === null) return null;

  pending.value = true;
  error.value = null;
  try {
    const nextSummary = await loadItemSummary(value);
    if (itemId.value === value) summary.value = nextSummary;
    return nextSummary;
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
  error.value = null;
});

onMounted(() => {
  if (props.mode === "link" && (!props.label || props.rarityId === null)) void load();
});
</script>

<template>
  <HoverCard v-model:open="open">
    <HoverCardTrigger as-child>
      <Button
        v-if="mode === 'button'"
        variant="ghost"
        size="icon-sm"
        aria-label="查看道具摘要"
        @click.stop
        @keydown.stop
      >
        <slot>
          <CircleHelp />
        </slot>
      </Button>
      <NuxtLink
        v-else
        :to="detailUrl"
        :class="linkClass"
      >
        <slot>{{ displayLabel }}</slot>
      </NuxtLink>
    </HoverCardTrigger>
    <HoverCardContent class="grid w-96 max-w-[calc(100vw-2rem)] gap-3">
      <ItemSummaryPanel
        :summary="summary"
        :pending="pending"
        :error="error"
      />
    </HoverCardContent>
  </HoverCard>
</template>
