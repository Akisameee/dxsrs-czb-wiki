<script setup lang="ts">
import GameImage from "~/components/wiki/GameImage.vue";
import WikiText from "~/components/wiki/WikiText.vue";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import type { ChainRecordView, CountRow } from "./types";

const props = defineProps<{
  row: CountRow;
  record: ChainRecordView | null;
}>();

const iconName = computed(() => props.record?.icon || null);
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
        :name="iconName"
        :alt="row.label"
        :fallback="row.label.slice(0, 1)"
        :size="24"
      />
      <div class="min-w-0 truncate font-medium">{{ row.label }}</div>
      <div class="flex items-center gap-3">
        <span class="tabular-nums text-muted-foreground">x{{ row.count }}</span>
        <TooltipProvider>
          <div v-if="blocks.length" class="flex flex-wrap justify-end gap-1.5">
            <template
              v-for="block in blocks"
              :key="block.value"
            >
              <Tooltip v-if="block.effect">
                <TooltipTrigger as-child>
                  <span
                    class="size-4 rounded-sm"
                    :class="blockClass(block.state)"
                  />
                </TooltipTrigger>
                <TooltipContent class="border bg-background text-foreground shadow-md">
                  <WikiText
                    v-if="block.effectParts.length"
                    :parts="[{ type: 'text', text: `${block.value}: ` }, ...block.effectParts]"
                  />
                  <template v-else>{{ block.tooltip }}</template>
                </TooltipContent>
              </Tooltip>
              <span
                v-else
                class="size-4 rounded-sm"
                :class="blockClass(block.state)"
              />
            </template>
          </div>
        </TooltipProvider>
      </div>
    </div>
    <div v-if="activeEffect" class="pl-9 text-xs text-muted-foreground">
      <WikiText :parts="activeEffectParts" />
    </div>
  </div>
</template>
