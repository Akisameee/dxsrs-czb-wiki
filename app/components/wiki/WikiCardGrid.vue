<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { Card, CardContent } from "~/components/ui/card";
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

type WikiCardGridError = string | { message?: string } | null;

const props = withDefaults(defineProps<{
  error?: WikiCardGridError;
  rows: readonly unknown[];
  total: number;
  pageSize: number;
  emptyLabel: string;
  gridClass?: HTMLAttributes["class"];
}>(), {
  error: null,
  gridClass: undefined,
});

const page = defineModel<number>("page", { required: true });

const errorMessage = computed(() => {
  if (!props.error) return "";
  if (typeof props.error === "string") return props.error;
  return props.error.message || "读取失败";
});
</script>

<template>
  <Card v-if="errorMessage">
    <CardContent class="text-destructive">{{ errorMessage }}</CardContent>
  </Card>

  <template v-else>
    <Pagination
      v-slot="{ page: activePage }"
      v-model:page="page"
      :items-per-page="pageSize"
      :sibling-count="1"
      :total="total"
      show-edges
    >
      <PaginationContent v-slot="{ items }">
        <PaginationFirst />
        <PaginationPrevious />
        <template v-for="(item, index) in items" :key="index">
          <PaginationItem
            v-if="item.type === 'page'"
            :is-active="item.value === activePage"
            :value="item.value"
          >
            {{ item.value }}
          </PaginationItem>
          <PaginationEllipsis v-else />
        </template>
        <PaginationNext />
        <PaginationLast />
      </PaginationContent>
    </Pagination>

    <div
      v-if="rows.length"
      :class="cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', gridClass)"
    >
      <slot />
    </div>

    <Card v-else>
      <CardContent class="py-12 text-center text-muted-foreground">
        {{ emptyLabel }}
      </CardContent>
    </Card>
  </template>
</template>
