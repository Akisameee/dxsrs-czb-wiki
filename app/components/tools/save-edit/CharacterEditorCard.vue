<script setup lang="ts">
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import WikiEnumSelect from "~/components/wiki/WikiEnumSelect.vue";
import WikiNumberInput from "~/components/wiki/WikiNumberInput.vue";
import type { SaveEditDraft, SaveEditFieldDefinition } from "./model";

const props = defineProps<{
  title: string;
  description: string;
  draft: SaveEditDraft;
  fields: SaveEditFieldDefinition[];
}>();

const emit = defineEmits<{
  updateField: [key: string, value: string];
}>();

function valueOf(key: string) {
  return props.draft[key] ?? "";
}
</script>

<template>
  <AppCard>
    <AppCardHeader>
      <CardTitle>{{ title }}</CardTitle>
      <CardDescription>{{ description }}</CardDescription>
    </AppCardHeader>
    <AppCardContent class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <div
        v-for="field in fields"
        :key="field.key"
        class="grid gap-2"
      >
        <Label class="text-muted-foreground" :for="`save-edit-${field.key}`">
          {{ field.label }}
        </Label>
        <WikiEnumSelect
          v-if="field.input === 'select'"
          :id="`save-edit-${field.key}`"
          :model-value="valueOf(field.key)"
          :options="field.options || []"
          @update:model-value="emit('updateField', field.key, $event)"
        />
        <WikiNumberInput
          v-else-if="field.input === 'number'"
          :id="`save-edit-${field.key}`"
          :model-value="valueOf(field.key)"
          :min="field.min"
          :max="field.max"
          :step="field.step || 1"
          @update:model-value="emit('updateField', field.key, $event)"
        />
        <AppInput
          v-else
          :id="`save-edit-${field.key}`"
          :model-value="valueOf(field.key)"
          @update:model-value="emit('updateField', field.key, String($event))"
        />
      </div>
    </AppCardContent>
  </AppCard>
</template>
