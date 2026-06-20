<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "~/lib/utils";

type WikiCardGridError = string | { message?: string } | null;

const props = withDefaults(defineProps<{
  error?: WikiCardGridError;
  rows: readonly unknown[];
  total: number;
  pageSize: number;
  emptyLabel: string;
  pagination?: boolean;
  gridClass?: HTMLAttributes["class"];
}>(), {
  error: null,
  pagination: true,
  gridClass: undefined,
});

const page = defineModel<number>("page", { default: 1 });

const errorMessage = computed(() => {
  if (!props.error) return "";
  if (typeof props.error === "string") return props.error;
  return props.error.message || "读取失败";
});
</script>

<template>
  <AppCard v-if="errorMessage">
    <AppCardContent class="text-destructive">{{ errorMessage }}</AppCardContent>
  </AppCard>

  <template v-else>
    <AppPagination
      v-if="pagination"
      v-model:page="page"
      :total="total"
      :page-size="pageSize"
    />

    <div
      v-if="rows.length"
      :class="cn('grid grid-cols-2 gap-2 md:gap-3 lg:grid-cols-3 xl:grid-cols-4', gridClass)"
    >
      <slot />
    </div>

    <AppCard v-else>
      <AppCardContent class="py-12 text-center text-muted-foreground">
        {{ emptyLabel }}
      </AppCardContent>
    </AppCard>
  </template>
</template>
