<script setup lang="ts">
import { useMediaQuery } from "@vueuse/core";
import type { HTMLAttributes } from "vue";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";
import { cn } from "~/lib/utils";

const props = withDefaults(defineProps<{
  total: number;
  pageSize: number;
  siblingCount?: number;
  mobileSiblingCount?: number;
  showEdges?: boolean;
  class?: HTMLAttributes["class"];
  contentClass?: HTMLAttributes["class"];
}>(), {
  siblingCount: 1,
  mobileSiblingCount: 0,
  showEdges: true,
});

const page = defineModel<number>("page", { required: true });
const isSm = useMediaQuery("(min-width: 640px)");
const effectiveSiblingCount = computed(() => (isSm.value ? props.siblingCount : props.mobileSiblingCount));
</script>

<template>
  <Pagination
    v-slot="{ page: activePage }"
    v-model:page="page"
    :items-per-page="pageSize"
    :sibling-count="effectiveSiblingCount"
    :total="total"
    :show-edges="showEdges"
    :class="cn('mx-0', props.class)"
  >
    <PaginationContent
      v-slot="{ items }"
      :class="cn('max-w-full flex-wrap justify-center gap-0 overflow-hidden', props.contentClass)"
    >
      <PaginationFirst size="sm" class="hidden sm:inline-flex" />
      <PaginationPrevious size="sm" />
      <template v-for="(item, index) in items" :key="index">
        <PaginationItem
          v-if="item.type === 'page'"
          :is-active="item.value === activePage"
          :value="item.value"
          size="icon-sm"
          class="tabular-nums"
        >
          {{ item.value }}
        </PaginationItem>
        <PaginationEllipsis v-else class="size-8" />
      </template>
      <PaginationNext size="sm" />
      <PaginationLast size="sm" class="hidden sm:inline-flex" />
    </PaginationContent>
  </Pagination>
</template>
