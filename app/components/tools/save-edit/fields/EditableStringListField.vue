<script setup lang="ts">
import { PlusIcon, Trash2Icon } from "@lucide/vue";
import EditableFieldFrame from "./EditableFieldFrame.vue";

const props = withDefaults(defineProps<{
  initialValue: string[];
  modelValue: string[];
  disabled?: boolean;
  readonly?: boolean;
  hint?: string;
  compact?: boolean;
}>(), {
  disabled: false,
  readonly: false,
  hint: "",
  compact: false,
});

const emit = defineEmits<{
  update: [value: string[]];
}>();

const dirty = computed(() => JSON.stringify(props.modelValue) !== JSON.stringify(props.initialValue));

function updateItem(index: number, value: string) {
  const next = [...props.modelValue];
  next[index] = value;
  emit("update", next);
}

function removeItem(index: number) {
  emit("update", props.modelValue.filter((_, itemIndex) => itemIndex !== index));
}

function addItem() {
  emit("update", [...props.modelValue, ""]);
}
</script>

<template>
  <EditableFieldFrame
    :dirty="dirty"
    :disabled="disabled"
    :readonly="readonly"
    :hint="hint"
    :compact="compact"
    @reset="emit('update', initialValue)"
  >
    <div class="grid gap-2">
      <div
        v-for="(item, index) in modelValue"
        :key="index"
        class="grid grid-cols-[minmax(0,1fr)_auto] gap-2"
      >
        <AppInput
          :model-value="item"
          :disabled="disabled"
          :readonly="readonly"
          @update:model-value="updateItem(index, String($event))"
        />
        <AppButton
          type="button"
          variant="outline"
          size="icon"
          :disabled="disabled || readonly"
          @click="removeItem(index)"
        >
          <Trash2Icon class="size-4" />
          <span class="sr-only">删除这一项</span>
        </AppButton>
      </div>

      <div v-if="!modelValue.length" class="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
        暂无条目
      </div>

      <AppButton
        type="button"
        variant="outline"
        :disabled="disabled || readonly"
        @click="addItem"
      >
        <PlusIcon class="size-4" />
        添加一项
      </AppButton>
    </div>
  </EditableFieldFrame>
</template>
