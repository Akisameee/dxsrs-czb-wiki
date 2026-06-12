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
import { useMartialArtData } from "~/composables/useMartialArtData";
import type { MartialArtSummary } from "~/lib/wiki/martial-art";

const MartialArtSummaryPanel = defineAsyncComponent(() => import("./SummaryPanel.vue"));

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
const martialArtId = computed(() => {
  const value = Number(props.id);
  return Number.isFinite(value) ? value : null;
});
const detailUrl = computed(() => (
  martialArtId.value === null ? "/martial-arts/" : `/martial-arts/detail/?id=${martialArtId.value}`
));
const { loadMartialArtSummary } = useMartialArtData();
const summary = shallowRef<MartialArtSummary | null>(null);
const pending = ref(false);
const error = shallowRef<Error | null>(null);
const displayLabel = computed(() => (
  props.label
  || summary.value?.name
  || `武学 ${props.id ?? "-"}`
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
  const value = martialArtId.value;
  if (value === null) return null;

  pending.value = true;
  error.value = null;
  try {
    const nextSummary = await loadMartialArtSummary(value);
    if (martialArtId.value === value) summary.value = nextSummary;
    return nextSummary;
  } catch (caught) {
    if (martialArtId.value === value) {
      error.value = caught instanceof Error ? caught : new Error(String(caught));
    }
    return null;
  } finally {
    if (martialArtId.value === value) pending.value = false;
  }
}

watch(open, (value) => {
  if (value) void load();
});

watch(martialArtId, () => {
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
        aria-label="查看武学摘要"
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
      <MartialArtSummaryPanel
        :summary="summary"
        :pending="pending"
        :error="error"
      />
    </HoverCardContent>
  </HoverCard>
</template>
