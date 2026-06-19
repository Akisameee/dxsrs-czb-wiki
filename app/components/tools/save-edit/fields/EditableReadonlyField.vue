<script setup lang="ts">
import EditableFieldFrame from "./EditableFieldFrame.vue";

const props = withDefaults(defineProps<{
  initialValue: string;
  modelValue: string;
  hint?: string;
  compact?: boolean;
  dirty?: boolean;
}>(), {
  hint: "",
  compact: false,
});

const dirty = computed(() => props.dirty ?? props.modelValue !== props.initialValue);
</script>

<template>
  <EditableFieldFrame
    :dirty="dirty"
    :readonly="true"
    :hint="hint"
    :compact="compact"
  >
    <div class="flex min-h-9 items-center rounded-md border bg-muted/30 px-3 py-2 text-sm break-all">
      {{ modelValue || "—" }}
    </div>
  </EditableFieldFrame>
</template>
