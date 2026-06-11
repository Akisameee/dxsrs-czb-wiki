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
import { Button } from "~/components/ui/button";

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
  <Card>
    <CardHeader>
      <CardTitle>配装工具</CardTitle>
      <CardDescription>
        {{ pending ? "读取中..." : `共 ${total} 门武学，当前 ${filtered} 条` }}
      </CardDescription>
    </CardHeader>
    <CardContent class="grid gap-5">
      <div class="grid gap-2">
        <Label class="text-muted-foreground">门派</Label>
        <div class="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            :variant="sectFilter === 'all' ? 'default' : 'outline'"
            @click="emit('update:sectFilter', 'all')"
          >
            全部门派
          </Button>
          <Button
            v-for="option in sectOptions"
            :key="option.id"
            type="button"
            size="sm"
            :variant="sectFilter === option.id ? 'default' : 'outline'"
            @click="emit('update:sectFilter', option.id)"
          >
            {{ option.label }}
          </Button>
        </div>
      </div>

      <div class="grid gap-2">
        <Label class="text-muted-foreground">风格</Label>
        <div class="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            :variant="styleFilter === 'all' ? 'default' : 'outline'"
            @click="emit('update:styleFilter', 'all')"
          >
            全部风格
          </Button>
          <Button
            v-for="option in styleOptions"
            :key="option.id"
            type="button"
            size="sm"
            :variant="styleFilter === option.id ? 'default' : 'outline'"
            @click="emit('update:styleFilter', option.id)"
          >
            {{ option.label }}
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
