<script setup lang="ts">
import GameImage from "~/components/wiki/WikiImage.vue";
import WikiCard from "~/components/wiki/WikiCard.vue";
import ItemHoverLink from "~/components/wiki/item/HoverLink.vue";
import EditableFieldFrame from "~/components/tools/save-edit/fields/EditableFieldFrame.vue";
import EditableNumberField from "~/components/tools/save-edit/fields/EditableNumberField.vue";
import EquipmentEditDialog, { type EquipmentEditField } from "./EquipmentEditDialog.vue";
import type { BgDatabaseField } from "~/lib/bgdatabase";

const props = defineProps<{
  rowIndex: number;
  itemName: string;
  uid: string;
  quantity: string;
  initialQuantity: string;
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
}>();

const emit = defineEmits<{
  updateQuantity: [value: string];
  updateEquipmentField: [payload: { field: BgDatabaseField; value: string }];
  reset: [];
}>();

const equipmentDialogOpen = ref(false);
const displayName = computed(() => props.item?.name || props.itemName || "未知道具");
const legacyName = computed(() => props.item?.legacy_name || props.itemName);
const shouldShowLegacyName = computed(() => Boolean(legacyName.value && legacyName.value !== displayName.value));
const initial = computed(() => displayName.value.slice(0, 1));
const rowFields = computed(() => props.rowFields || []);

function updateEquipmentField(field: BgDatabaseField, value: string) {
  emit("updateEquipmentField", { field, value });
}
</script>

<template>
  <WikiCard
    :title="displayName"
    :description="typeLabel"
    :color="rarityClass"
  >
    <template #avatar>
      <GameImage
        :id="item?.image_id"
        :alt="displayName"
        :fallback="initial"
        :size="40"
      />
    </template>

    <template #action>
      <div v-if="!isEquipment" class="flex h-9 max-w-20 items-center gap-2">
        <EditableNumberField
          :initial-value="initialQuantity"
          :model-value="quantity"
          :min="0"
          compact
          @update="emit('updateQuantity', $event)"
        />
      </div>
      <EditableFieldFrame
        v-else
        :dirty="dirty"
        @reset="emit('reset')"
      >
        <Button
          variant="outline"
          class="h-9"
          type="button"
          @click="equipmentDialogOpen = true"
        >
          编辑
        </Button>
      </EditableFieldFrame>
      <ItemHoverLink
        v-if="item"
        :id="item.id"
        mode="button"
      />
    </template>
  </WikiCard>

  <EquipmentEditDialog
    v-if="isEquipment"
    v-model:open="equipmentDialogOpen"
    :item-name="displayName"
    :legacy-name="legacyName"
    :uid="uid"
    :fields="rowFields"
    @update-field="updateEquipmentField($event.field, $event.value)"
  />
</template>
