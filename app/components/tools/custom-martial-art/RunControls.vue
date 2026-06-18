<script setup lang="ts">
import { Loader } from "@lucide/vue";
import WikiNumberInput from "~/components/wiki/WikiNumberInput.vue";

defineProps<{
  inputId: string;
  label: string;
  modelValue: string;
  step: string;
  disabled: boolean;
  busy: boolean;
  actionLabel: string;
  busyLabel: string;
}>();

const emit = defineEmits<{
  updateModelValue: [value: string];
  run: [];
}>();
</script>

<template>
  <div class="grid gap-3 grid-cols-[minmax(0,1fr)_auto] items-end">
    <AppFieldStack :label="label" :label-for="inputId">
      <WikiNumberInput
        :id="inputId"
        :model-value="modelValue"
        min="1"
        max="10000"
        :step="step"
        :disabled="disabled || busy"
        @update:model-value="emit('updateModelValue', $event)"
      />
    </AppFieldStack>
    <AppButton :disabled="disabled || busy" @click="emit('run')">
      <Loader v-if="busy" class="animate-spin" />
      {{ busy ? busyLabel : actionLabel }}
    </AppButton>
  </div>
</template>
