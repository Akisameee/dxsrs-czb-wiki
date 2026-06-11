<script setup lang="ts">
import type { LoadoutOption } from "~/components/tools/loadout/types";
import RunControls from "~/components/tools/custom-martial-art/RunControls.vue";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import WikiEnumSelect from "~/components/wiki/WikiEnumSelect.vue";
import WikiNumberInput from "~/components/wiki/WikiNumberInput.vue";

const props = defineProps<{
  target: Record<string, string>;
  weaponOptions: LoadoutOption[];
  styleOptions: LoadoutOption[];
  areaOptions: LoadoutOption[];
  effectOptions: LoadoutOption[];
  emptyOption: string;
  effectMaxLevel: number;
  trials: string;
  status: string;
  pending: boolean;
  busy: boolean;
}>();

const emit = defineEmits<{
  updateTarget: [patch: Record<string, string>];
  updateTrials: [value: string];
  search: [];
}>();

const visibleWeaponOptions = computed(() => props.weaponOptions.filter((item) => item.label));
const styleSelectOptions = computed(() => [
  { id: props.emptyOption, label: "不指定" },
  ...props.styleOptions,
]);
const areaSelectOptions = computed(() => [
  { id: props.emptyOption, label: "不指定" },
  ...props.areaOptions,
]);
const effectSelectOptions = computed(() => [
  { id: props.emptyOption, label: "不指定" },
  ...props.effectOptions,
]);
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>初始搜索</CardTitle>
      <CardDescription>
        <span v-if="status" class="text-muted-foreground">{{ status }}</span>
        <span v-else class="text-muted-foreground">选择目标词条后，枚举四维组合并估算贪心锁定命中概率。</span>
      </CardDescription>
    </CardHeader>
    <CardContent class="grid gap-4 lg:grid-cols-[repeat(5,minmax(0,1fr))_minmax(0,2fr)] lg:items-end">
        <div class="grid gap-2">
          <Label class="text-muted-foreground" for="search-weapon">武器</Label>
          <WikiEnumSelect
            id="search-weapon"
            :model-value="target.weaponType"
            :options="visibleWeaponOptions"
            placeholder="读取中"
            @update:model-value="emit('updateTarget', { weaponType: $event })"
          />
        </div>

        <div class="grid gap-2">
          <Label class="text-muted-foreground" for="search-style">目标风格</Label>
          <WikiEnumSelect
            id="search-style"
            :model-value="target.styleId"
            :options="styleSelectOptions"
            placeholder="不指定"
            @update:model-value="emit('updateTarget', { styleId: $event })"
          />
        </div>

        <div class="grid gap-2">
          <Label class="text-muted-foreground" for="search-area">攻击范围</Label>
          <WikiEnumSelect
            id="search-area"
            :model-value="target.areaName"
            :options="areaSelectOptions"
            placeholder="不指定"
            @update:model-value="emit('updateTarget', { areaName: $event })"
          />
        </div>

        <div class="grid gap-2">
          <Label class="text-muted-foreground" for="search-effect">特殊效果</Label>
          <WikiEnumSelect
            id="search-effect"
            :model-value="target.effectType"
            :options="effectSelectOptions"
            placeholder="不指定"
            @update:model-value="emit('updateTarget', { effectType: $event })"
          />
        </div>

        <div class="grid gap-2">
          <Label class="text-muted-foreground" for="search-effect-level">效果等级</Label>
          <WikiNumberInput
            id="search-effect-level"
            :model-value="target.effectLevel"
            min="1"
            :max="effectMaxLevel || undefined"
            :disabled="effectMaxLevel <= 0"
            @update:model-value="emit('updateTarget', { effectLevel: $event })"
          />
        </div>

      <RunControls
        input-id="search-trials"
        label="模拟次数"
        :model-value="trials"
        step="32"
        :disabled="pending"
        :busy="busy"
        action-label="搜索"
        busy-label="搜索中"
        @update-model-value="emit('updateTrials', $event)"
        @run="emit('search')"
      />
    </CardContent>
  </Card>
</template>
