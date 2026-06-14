<script setup lang="ts">
import { CircleHelp } from "@lucide/vue";
import CharacterSummaryPanel from "./SummaryPanel.vue";
import { useCharacterData } from "~/composables/useCharacterData";
import WikiHoverLink from "~/components/wiki/WikiHoverLink.vue";
import { rarityTextClass } from "~/lib/rarity";
import { characterDetailUrl, type CharacterSummary } from "~/lib/wiki/character";

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
const { loadCharacterSummary } = useCharacterData();
const summary = shallowRef<CharacterSummary | null>(null);
const pending = ref(false);
const error = shallowRef<Error | null>(null);
const displayLabel = computed(() => props.label || summary.value?.name || `人物 ${props.id ?? "-"}`);
const linkClass = computed(() => [
  "font-medium underline-offset-4 hover:underline",
  rarityTextClass(props.rarityId ?? summary.value?.rarityId),
]);

async function load() {
  const value = characterId.value;
  if (value === null) return null;

  pending.value = true;
  error.value = null;
  try {
    const nextSummary = await loadCharacterSummary(value);
    if (characterId.value === value) summary.value = nextSummary;
    return nextSummary;
  } catch (caught) {
    if (characterId.value === value) {
      error.value = caught instanceof Error ? caught : new Error(String(caught));
    }
    return null;
  } finally {
    if (characterId.value === value) pending.value = false;
  }
}

watch(open, (value) => {
  if (value) void load();
});

watch(characterId, () => {
  summary.value = null;
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
    button-label="查看人物摘要"
  >
    <template #trigger>
      <slot>
        <CircleHelp v-if="mode === 'button'" />
        <template v-else>{{ displayLabel }}</template>
      </slot>
    </template>
    <CharacterSummaryPanel
      :summary="summary"
      :pending="pending"
      :error="error"
    />
  </WikiHoverLink>
</template>
