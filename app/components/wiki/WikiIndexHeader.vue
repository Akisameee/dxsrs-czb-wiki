<script setup lang="ts">
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
  SelectValue,
} from "~/components/ui/select";

export type WikiIndexFilterOption = {
  value: string;
  label: string;
};

export type WikiIndexFilter = {
  id: string;
  label: string;
  modelValue: string;
  placeholder?: string;
  allLabel?: string;
  allValue?: string;
  options: WikiIndexFilterOption[];
};

withDefaults(defineProps<{
  title: string;
  description?: string;
  search: string;
  searchId: string;
  searchLabel?: string;
  searchPlaceholder?: string;
  filters?: WikiIndexFilter[];
}>(), {
  description: "",
  searchLabel: "搜索",
  searchPlaceholder: "搜索",
  filters: () => [],
});

const emit = defineEmits<{
  "update:search": [value: string];
  "update:filter": [id: string, value: string];
}>();

function updateSearch(value: string | number) {
  emit("update:search", String(value));
}

function updateFilter(id: string, value: unknown) {
  emit("update:filter", id, String(value));
}
</script>

<template>
  <AppCard>
    <AppCardHeader>
      <CardTitle>{{ title }}</CardTitle>
      <CardDescription v-if="description">
        {{ description }}
      </CardDescription>
    </AppCardHeader>
    <AppCardContent class="grid grid-cols-[repeat(4,minmax(0,1fr))] gap-4">
      <div class="grid min-w-0 gap-2">
        <Label :for="searchId">{{ searchLabel }}</Label>
        <AppInput
          :id="searchId"
          type="search"
          :model-value="search"
          :placeholder="searchPlaceholder"
          @update:model-value="updateSearch"
        />
      </div>

      <div v-for="filter in filters" :key="filter.id" class="grid min-w-0 gap-2">
        <Label :for="filter.id">{{ filter.label }}</Label>
        <Select
          :model-value="filter.modelValue"
          @update:model-value="updateFilter(filter.id, $event)"
        >
          <AppSelectTrigger
            :id="filter.id"
            class="min-w-0 w-full [&_[data-slot=select-value]]:min-w-0 [&_[data-slot=select-value]]:truncate"
          >
            <SelectValue :placeholder="filter.placeholder" />
          </AppSelectTrigger>
          <SelectContent>
            <SelectItem :value="filter.allValue || 'all'">
              {{ filter.allLabel || "全部" }}
            </SelectItem>
            <SelectItem
              v-for="option in filter.options"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </AppCardContent>
  </AppCard>
</template>
