<script setup lang="ts">
import SaveEditResetButton from "~/components/tools/save-edit/SaveEditResetButton.vue";
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

      <SaveEditResetButton
        v-if="dirty"
        @click="emit('reset')"
      />
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
