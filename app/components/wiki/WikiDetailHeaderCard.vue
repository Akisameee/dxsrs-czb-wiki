<script setup lang="ts">
import type { HTMLAttributes } from "vue";

withDefaults(defineProps<{
  title: string;
  description?: string | null;
  colorClass?: HTMLAttributes["class"];
}>(), {
  description: "",
  colorClass: undefined,
});
</script>

<template>
  <AppCard :class="colorClass">
    <AppCardHeader>
      <div class="grid gap-2">
        <div>
          <CardTitle class="text-2xl">{{ title }}</CardTitle>
          <CardDescription v-if="description">
            {{ description }}
          </CardDescription>
        </div>
      </div>
    </AppCardHeader>
  </AppCard>
</template>
