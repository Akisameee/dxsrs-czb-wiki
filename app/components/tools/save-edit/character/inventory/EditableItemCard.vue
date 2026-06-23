<script setup lang="ts">
import ItemCard from "~/components/wiki/item/Card.vue";
import SaveEditResettableFrame from "~/components/tools/save-edit/SaveEditResettableFrame.vue";
import SaveEditEditButton from "~/components/tools/save-edit/SaveEditEditButton.vue";
import SaveEditDeleteButton from "~/components/tools/save-edit/SaveEditDeleteButton.vue";
import EquipmentEditDialog, { type EquipmentEditField } from "./EquipmentEditDialog.vue";
import QuantityEditDialog from "./QuantityEditDialog.vue";
import type { BgDatabaseField } from "~/lib/save-edit";

const props = defineProps<{
  rowIndex: number;
  itemName: string;
  uid: string;
  quantity: string;
  initialQuantity: string;
  quantityDirty?: boolean;
  quantityResetValue?: string;
  item: {
    id: number;
    name: string | null;
    legacy_name?: string | null;
    image_id: string | null;
  } | null;
  isEquipment?: boolean;
  rowFields?: EquipmentEditField[];
  typeLabel: string;
  rarityLabel: string;
  rarityClass?: string;
  dirty?: boolean;
  deleteMode?: boolean;
}>();

const emit = defineEmits<{
  updateQuantity: [value: string];
  updateEquipmentField: [payload: { field: BgDatabaseField; value: string }];
  reset: [];
  delete: [];
}>();

const equipmentDialogOpen = ref(false);
const quantityDialogOpen = ref(false);
const displayName = computed(() => props.item?.name || props.itemName || "未知道具");
const legacyName = computed(() => props.item?.legacy_name || props.itemName);
const rowFields = computed(() => props.rowFields || []);
const quantityText = computed(() => `x${props.quantity || "1"}`);

function updateEquipmentField(field: BgDatabaseField, value: string) {
  emit("updateEquipmentField", { field, value });
}

function openEditDialog() {
  if (props.isEquipment) equipmentDialogOpen.value = true;
  else quantityDialogOpen.value = true;
}
</script>

<template>
  <SaveEditResettableFrame
    v-if="isEquipment"
    :dirty="Boolean(dirty)"
    :readonly="deleteMode"
    :surface="false"
    reset-label="重置装备"
    reset-class="-right-2 -top-2"
    @reset="emit('reset')"
  >
    <ItemCard
      :id="item?.id || rowIndex"
      :name="displayName"
      :image-id="item?.image_id"
      :description="typeLabel"
      :card-color="rarityClass"
    >
      <template #action>
        <SaveEditDeleteButton
          v-if="deleteMode"
          label="删除物品"
          @click="emit('delete')"
        />
        <SaveEditEditButton
          v-else
          aria-label="编辑物品"
          label="编辑物品"
          @click="openEditDialog"
        />
      </template>

      <template #footer>
        <div class="text-xs md:text-sm text-muted-foreground tabular-nums">
          {{ quantityText }}
        </div>
      </template>
    </ItemCard>
  </SaveEditResettableFrame>

  <ItemCard
    v-else
    :id="item?.id || rowIndex"
    :name="displayName"
    :image-id="item?.image_id"
    :description="typeLabel"
    :card-color="rarityClass"
  >
    <template #action>
      <SaveEditDeleteButton
        v-if="deleteMode"
        label="删除物品"
        @click="emit('delete')"
      />
      <SaveEditEditButton
        v-else
        aria-label="编辑物品"
        label="编辑物品"
        @click="openEditDialog"
      />
    </template>

    <template #footer>
      <div class="text-xs md:text-sm text-muted-foreground tabular-nums">
        {{ quantityText }}
      </div>
    </template>
  </ItemCard>

  <EquipmentEditDialog
    v-if="isEquipment"
    v-model:open="equipmentDialogOpen"
    :item-id="item?.id"
    :item-name="displayName"
    :legacy-name="legacyName"
    :uid="uid"
    :fields="rowFields"
    @update-field="updateEquipmentField($event.field, $event.value)"
  />

  <QuantityEditDialog
    v-else
    v-model:open="quantityDialogOpen"
    :item-id="item?.id"
    :item-name="displayName"
    :legacy-name="legacyName"
    :uid="uid"
    :quantity="quantity"
    :initial-quantity="initialQuantity"
    :quantity-dirty="quantityDirty"
    :quantity-reset-value="quantityResetValue"
    @update-quantity="emit('updateQuantity', $event)"
  />
</template>
