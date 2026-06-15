<script setup lang="ts">
import type { CustomMartialState, LoadoutOption } from "./types";
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

const props = defineProps<{
  emptyOption: string;
  customMartial: CustomMartialState;
  customCanBeEnabled: boolean;
  customConflictSectLabel: string;
  joinableSectOptions: LoadoutOption[];
  customStyleOptions: LoadoutOption[];
}>();

const emit = defineEmits<{
  updateCustomMartial: [patch: Partial<CustomMartialState>];
}>();

function toggleCustomMartial() {
  if (props.customMartial.enabled) {
    emit("updateCustomMartial", { enabled: false });
    return;
  }

  if (props.customCanBeEnabled) {
    emit("updateCustomMartial", { enabled: true });
  }
}

function handleCardKeydown(event: KeyboardEvent) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  toggleCustomMartial();
}

function cardClass() {
  const classes = [
    "cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md",
    "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
  ];
  if (props.customMartial.enabled) classes.push("ring-2 ring-primary");
  if (!props.customCanBeEnabled && !props.customMartial.enabled) classes.push("opacity-60");
  return classes.join(" ");
}
</script>

<template>
  <AppCard
    :class="cardClass()"
    role="button"
    tabindex="0"
    :aria-pressed="customMartial.enabled"
    :aria-disabled="!customCanBeEnabled && !customMartial.enabled"
    @click="toggleCustomMartial"
    @keydown="handleCardKeydown"
  >
    <AppCardHeader>
      <div>
        <CardTitle>自创</CardTitle>
        <CardDescription :class="customConflictSectLabel ? 'text-destructive' : undefined">
          <template v-if="customConflictSectLabel">
            当前已加入{{ customConflictSectLabel }}，自创外功不能选择其它门派。
          </template>
        </CardDescription>
      </div>
    </AppCardHeader>
    <AppCardContent class="grid gap-3 grid-cols-2" @click.stop @keydown.stop>
      <div class="grid gap-2">
        <Label class="text-muted-foreground" for="custom-sect">门派</Label>
        <Select
          :model-value="customMartial.sectId"
          @update:model-value="emit('updateCustomMartial', { sectId: String($event) })"
        >
          <AppSelectTrigger id="custom-sect" class="w-full">
            <SelectValue placeholder="选择门派" />
          </AppSelectTrigger>
          <SelectContent>
            <SelectItem :value="emptyOption">选择门派</SelectItem>
            <SelectItem v-for="option in joinableSectOptions" :key="option.id" :value="option.id">
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="grid gap-2">
        <Label class="text-muted-foreground" for="custom-style">风格</Label>
        <Select
          :model-value="customMartial.styleId"
          @update:model-value="emit('updateCustomMartial', { styleId: String($event) })"
        >
          <AppSelectTrigger id="custom-style" class="w-full">
            <SelectValue placeholder="选择风格" />
          </AppSelectTrigger>
          <SelectContent>
            <SelectItem :value="emptyOption">选择风格</SelectItem>
            <SelectItem v-for="option in customStyleOptions" :key="option.id" :value="option.id">
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </AppCardContent>
  </AppCard>
</template>
