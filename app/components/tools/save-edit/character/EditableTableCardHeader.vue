<script setup lang="ts">
import { RotateCcwIcon } from "@lucide/vue";

withDefaults(defineProps<{
  title: string;
  description?: string;
  dirty?: boolean;
  disabled?: boolean;
}>(), {
  description: "",
  dirty: false,
  disabled: false,
});

const emit = defineEmits<{
  reset: [];
}>();
</script>

<template>
  <AppCardHeader class="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
    <div class="min-w-0">
      <CardTitle>{{ title }}</CardTitle>
      <CardDescription v-if="description">
        {{ description }}
      </CardDescription>
    </div>

    <AppButton
      v-if="dirty"
      type="button"
      variant="ghost"
      size="icon"
      class="size-6 rounded-full border bg-background text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground"
      :disabled="disabled"
      @click="emit('reset')"
    >
      <RotateCcwIcon class="size-3.5" />
      <span class="sr-only">重置所有修改</span>
    </AppButton>
  </AppCardHeader>
</template>
