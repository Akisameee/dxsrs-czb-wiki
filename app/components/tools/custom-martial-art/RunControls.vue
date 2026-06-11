<script setup lang="ts">
import { Loader } from "@lucide/vue";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
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
  <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
    <div class="grid gap-2">
      <Label class="text-muted-foreground" :for="inputId">{{ label }}</Label>
      <WikiNumberInput
        :id="inputId"
        :model-value="modelValue"
        min="1"
        max="10000"
        :step="step"
        @update:model-value="emit('updateModelValue', $event)"
      />
    </div>
    <Button :disabled="disabled || busy" @click="emit('run')">
      <Loader v-if="busy" class="animate-spin" />
      {{ busy ? busyLabel : actionLabel }}
    </Button>
  </div>
</template>
