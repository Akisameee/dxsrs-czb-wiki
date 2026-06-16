<script setup lang="ts">
import GameImage from "~/components/wiki/WikiImage.vue";
import WikiText from "~/components/wiki/WikiText.vue";
import type { ChainRecordView, CountRow } from "./types";

const props = defineProps<{
  row: CountRow;
  record: ChainRecordView | null;
}>();

const imageId = computed(() => props.record?.imageId || null);
const blocks = computed(() => props.record?.blocks || []);
const activeEffect = computed(() => props.record?.activeEffect || "");
const activeEffectParts = computed(() => props.record?.activeEffectParts || []);

function blockClass(state: string) {
  const classes = {
    "active-node": "bg-primary ring-1 ring-offset-1 ring-offset-background ring-primary",
    "reached-node": "bg-primary/60 ring-1 ring-offset-1 ring-offset-background ring-primary/60",
    "empty-node": "bg-muted/60 ring-1 ring-offset-1 ring-offset-background ring-primary/20",
    progress: "bg-muted-foreground/35",
    empty: "bg-muted/60",
  };
  return classes[state as keyof typeof classes] ?? classes.empty;
}
</script>

<template>
  <div class="grid gap-2 rounded-md border px-3 py-2 text-sm">
    <div class="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
      <GameImage
        :id="imageId"
        :alt="row.label"
        :fallback="row.label.slice(0, 1)"
        :size="24"
      />
      <div class="min-w-0 truncate font-medium">{{ row.label }}</div>
      <div class="flex items-center gap-3">
        <span class="tabular-nums text-muted-foreground">x{{ row.count }}</span>
        <div v-if="blocks.length" class="flex flex-wrap justify-end gap-1.5">
          <template
            v-for="block in blocks"
            :key="block.value"
          >
            <AppTooltip
              v-if="block.effect"
              content-class="border bg-background text-foreground shadow-md"
            >
              <template #trigger>
                <span
                  class="size-4 rounded-sm"
                  :class="blockClass(block.state)"
                />
              </template>
              <WikiText
                v-if="block.effectParts.length"
                :parts="[{ type: 'text', text: `${block.value}: ` }, ...block.effectParts]"
              />
              <template v-else>{{ block.tooltip }}</template>
            </AppTooltip>
            <span
              v-else
              class="size-4 rounded-sm"
              :class="blockClass(block.state)"
            />
          </template>
        </div>
      </div>
    </div>
    <div v-if="activeEffect" class="pl-9 text-xs text-muted-foreground">
      <WikiText :parts="activeEffectParts" />
    </div>
  </div>
</template>
