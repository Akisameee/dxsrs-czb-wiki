<script setup lang="ts">
import EditableNumberField from "~/components/tools/save-edit/fields/EditableNumberField.vue";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
} from "~/components/ui/dialog";
import CharacterEditDialogHeader from "../CharacterEditDialogHeader.vue";

defineProps<{
  itemId?: number | string | null;
  itemName: string;
  legacyName?: string;
  uid: string;
  quantity: string;
  initialQuantity: string;
  quantityDirty?: boolean;
  quantityResetValue?: string;
}>();

const emit = defineEmits<{
  updateQuantity: [value: string];
}>();

const open = defineModel<boolean>("open", { required: true });
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-md"
      @open-auto-focus.prevent
    >
      <CharacterEditDialogHeader
        kind="item"
        :id="itemId"
        :title="itemName"
        :legacy-name="legacyName"
        :uid="uid"
      />

      <AppFieldStack label="数量">
        <EditableNumberField
          :initial-value="initialQuantity"
          :model-value="quantity"
          :dirty="quantityDirty"
          :reset-value="quantityResetValue"
          :min="1"
          @update="emit('updateQuantity', $event)"
        />
      </AppFieldStack>

      <DialogFooter>
        <DialogClose as-child>
          <AppButton type="button">完成</AppButton>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
