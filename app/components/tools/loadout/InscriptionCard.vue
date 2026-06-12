<script setup lang="ts">
import type { EquipmentStyleKey, EquipmentStyles, LoadoutOption } from "./types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
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
  <Card>
    <CardHeader>
      <CardTitle>铭刻</CardTitle>
      <CardDescription>装备风格词条会参与风格连锁计算。</CardDescription>
    </CardHeader>
    <CardContent class="grid gap-3 sm:grid-cols-3">
      <div class="grid gap-2">
        <Label class="text-muted-foreground" for="equipment-weapon1">武器 1</Label>
        <Select
          :model-value="equipmentStyles.weapon1"
          @update:model-value="emit('updateEquipmentStyle', 'weapon1', String($event))"
        >
          <SelectTrigger id="equipment-weapon1" class="w-full">
            <SelectValue placeholder="无" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="emptyOption">无</SelectItem>
            <SelectItem v-for="option in equipmentStyleOptions" :key="option.id" :value="option.id">
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="grid gap-2">
        <Label class="text-muted-foreground" for="equipment-weapon2">武器 2</Label>
        <Select
          :model-value="equipmentStyles.weapon2"
          @update:model-value="emit('updateEquipmentStyle', 'weapon2', String($event))"
        >
          <SelectTrigger id="equipment-weapon2" class="w-full">
            <SelectValue placeholder="无" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="emptyOption">无</SelectItem>
            <SelectItem v-for="option in equipmentStyleOptions" :key="option.id" :value="option.id">
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="grid gap-2">
        <Label class="text-muted-foreground" for="equipment-armor">装备</Label>
        <Select
          :model-value="equipmentStyles.armor"
          @update:model-value="emit('updateEquipmentStyle', 'armor', String($event))"
        >
          <SelectTrigger id="equipment-armor" class="w-full">
            <SelectValue placeholder="无" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="emptyOption">无</SelectItem>
            <SelectItem v-for="option in equipmentStyleOptions" :key="option.id" :value="option.id">
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </CardContent>
  </Card>
</template>
