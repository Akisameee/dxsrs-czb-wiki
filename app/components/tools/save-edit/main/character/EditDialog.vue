<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { X } from "@lucide/vue";
import type { BgDatabaseField, BgDatabaseTable, SaveEditDraft, SaveEditDraftResetTarget, SaveEditRowDraftOperation } from "~/lib/save-edit";
import type { WikiEnums } from "~/lib/wiki/text";
import CharacterDetailCard from "./CharacterDetailCard.vue";
import MartialArtsTableCard from "~/components/tools/save-edit/main/martial-arts/TableCard.vue";
import InventoryTableCard from "~/components/tools/save-edit/main/inventory/TableCard.vue";

const props = defineProps<{
  open: boolean;
  table: BgDatabaseTable | null;
  rowIndex: number | null;
  draft: SaveEditDraft;
  enums: WikiEnums;
  ownerName: string;
  ownerLabel: string;
  equippedUids: { weapon: string; armor: string };
  equipmentSlots: Array<{ key: string; label: string }>;
  jsWugongTable: BgDatabaseTable | null;
  gWugongTable: BgDatabaseTable | null;
  gWugongDetailTable: BgDatabaseTable | null;
  inventoryTable: BgDatabaseTable | null;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  updateField: [field: BgDatabaseField, value: string, rowIndex: number];
  resetRow: [rowIndex: number];
  rowOperation: [operation: SaveEditRowDraftOperation];
  rowOperations: [operations: SaveEditRowDraftOperation[]];
  resetDraft: [target: SaveEditDraftResetTarget];
}>();
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-5xl" @open-auto-focus.prevent>
      <DialogHeader>
        <DialogTitle>编辑角色</DialogTitle>
        <DialogDescription v-if="rowIndex !== null">
          第 {{ rowIndex }} 行
        </DialogDescription>
      </DialogHeader>

      <div class="flex justify-end">
        <DialogClose as-child>
          <Button type="button" variant="ghost" size="icon" class="size-8">
            <X class="size-4" />
          </Button>
        </DialogClose>
      </div>

      <CharacterDetailCard
        v-if="table && rowIndex !== null"
        :table="table"
        :row-index="rowIndex"
        :draft="draft"
        :enums="enums"
        @update-field="(field, value, currentRowIndex) => emit('updateField', field, value, currentRowIndex)"
        @reset-row="(currentRowIndex) => emit('resetRow', currentRowIndex)"
      />

      <MartialArtsTableCard
        v-if="jsWugongTable && gWugongTable && gWugongDetailTable && ownerName"
        :js-table="jsWugongTable"
        :base-table="gWugongTable"
        :detail-table="gWugongDetailTable"
        :draft="draft"
        :enums="enums"
        :owner-name="ownerName"
        :owner-label="ownerLabel"
        @update-field="(field, value, rowIndex) => emit('updateField', field, value, rowIndex)"
      />

      <InventoryTableCard
        v-if="inventoryTable && ownerName"
        :table="inventoryTable"
        :draft="draft"
        :enums="enums"
        :owner-name="ownerName"
        :owner-label="ownerLabel"
        :equipped-uids="equippedUids"
        :equipment-slots="equipmentSlots"
        @row-operation="(operation) => emit('rowOperation', operation)"
        @row-operations="(operations) => emit('rowOperations', operations)"
        @reset-draft="(target) => emit('resetDraft', target)"
      />
    </DialogContent>
  </Dialog>
</template>
