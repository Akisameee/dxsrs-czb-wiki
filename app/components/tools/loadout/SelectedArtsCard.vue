<script setup lang="ts">
import {
  MAX_SELECTION,
} from "~/lib/loadout";
import type { CountRow, SelectableMartialArt } from "./types";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

defineProps<{
  selectedItems: SelectableMartialArt[];
  selectedCount: number;
  lockedSectLabel: string;
  customMartialActive: boolean;
  sectCounts: CountRow[];
  styleCounts: CountRow[];
}>();

const emit = defineEmits<{
  clearSelection: [];
  removeSelected: [item: SelectableMartialArt];
}>();
</script>

<template>
  <Card>
    <CardHeader class="flex flex-row items-start justify-between gap-4">
      <div>
        <CardTitle>已选择功法</CardTitle>
        <CardDescription>
          {{ selectedCount }} / {{ MAX_SELECTION }}
          <span v-if="lockedSectLabel">，锁定 {{ lockedSectLabel }}</span>
        </CardDescription>
      </div>
      <Button variant="outline" size="sm" @click="emit('clearSelection')">清空</Button>
    </CardHeader>
    <CardContent class="grid gap-4">
      <div>
        <div v-if="selectedItems.length || customMartialActive" class="flex flex-wrap gap-2">
          <Badge
            v-for="item in selectedItems"
            :key="item.id"
            variant="secondary"
            class="gap-2"
          >
            {{ item.name }}
            <button class="text-muted-foreground hover:text-foreground" type="button" @click="emit('removeSelected', item)">
              ×
            </button>
          </Badge>
          <Badge v-if="customMartialActive" variant="outline">
            自创外功
          </Badge>
        </div>
        <p v-else class="text-sm text-muted-foreground">未选择</p>
      </div>

      <div class="grid gap-2">
        <div class="text-sm text-muted-foreground">门派</div>
        <div v-if="sectCounts.length" class="flex flex-wrap gap-2">
          <Badge v-for="row in sectCounts" :key="row.id" variant="outline">
            {{ row.label }} {{ row.count }}
          </Badge>
        </div>
        <p v-else class="text-sm text-muted-foreground">无</p>
      </div>

      <div class="grid gap-2">
        <div class="text-sm text-muted-foreground">风格</div>
        <div v-if="styleCounts.length" class="flex flex-wrap gap-2">
          <Badge v-for="row in styleCounts" :key="row.id" variant="outline">
            {{ row.label }} {{ row.count }}
          </Badge>
        </div>
        <p v-else class="text-sm text-muted-foreground">无</p>
      </div>
    </CardContent>
  </Card>
</template>
