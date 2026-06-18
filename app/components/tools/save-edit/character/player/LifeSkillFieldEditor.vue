<script setup lang="ts">
import { useMediaQuery } from "@vueuse/core";
import GameImage from "~/components/wiki/WikiImage.vue";
import EditableFieldFrame from "~/components/tools/save-edit/fields/EditableFieldFrame.vue";
import { lifeSkillIconSize, lifeSkillIconSizeKey, lifeSkillImageId, lifeSkillLevel, type LifeSkillIconSize, type LifeSkillIconSizeValue, type LifeSkillType } from "~/lib/wiki/life-skills";

const props = withDefaults(defineProps<{
  type: LifeSkillType;
  initialValue: string;
  modelValue: string;
  label?: string;
  disabled?: boolean;
  readonly?: boolean;
  size?: LifeSkillIconSizeValue;
}>(), {
  label: "",
  disabled: false,
  readonly: false,
});

const emit = defineEmits<{
  update: [value: string];
}>();

const dirty = computed(() => props.modelValue !== props.initialValue);
const level = computed(() => lifeSkillLevel(props.modelValue));
const slots = [1, 2, 3, 4, 5];
const isSm = useMediaQuery("(min-width: 640px)");
const isLg = useMediaQuery("(min-width: 1024px)");
const autoSize = computed<LifeSkillIconSize>(() => {
  if (isLg.value) return "lg";
  if (isSm.value) return "md";
  return "sm";
});
const resolvedSize = computed(() => props.size ?? autoSize.value);
const iconSize = computed(() => lifeSkillIconSize(resolvedSize.value));
const sizeKey = computed(() => lifeSkillIconSizeKey(resolvedSize.value));
const frameClass = computed(() => ({
  sm: "h-8 gap-2 px-2",
  md: "h-9 gap-3 px-2",
  lg: "h-10 gap-3 px-2.5",
}[sizeKey.value]));
const buttonClass = computed(() => ({
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
}[sizeKey.value]));

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
      :class="[
        'flex min-w-0 items-center rounded-md border bg-background',
        frameClass,
      ]"
      @wheel="onWheel"
    >
      <span v-if="label" class="shrink-0 whitespace-nowrap text-sm text-muted-foreground">{{ label }}</span>
      <div class="ml-auto flex shrink-0 items-center gap-1 md:gap-2 xl:gap-3">
        <button
          v-for="index in slots"
          :key="index"
          type="button"
          :class="[
            'inline-flex items-center justify-center rounded-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
            buttonClass,
          ]"
          :disabled="disabled || readonly"
          :aria-pressed="level === index"
          :aria-label="label ? `${label}${index}级` : `${index}级`"
          @click="setLevel(index)"
        >
          <GameImage
            :id="lifeSkillImageId(type, modelValue, index)"
            :alt="label ? `${label}${index}` : undefined"
            :fallback="label.slice(0, 1)"
            :size="iconSize"
            class="rounded-none"
          />
        </button>
      </div>
    </div>
  </EditableFieldFrame>
</template>
