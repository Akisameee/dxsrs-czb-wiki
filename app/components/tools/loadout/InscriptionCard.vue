<script setup lang="ts">
import type { EquipmentStyleKey, EquipmentStyles, LoadoutOption } from "./types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Select,
  SelectItem,
  SelectValue,
} from "~/components/ui/select";

defineProps<{
  equipmentStyles: EquipmentStyles;
  equipmentStyleOptions: LoadoutOption[];
  emptyOption: string;
}>();

const emit = defineEmits<{
  updateEquipmentStyle: [key: EquipmentStyleKey, value: string];
}>();

</script>

<template>
  <AppCard>
    <AppCardHeader>
      <CardTitle>铭刻</CardTitle>
    </AppCardHeader>
    <AppCardContent class="grid gap-3 grid-cols-3">
      <AppFieldStack label="武器 1" label-for="equipment-weapon1">
        <Select
          :model-value="equipmentStyles.weapon1"
          @update:model-value="emit('updateEquipmentStyle', 'weapon1', String($event))"
        >
          <AppSelectTrigger id="equipment-weapon1" class="w-full">
            <SelectValue placeholder="无" />
          </AppSelectTrigger>
          <AppSelectContent>
            <SelectItem :value="emptyOption">无</SelectItem>
            <SelectItem v-for="option in equipmentStyleOptions" :key="option.id" :value="option.id">
              {{ option.label }}
            </SelectItem>
          </AppSelectContent>
        </Select>
      </AppFieldStack>

      <AppFieldStack label="武器 2" label-for="equipment-weapon2">
        <Select
          :model-value="equipmentStyles.weapon2"
          @update:model-value="emit('updateEquipmentStyle', 'weapon2', String($event))"
        >
          <AppSelectTrigger id="equipment-weapon2" class="w-full">
            <SelectValue placeholder="无" />
          </AppSelectTrigger>
          <AppSelectContent>
            <SelectItem :value="emptyOption">无</SelectItem>
            <SelectItem v-for="option in equipmentStyleOptions" :key="option.id" :value="option.id">
              {{ option.label }}
            </SelectItem>
          </AppSelectContent>
        </Select>
      </AppFieldStack>

      <AppFieldStack label="装备" label-for="equipment-armor">
        <Select
          :model-value="equipmentStyles.armor"
          @update:model-value="emit('updateEquipmentStyle', 'armor', String($event))"
        >
          <AppSelectTrigger id="equipment-armor" class="w-full">
            <SelectValue placeholder="无" />
          </AppSelectTrigger>
          <AppSelectContent>
            <SelectItem :value="emptyOption">无</SelectItem>
            <SelectItem v-for="option in equipmentStyleOptions" :key="option.id" :value="option.id">
              {{ option.label }}
            </SelectItem>
          </AppSelectContent>
        </Select>
      </AppFieldStack>
    </AppCardContent>
  </AppCard>
</template>
