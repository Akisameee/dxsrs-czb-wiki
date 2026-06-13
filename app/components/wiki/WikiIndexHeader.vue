<script setup lang="ts">
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
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
  <Card>
    <CardHeader>
      <CardTitle>{{ title }}</CardTitle>
      <CardDescription v-if="description">
        {{ description }}
      </CardDescription>
    </CardHeader>
    <CardContent class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div class="grid gap-2">
        <Label :for="searchId">{{ searchLabel }}</Label>
        <Input
          :id="searchId"
          type="search"
          :model-value="search"
          :placeholder="searchPlaceholder"
          @update:model-value="updateSearch"
        />
      </div>

      <div v-for="filter in filters" :key="filter.id" class="grid gap-2">
        <Label :for="filter.id">{{ filter.label }}</Label>
        <Select
          :model-value="filter.modelValue"
          @update:model-value="updateFilter(filter.id, $event)"
        >
          <SelectTrigger :id="filter.id" class="w-full">
            <SelectValue :placeholder="filter.placeholder" />
          </SelectTrigger>
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
    </CardContent>
  </Card>
</template>
