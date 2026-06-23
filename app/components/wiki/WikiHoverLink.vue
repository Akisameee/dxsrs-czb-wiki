<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { CircleHelp } from "@lucide/vue";

withDefaults(defineProps<{
  mode?: "link" | "button";
  to: string;
  label: string;
  linkClass?: HTMLAttributes["class"];
  buttonLabel: string;
  triggerTabindex?: number | string;
}>(), {
  mode: "link",
  triggerTabindex: undefined,
});

const open = defineModel<boolean>("open", { default: false });
</script>

<template>
  <AppHoverCard
    v-model:open="open"
    content-class="grid w-96 max-w-[calc(100vw-2rem)] gap-3"
    :prevent-click-default="mode !== 'button'"
  >
    <template #trigger>
      <AppButton
        v-if="mode === 'button'"
        variant="ghost"
        size="icon-sm"
        :aria-label="buttonLabel"
        :tabindex="triggerTabindex"
        @click.stop
        @keydown.stop
      >
        <slot name="trigger">
          <CircleHelp />
        </slot>
      </AppButton>
      <NuxtLink
        v-else
        :to="to"
        :class="linkClass"
        :tabindex="triggerTabindex"
      >
        <slot name="trigger">{{ label }}</slot>
      </NuxtLink>
    </template>
    <slot />
  </AppHoverCard>
</template>
