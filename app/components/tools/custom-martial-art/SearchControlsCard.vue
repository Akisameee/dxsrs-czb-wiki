<script setup lang="ts">
import type { CustomMartialOption, SearchTarget } from "~/components/tools/custom-martial-art/types";
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
  target: SearchTarget;
  weaponOptions: CustomMartialOption[];
  styleOptions: CustomMartialOption[];
  areaOptions: CustomMartialOption[];
  effectOptions: CustomMartialOption[];
  emptyOption: string;
  effectMaxLevel: number;
  trials: string;
  status: string;
  pending: boolean;
  isSearching: boolean;
}>();

const emit = defineEmits<{
  updateTarget: [patch: Partial<SearchTarget>];
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
  <AppCard>
    <AppCardHeader>
      <CardTitle>初始搜索</CardTitle>
      <CardDescription>
        <span v-if="status" class="text-muted-foreground">{{ status }}</span>
        <span v-else class="text-muted-foreground">枚举初始组合并估算贪心锁定目标词条的命中概率</span>
      </CardDescription>
    </AppCardHeader>
    <AppCardContent class="grid gap-4 md:grid-cols-[minmax(0,5fr)_minmax(0,2fr)]">
      <div class="grid gap-2 grid-cols-5">
        <div class="grid gap-2">
          <Label class="text-muted-foreground" for="search-weapon">武器</Label>
          <WikiEnumSelect
            id="search-weapon"
            :model-value="target.weaponType"
            :options="visibleWeaponOptions"
            placeholder="读取中"
            :disabled="isSearching"
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
            :disabled="isSearching"
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
            :disabled="isSearching"
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
            :disabled="isSearching"
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
            :disabled="isSearching || effectMaxLevel <= 0"
            @update:model-value="emit('updateTarget', { effectLevel: $event })"
          />
        </div>
      </div>
      <RunControls
        input-id="search-trials"
        label="模拟次数"
        :model-value="trials"
        step="32"
        :disabled="pending"
        :busy="isSearching"
        action-label="搜索"
        busy-label="搜索中"
        @update-model-value="emit('updateTrials', $event)"
        @run="emit('search')"
      />
    </AppCardContent>
  </AppCard>
</template>
