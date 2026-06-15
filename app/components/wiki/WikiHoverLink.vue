<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { CircleHelp } from "@lucide/vue";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card";

withDefaults(defineProps<{
  mode?: "link" | "button";
  to: string;
  label: string;
  linkClass?: HTMLAttributes["class"];
  buttonLabel: string;
}>(), {
  mode: "link",
});

const open = defineModel<boolean>("open", { default: false });
</script>

<template>
  <HoverCard v-model:open="open">
    <HoverCardTrigger as-child>
      <AppButton
        v-if="mode === 'button'"
        variant="ghost"
        size="icon-sm"
        :aria-label="buttonLabel"
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
      >
        <slot name="trigger">{{ label }}</slot>
      </NuxtLink>
    </HoverCardTrigger>
    <HoverCardContent class="grid w-96 max-w-[calc(100vw-2rem)] gap-3">
      <slot />
    </HoverCardContent>
  </HoverCard>
</template>
