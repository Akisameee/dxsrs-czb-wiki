<script setup lang="ts">
import { CircleHelp } from "@lucide/vue";
import CharacterSummaryPanel from "./SummaryPanel.vue";
import { Button } from "~/components/ui/button";
import { useCharacterSummary } from "~/composables/useCharacterSummary";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card";
import { rarityTextClass } from "~/lib/rarity";
import { characterDetailUrl } from "~/lib/wiki/character";

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
const characterId = computed(() => {
  const value = Number(props.id);
  return Number.isFinite(value) ? value : null;
});
const detailUrl = computed(() => (
  characterId.value === null ? "/characters/" : characterDetailUrl(characterId.value)
));
const { summary, pending, error, load } = useCharacterSummary(characterId);
const displayLabel = computed(() => props.label || summary.value?.name || `人物 ${props.id ?? "-"}`);
const linkClass = computed(() => [
  "font-medium underline-offset-4 hover:underline",
  rarityTextClass(props.rarityId ?? summary.value?.rarityId),
]);

watch(open, (value) => {
  if (value) void load();
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
        aria-label="查看人物摘要"
        @click.stop
        @keydown.enter.stop
        @keydown.space.stop
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
      <CharacterSummaryPanel
        :summary="summary"
        :pending="pending"
        :error="error"
      />
    </HoverCardContent>
  </HoverCard>
</template>
