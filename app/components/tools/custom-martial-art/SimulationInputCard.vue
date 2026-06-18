<script setup lang="ts">
import type { CustomMartialInput, CustomMartialOption } from "~/components/tools/custom-martial-art/types";
import RunControls from "~/components/tools/custom-martial-art/RunControls.vue";
import { Badge } from "~/components/ui/badge";
import {
  CardDescription,
  CardTitle,
} from "~/components/ui/card";
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
  isSimulating: boolean;
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
  <AppCard>
    <AppCardHeader>
      <div class="flex justify-between gap-3">
        <CardTitle>初始输入</CardTitle>
        <Badge :variant="attributesValid ? 'outline' : 'destructive'">
          {{ attributeTotal }} / {{ attributeTarget }}
        </Badge>
      </div>
      <CardDescription>
        <p v-if="status" class="text-sm text-muted-foreground">{{ status }}</p>
        <p v-else class="text-sm text-muted-foreground">生成固定种子的初始自创武学</p>
      </CardDescription>
    </AppCardHeader>
    <AppCardContent class="grid gap-4">
      <p v-if="pending" class="text-sm text-muted-foreground">读取 sqlite 数据中...</p>
      <p v-else-if="errorMessage" class="text-sm text-destructive">{{ errorMessage }}</p>
      <div class="grid gap-3 grid-cols-5">
        <AppFieldStack label="武器" label-for="custom-weapon">
          <WikiEnumSelect
            id="custom-weapon"
            :model-value="input.weaponType"
            :options="visibleWeaponOptions"
            placeholder="读取中"
            :disabled="isSimulating"
            @update:model-value="emit('updateInput', { weaponType: $event })"
          />
        </AppFieldStack>
        <AppFieldStack label="意念" label-for="custom-yi">
          <WikiNumberInput id="custom-yi" :model-value="input.yi" min="0" max="10" :disabled="isSimulating" @update:model-value="emit('updateInput', { yi: $event })" />
        </AppFieldStack>
        <AppFieldStack label="气劲" label-for="custom-qi">
          <WikiNumberInput id="custom-qi" :model-value="input.qi" min="0" max="10" :disabled="isSimulating" @update:model-value="emit('updateInput', { qi: $event })" />
        </AppFieldStack>
        <AppFieldStack label="形态" label-for="custom-xing">
          <WikiNumberInput id="custom-xing" :model-value="input.xing" min="0" max="10" :disabled="isSimulating" @update:model-value="emit('updateInput', { xing: $event })" />
        </AppFieldStack>
        <AppFieldStack label="神韵" label-for="custom-shen">
          <WikiNumberInput id="custom-shen" :model-value="input.shen" min="0" max="10" :disabled="isSimulating" @update:model-value="emit('updateInput', { shen: $event })" />
        </AppFieldStack>
      </div>
      <RunControls
        input-id="analysis-trials"
        label="模拟次数"
        :model-value="trials"
        step="32"
        :disabled="!canRun"
        :busy="isSimulating"
        action-label="模拟"
        busy-label="模拟中"
        @update-model-value="emit('updateTrials', $event)"
        @run="emit('run')"
      />
    </AppCardContent>
  </AppCard>
</template>
