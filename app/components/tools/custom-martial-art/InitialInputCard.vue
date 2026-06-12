<script setup lang="ts">
import type { CustomMartialInput, CustomMartialOption } from "~/components/tools/custom-martial-art/types";
import RunControls from "~/components/tools/custom-martial-art/RunControls.vue";
import { Badge } from "~/components/ui/badge";
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
  input: CustomMartialInput;
  weaponOptions: CustomMartialOption[];
  attributeTotal: number;
  attributeTarget: number;
  attributesValid: boolean;
  trials: string;
  status: string;
  busy: boolean;
  canRun: boolean;
  pending: boolean;
  errorMessage: string;
}>();

const emit = defineEmits<{
  updateInput: [patch: Partial<CustomMartialInput>];
  updateTrials: [value: string];
  run: [];
}>();

const visibleWeaponOptions = computed(() => props.weaponOptions.filter((item) => item.label));
</script>

<template>
  <Card>
    <CardHeader>
      <div class="flex justify-between gap-3">
        <CardTitle>初始输入</CardTitle>
        <Badge :variant="attributesValid ? 'outline' : 'destructive'">
          四维 {{ attributeTotal }} / {{ attributeTarget }}
        </Badge>
      </div>
      <CardDescription>
        <p v-if="status" class="text-sm text-muted-foreground">{{ status }}</p>
        <p v-else class="text-sm text-muted-foreground">生成固定种子的初始自创武学</p>
      </CardDescription>
    </CardHeader>
    <CardContent class="grid gap-4">
      <p v-if="pending" class="text-sm text-muted-foreground">读取 sqlite 数据中...</p>
      <p v-else-if="errorMessage" class="text-sm text-destructive">{{ errorMessage }}</p>
      <div class="grid gap-3 sm:grid-cols-5">
        <div class="grid gap-2">
          <Label class="text-muted-foreground" for="custom-weapon">武器</Label>
          <WikiEnumSelect
            id="custom-weapon"
            :model-value="input.weaponType"
            :options="visibleWeaponOptions"
            placeholder="读取中"
            @update:model-value="emit('updateInput', { weaponType: $event })"
          />
        </div>
        <div class="grid gap-2">
          <Label class="text-muted-foreground" for="custom-yi">意念</Label>
          <WikiNumberInput id="custom-yi" :model-value="input.yi" min="0" max="10" @update:model-value="emit('updateInput', { yi: $event })" />
        </div>
        <div class="grid gap-2">
          <Label class="text-muted-foreground" for="custom-qi">气劲</Label>
          <WikiNumberInput id="custom-qi" :model-value="input.qi" min="0" max="10" @update:model-value="emit('updateInput', { qi: $event })" />
        </div>
        <div class="grid gap-2">
          <Label class="text-muted-foreground" for="custom-xing">形态</Label>
          <WikiNumberInput id="custom-xing" :model-value="input.xing" min="0" max="10" @update:model-value="emit('updateInput', { xing: $event })" />
        </div>
        <div class="grid gap-2">
          <Label class="text-muted-foreground" for="custom-shen">神韵</Label>
          <WikiNumberInput id="custom-shen" :model-value="input.shen" min="0" max="10" @update:model-value="emit('updateInput', { shen: $event })" />
        </div>
      </div>
      <RunControls
        input-id="analysis-trials"
        label="模拟次数"
        :model-value="trials"
        step="32"
        :disabled="!canRun"
        :busy="busy"
        action-label="模拟"
        busy-label="模拟中"
        @update-model-value="emit('updateTrials', $event)"
        @run="emit('run')"
      />
    </CardContent>
  </Card>
</template>
