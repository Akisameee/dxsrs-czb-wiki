<script setup lang="ts">
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "~/components/ui/tabs";

type TabOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

const props = withDefaults(defineProps<{
  modelValue: string;
  options: TabOption[];
  tabsClass?: string;
  listClass?: string;
  triggerClass?: string;
}>(), {
  tabsClass: "",
  listClass: "grid w-full grid-cols-2 sm:w-auto",
  triggerClass: "",
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const model = computed({
  get: () => props.modelValue,
  set: (value: string) => emit("update:modelValue", value),
});
</script>

<template>
  <Tabs v-model="model" :class="tabsClass">
    <TabsList :class="listClass">
      <TabsTrigger
        v-for="option in options"
        :key="option.value"
        :value="option.value"
        :disabled="option.disabled"
        :class="triggerClass"
      >
        <slot :name="`trigger-${option.value}`" :option="option">
          {{ option.label }}
        </slot>
      </TabsTrigger>
    </TabsList>
    <slot />
  </Tabs>
</template>
