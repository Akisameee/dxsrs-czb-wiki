<script setup lang="ts">
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Select,
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
      <AppFieldStack :label="searchLabel" :label-for="searchId">
        <AppInput
          :id="searchId"
          type="search"
          :model-value="search"
          :placeholder="searchPlaceholder"
          @update:model-value="updateSearch"
        />
      </AppFieldStack>

      <AppFieldStack
        v-for="filter in filters"
        :key="filter.id"
        :label="filter.label"
        :label-for="filter.id"
      >
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
          <AppSelectContent>
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
          </AppSelectContent>
        </Select>
      </AppFieldStack>
    </AppCardContent>
  </AppCard>
</template>
