<script setup lang="ts">
import SaveEditResetButton from "~/components/tools/save-edit/SaveEditResetButton.vue";

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

    <SaveEditResetButton
      v-if="dirty"
      :disabled="disabled"
      @click="emit('reset')"
    />
  </AppCardHeader>
</template>
