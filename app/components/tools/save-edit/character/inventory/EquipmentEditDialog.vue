<script setup lang="ts">
import EditableEnumField, { type EditableEnumOption } from "~/components/tools/save-edit/fields/EditableEnumField.vue";
import EditableNumberField from "~/components/tools/save-edit/fields/EditableNumberField.vue";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import type { BgDatabaseField } from "~/lib/bgdatabase";

export type EquipmentEditField = {
  key: string;
  field: BgDatabaseField;
  value: string;
  initialValue: string;
  enumOptions: EditableEnumOption[];
};

defineProps<{
  itemName: string;
  legacyName?: string;
  uid: string;
  fields: EquipmentEditField[];
}>();

const emit = defineEmits<{
  updateField: [payload: { field: BgDatabaseField; value: string }];
}>();

const open = defineModel<boolean>("open", { required: true });

function updateField(field: BgDatabaseField, value: string) {
  emit("updateField", { field, value });
}

function fieldLabel(field: EquipmentEditField) {
  return field.key;
}

function fieldInput(field: EquipmentEditField) {
  if (field.key === "mingke_fg") return "select";
  if (["Int", "Float", "Long", "Enum"].includes(field.field.fieldType)) return "number";
  return "readonly";
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle>{{ itemName }}</DialogTitle>
        <DialogDescription>
          <span v-if="legacyName && legacyName !== itemName">存档：{{ legacyName }}，</span>
          UID：{{ uid || "-" }}
        </DialogDescription>
      </DialogHeader>

      <div v-if="fields.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="field in fields"
          :key="field.key"
          class="grid gap-1.5"
        >
          <Label>{{ fieldLabel(field) }}</Label>
          <EditableEnumField
            v-if="fieldInput(field) === 'select'"
            :initial-value="field.initialValue"
            :model-value="field.value"
            :options="field.enumOptions"
            placeholder="选择风格"
            compact
            @update="updateField(field.field, $event)"
          />
          <EditableNumberField
            v-else-if="fieldInput(field) === 'number'"
            :initial-value="field.initialValue"
            :model-value="field.value"
            compact
            @update="updateField(field.field, $event)"
          />
          <div
            v-else
            class="h-9 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground"
          >
            {{ field.value || "-" }}
          </div>
        </div>
      </div>

      <div v-else class="rounded-md border px-3 py-8 text-center text-sm text-muted-foreground">
        这个装备没有可编辑属性字段
      </div>

      <DialogFooter>
        <DialogClose as-child>
          <AppButton type="button">完成</AppButton>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
