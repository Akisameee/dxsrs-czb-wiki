<script setup lang="ts">
import { RotateCcw } from "@lucide/vue";
import {
  CardDescription,
  CardTitle,
} from "~/components/ui/card";
import EditableStringListField from "~/components/tools/save-edit/fields/EditableStringListField.vue";

const props = defineProps<{
  events: string[];
  initialEvents: string[];
}>();

const emit = defineEmits<{
  updateEvents: [value: string[]];
  reset: [];
}>();

const dirty = computed(() => JSON.stringify(props.events) !== JSON.stringify(props.initialEvents));
</script>

<template>
  <AppCard>
    <AppCardHeader class="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
      <div class="grid gap-1">
        <CardTitle>事件列表</CardTitle>
        <CardDescription>这些值是游戏已经触发过的统计事件标记，保存后会写回埋点 ES2 小存档</CardDescription>
      </div>

      <AppButton
        v-if="dirty"
        type="button"
        variant="ghost"
        size="icon"
        class="size-6 rounded-full border bg-background text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground"
        @click="emit('reset')"
      >
        <RotateCcw class="size-3.5" />
        <span class="sr-only">重置所有修改</span>
      </AppButton>
    </AppCardHeader>

    <AppCardContent>
      <EditableStringListField
        :initial-value="initialEvents"
        :model-value="events"
        @update="emit('updateEvents', $event)"
      />
    </AppCardContent>
  </AppCard>
</template>
