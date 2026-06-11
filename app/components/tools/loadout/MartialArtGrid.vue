<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import { rarityCardClass } from "~/lib/rarity";
import type { SelectableMartialArt } from "./types";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

const MartialArtHoverLink = defineAsyncComponent(() => import("~/components/wiki-summary/martial-art/HoverLink.vue"));

const props = defineProps<{
  errorMessage: string;
  rows: SelectableMartialArt[];
  isSelected: (item: SelectableMartialArt) => boolean;
  canSelect: (item: SelectableMartialArt) => boolean;
  disabledReason: (item: SelectableMartialArt) => string;
}>();

const emit = defineEmits<{
  toggleMartialArt: [item: SelectableMartialArt, checked?: boolean];
}>();

function cardClass(item: SelectableMartialArt) {
  const classes = [
    "cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md",
    "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
    rarityCardClass(item.rarityToneId),
  ];
  if (props.isSelected(item)) classes.push("ring-2 ring-primary");
  if (!props.canSelect(item)) classes.push("opacity-50");
  return classes.join(" ");
}
</script>

<template>
  <Card v-if="errorMessage">
    <CardContent class="py-6 text-destructive">{{ errorMessage }}</CardContent>
  </Card>

  <Card v-else-if="rows.length === 0">
    <CardContent class="py-12 text-center text-muted-foreground">
      没有匹配的武学
    </CardContent>
  </Card>

  <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <Card
      v-for="item in rows"
      :key="item.id"
      :class="cardClass(item)"
      role="button"
      tabindex="0"
      :aria-disabled="!canSelect(item)"
      :title="disabledReason(item) || item.name"
      @click="emit('toggleMartialArt', item)"
      @keydown.enter="emit('toggleMartialArt', item)"
      @keydown.space.prevent="emit('toggleMartialArt', item)"
    >
      <CardHeader>
        <div class="flex items-start gap-3">
          <div class="flex size-10 shrink-0 items-center justify-center rounded-full border text-sm font-medium text-muted-foreground">
            {{ item.initial }}
          </div>

          <div class="min-w-0 flex-1">
            <CardTitle class="truncate text-base">{{ item.name }}</CardTitle>
            <CardDescription class="truncate">
              {{ item.type }}
            </CardDescription>
            <div class="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline">{{ item.sect }}</Badge>
              <Badge
                v-for="style in item.styles"
                :key="style"
                variant="secondary"
              >
                {{ style }}
              </Badge>
            </div>
          </div>

          <div class="flex shrink-0 items-center gap-1">
            <MartialArtHoverLink :id="item.id" mode="button" />
          </div>
        </div>
      </CardHeader>
    </Card>
  </div>
</template>
