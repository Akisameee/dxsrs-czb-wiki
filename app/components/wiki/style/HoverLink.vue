<script setup lang="ts">
import { Badge } from "~/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card";
import StyleSummaryPanel, { type StyleChainSummary } from "./SummaryPanel.vue";
import { useChainSummaryData } from "~/composables/useChainSummaryData";

const props = defineProps<{
  id: number | string | null | undefined;
  label: string;
  mode?: "badge" | "link";
  summary?: StyleChainSummary | null;
}>();

const detailUrl = computed(() => props.id === null || props.id === undefined ? "/styles/" : `/styles/detail/?id=${props.id}`);
const open = ref(false);
const loadedSummary = shallowRef<StyleChainSummary | null>(null);
const { loadChainSummary } = useChainSummaryData();
const displaySummary = computed<StyleChainSummary>(() => props.summary || {
  label: props.label,
  typeLabel: "风格",
  ...loadedSummary.value,
});

async function load() {
  if (props.summary || props.id === null || props.id === undefined) return;
  loadedSummary.value = await loadChainSummary("style", props.id, props.label);
}

watch(open, (value) => {
  if (value) void load();
});
</script>

<template>
  <HoverCard v-model:open="open">
    <HoverCardTrigger as-child>
      <Badge
        v-if="mode !== 'link'"
        variant="outline"
        :data-detail-url="detailUrl"
      >
        {{ label }}
      </Badge>
      <span
        v-else
        class="font-medium underline-offset-4 hover:underline"
        :data-detail-url="detailUrl"
      >
        {{ label }}
      </span>
    </HoverCardTrigger>
    <HoverCardContent class="grid w-72 gap-3">
      <StyleSummaryPanel :summary="displaySummary" />
    </HoverCardContent>
  </HoverCard>
</template>
