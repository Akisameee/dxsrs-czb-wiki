<script setup lang="ts">
import {
  MAX_SELECTION,
} from "~/lib/loadout";
import type { ChainRecordView, CountRow, SelectableMartialArt } from "./types";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import LoadoutChainRow from "./LoadoutChainRow.vue";

const props = defineProps<{
  selectedItems: SelectableMartialArt[];
  selectedCount: number;
  lockedSectLabel: string;
  customMartialActive: boolean;
  sectCounts: CountRow[];
  styleCounts: CountRow[];
  chainRecords: ChainRecordView[];
}>();

const emit = defineEmits<{
  clearSelection: [];
  removeSelected: [item: SelectableMartialArt];
}>();

function chainRecord(type: "sect" | "style", id: number) {
  return props.chainRecords.find((record) => record.groupType === type && record.groupName === id) || null;
}

function sortedRows(type: "sect" | "style", rows: CountRow[]) {
  return [...rows].sort((left, right) => {
    const leftMet = Boolean(chainRecord(type, left.id)?.met);
    const rightMet = Boolean(chainRecord(type, right.id)?.met);
    if (leftMet !== rightMet) return leftMet ? -1 : 1;
    return left.id - right.id;
  });
}

const sortedSectCounts = computed(() => sortedRows("sect", props.sectCounts));
const sortedStyleCounts = computed(() => sortedRows("style", props.styleCounts));
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
        <div v-if="sortedSectCounts.length" class="grid gap-2">
          <LoadoutChainRow
            v-for="row in sortedSectCounts"
            :key="row.id"
            :row="row"
            :record="chainRecord('sect', row.id)"
          />
        </div>
        <p v-else class="text-sm text-muted-foreground">无</p>
      </div>

      <div class="grid gap-2">
        <div class="text-sm text-muted-foreground">风格</div>
        <div v-if="sortedStyleCounts.length" class="grid gap-2">
          <LoadoutChainRow
            v-for="row in sortedStyleCounts"
            :key="row.id"
            :row="row"
            :record="chainRecord('style', row.id)"
          />
        </div>
        <p v-else class="text-sm text-muted-foreground">无</p>
      </div>
    </CardContent>
  </Card>
</template>
