<script setup lang="ts" generic="T">
import { Badge, type BadgeVariants } from "~/components/ui/badge";

export type WikiSummaryBadge = {
  label: string;
  variant?: BadgeVariants["variant"];
};

defineProps<{
  summary: T | null;
  pending?: boolean;
  error?: Error | null;
  emptyLabel: string;
  title?: string;
  description?: string;
  badges?: WikiSummaryBadge[];
}>();
</script>

<template>
  <div v-if="pending" class="text-sm text-muted-foreground">
    读取中...
  </div>
  <div v-else-if="error" class="text-sm text-destructive">
    {{ error.message }}
  </div>
  <div v-else-if="summary" class="grid gap-3">
    <div
      v-if="$slots.avatar || title || description || badges?.length"
      class="flex items-start gap-3"
    >
      <slot name="avatar" :summary="summary" />
      <div v-if="title || description" class="min-w-0">
        <div v-if="title" class="font-medium">{{ title }}</div>
        <div v-if="description" class="text-sm text-muted-foreground">{{ description }}</div>
      </div>
      <Badge
        v-for="badge in badges"
        :key="badge.label"
        :variant="badge.variant || 'outline'"
      >
        {{ badge.label }}
      </Badge>
    </div>
    <slot :summary="summary" />
  </div>
  <div v-else class="text-sm text-muted-foreground">
    {{ emptyLabel }}
  </div>
</template>
