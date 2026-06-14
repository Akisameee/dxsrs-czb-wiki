<script setup lang="ts">
import GameImage from "~/components/wiki/WikiImage.vue";
import EditableFieldFrame from "~/components/tools/save-edit/fields/EditableFieldFrame.vue";
import { lifeSkillImageId, lifeSkillLevel, type LifeSkillType } from "~/lib/wiki/life-skills";

const props = withDefaults(defineProps<{
  type: LifeSkillType;
  initialValue: string;
  modelValue: string;
  label?: string;
  disabled?: boolean;
  readonly?: boolean;
  size?: number;
}>(), {
  label: "",
  disabled: false,
  readonly: false,
  size: 20,
});

const emit = defineEmits<{
  update: [value: string];
}>();

const dirty = computed(() => props.modelValue !== props.initialValue);
const level = computed(() => lifeSkillLevel(props.modelValue));
const slots = [1, 2, 3, 4, 5];

function setLevel(value: number) {
  if (props.disabled || props.readonly) return;
  emit("update", String(lifeSkillLevel(value)));
}

function onWheel(event: WheelEvent) {
  if (props.disabled || props.readonly) return;
  event.preventDefault();
  setLevel(level.value + (event.deltaY < 0 ? 1 : -1));
}
</script>

<template>
  <EditableFieldFrame
    :dirty="dirty"
    :disabled="disabled"
    :readonly="readonly"
    @reset="emit('update', initialValue)"
  >
    <div
      class="flex h-9 justify-between items-center gap-3 rounded-md border bg-background px-2"
      @wheel="onWheel"
    >
      <span v-if="label" class="text-sm text-muted-foreground">{{ label }}</span>
      <div class="flex justify-between">
        <button
          v-for="index in slots"
          :key="index"
          type="button"
          class="inline-flex size-7 items-center justify-center rounded-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          :disabled="disabled || readonly"
          :aria-pressed="level === index"
          :aria-label="label ? `${label}${index}级` : `${index}级`"
          @click="setLevel(index)"
        >
          <GameImage
            :id="lifeSkillImageId(type, modelValue, index)"
            :alt="label ? `${label}${index}` : undefined"
            :fallback="label.slice(0, 1)"
            :size="size"
            class="rounded-none"
          />
        </button>
      </div>
    </div>
  </EditableFieldFrame>
</template>
