<script setup lang="ts">
import type { LoadoutOption } from "./types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Label } from "~/components/ui/label";

defineProps<{
  pending: boolean;
  total: number;
  filtered: number;
  sectFilter: string;
  styleFilter: string;
  sectOptions: LoadoutOption[];
  styleOptions: LoadoutOption[];
}>();

const emit = defineEmits<{
  "update:sectFilter": [value: string];
  "update:styleFilter": [value: string];
}>();
</script>

<template>
  <AppCard>
    <AppCardHeader>
      <CardTitle>配装工具</CardTitle>
      <CardDescription>
        {{ pending ? "读取中..." : `共 ${total} 门武学，当前 ${filtered} 条` }}
      </CardDescription>
    </AppCardHeader>
    <AppCardContent class="grid gap-5">
      <div class="grid gap-2">
        <Label class="text-muted-foreground">门派</Label>
        <div class="flex flex-wrap gap-2">
          <AppButton
            type="button"
            size="sm"
            class="h-7 px-2 text-xs lg:h-8 lg:px-3 lg:text-sm"
            :variant="sectFilter === 'all' ? 'default' : 'outline'"
            @click="emit('update:sectFilter', 'all')"
          >
            全部门派
          </AppButton>
          <AppButton
            v-for="option in sectOptions"
            :key="option.id"
            type="button"
            size="sm"
            class="h-7 px-2 text-xs lg:h-8 lg:px-3 lg:text-sm"
            :variant="sectFilter === option.id ? 'default' : 'outline'"
            @click="emit('update:sectFilter', option.id)"
          >
            {{ option.label }}
          </AppButton>
        </div>
      </div>

      <div class="grid gap-2">
        <Label class="text-muted-foreground">风格</Label>
        <div class="flex flex-wrap gap-2">
          <AppButton
            type="button"
            size="sm"
            class="h-7 px-2 text-xs lg:h-8 lg:px-3 lg:text-sm"
            :variant="styleFilter === 'all' ? 'default' : 'outline'"
            @click="emit('update:styleFilter', 'all')"
          >
            全部风格
          </AppButton>
          <AppButton
            v-for="option in styleOptions"
            :key="option.id"
            type="button"
            size="sm"
            class="h-7 px-2 text-xs lg:h-8 lg:px-3 lg:text-sm"
            :variant="styleFilter === option.id ? 'default' : 'outline'"
            @click="emit('update:styleFilter', option.id)"
          >
            {{ option.label }}
          </AppButton>
        </div>
      </div>
    </AppCardContent>
  </AppCard>
</template>
