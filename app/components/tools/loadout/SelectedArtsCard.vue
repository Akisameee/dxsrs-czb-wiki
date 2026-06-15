<script setup lang="ts">
import { ChevronUp } from "@lucide/vue";
import {
  MAX_SELECTION,
} from "~/lib/loadout";
import type { ChainRecordView, CountRow, SelectableMartialArt } from "./types";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { cn } from "~/lib/utils";
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
const mobileOpen = ref(false);
</script>

<template>
  <div>
    <AppButton
      type="button"
      variant="outline"
      size="icon-sm"
      class="fixed bottom-3 left-3 z-50 shadow-md lg:hidden"
      :aria-label="mobileOpen ? '收起已选择功法' : '展开已选择功法'"
      @click="mobileOpen = !mobileOpen"
    >
      <ChevronUp :class="cn('size-4 transition-transform', mobileOpen && 'rotate-180')" />
    </AppButton>

    <AppCard
      :class="cn(
        'max-lg:fixed max-lg:inset-x-3 max-lg:bottom-3 max-lg:z-40 max-lg:max-h-[40vh] max-lg:overflow-y-auto max-lg:shadow-xl max-lg:transition-transform max-lg:duration-200',
        !mobileOpen && 'max-lg:translate-y-[calc(100%+1rem)]',
      )"
    >
      <AppCardHeader class="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>已选择功法</CardTitle>
          <CardDescription>
            {{ selectedCount }} / {{ MAX_SELECTION }}
            <span v-if="lockedSectLabel">，锁定 {{ lockedSectLabel }}</span>
          </CardDescription>
        </div>
        <AppButton variant="outline" size="sm" @click="emit('clearSelection')">清空</AppButton>
      </AppCardHeader>

      <AppCardContent class="grid gap-4 max-lg:pb-14">
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
      </AppCardContent>
    </AppCard>

    <div
      aria-hidden="true"
      :class="cn(
        'lg:hidden transition-[height] duration-200',
        mobileOpen ? 'h-[calc(40vh+1.5rem)]' : 'h-12',
      )"
    />
  </div>
</template>
