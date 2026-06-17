<script setup lang="ts">
import { CircleHelp } from "@lucide/vue";
import type { HTMLAttributes } from "vue";
import { Badge, type BadgeVariants } from "~/components/ui/badge";
import {
  CardDescription,
  CardTitle,
} from "~/components/ui/card";
import { cn } from "~/lib/utils";

export type WikiCardBadge = {
  label: string;
  variant?: BadgeVariants["variant"];
  class?: HTMLAttributes["class"];
};

const props = withDefaults(defineProps<{
  title: string;
  description?: string;
  badges?: WikiCardBadge[];
  color?: HTMLAttributes["class"];
  tip?: string;
  role?: "link" | "button";
  disabled?: boolean;
  selected?: boolean;
  titleAttr?: string;
  onClick?: (event: MouseEvent) => void;
}>(), {
  badges: () => [],
  role: "link",
  disabled: false,
  selected: false,
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const clickable = computed(() => Boolean(props.onClick));
const cardClass = computed(() => cn(
  props.color,
  "gap-4 py-4 md:gap-6 md:py-6",
  clickable.value && "cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
  props.selected && "ring-2 ring-primary",
  props.disabled && "opacity-50",
));

function handleClick(event: MouseEvent) {
  if (props.disabled) return;
  props.onClick?.(event);
  emit("click", event);
}

function handleKeydown(event: KeyboardEvent) {
  if (!clickable.value || props.disabled) return;
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  handleClick(event as unknown as MouseEvent);
}
</script>

<template>
  <AppCard
    :class="cardClass"
    :role="clickable ? role : undefined"
    :tabindex="clickable ? 0 : undefined"
    :aria-disabled="disabled || undefined"
    :title="titleAttr || title"
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <AppCardHeader class="px-3 md:px-6">
      <div class="relative min-w-0">
        <div
          :class="cn(
            'flex min-w-0 items-start gap-2 md:gap-3',
            ($slots.action || tip || $slots.tip) && 'pr-9',
          )"
        >
          <slot name="avatar" />

          <div class="min-w-0 flex-1">
            <CardTitle class="truncate text-sm md:text-base">{{ title }}</CardTitle>
            <CardDescription
              v-if="description"
              class="truncate text-xs md:text-sm"
            >
              {{ description }}
            </CardDescription>
            <div
              v-if="$slots.badges || badges.length"
              class="mt-1 flex flex-wrap gap-1 md:mt-2 md:gap-2"
            >
              <slot name="badges" />
              <Badge
                v-for="badge in badges"
                :key="badge.label"
                :variant="badge.variant || 'outline'"
                :class="badge.class"
              >
                {{ badge.label }}
              </Badge>
            </div>
          </div>
        </div>

        <div
          v-if="$slots.action || tip || $slots.tip"
          class="absolute right-0 top-0 flex items-center gap-1"
          @click.stop
          @keydown.stop
        >
          <slot name="action" />
          <AppHoverCard
            v-if="tip || $slots.tip"
            content-class="w-72 max-w-[calc(100vw-2rem)] text-sm"
          >
            <template #trigger>
              <AppButton variant="ghost" size="icon-sm" aria-label="查看说明">
                <CircleHelp />
              </AppButton>
            </template>
            <slot name="tip">{{ tip }}</slot>
          </AppHoverCard>
        </div>
      </div>
    </AppCardHeader>

    <AppCardContent
      v-if="$slots.footer"
      class="px-3 pt-0 md:px-6"
      @click.stop
      @keydown.stop
    >
      <slot name="footer" />
    </AppCardContent>
  </AppCard>
</template>
