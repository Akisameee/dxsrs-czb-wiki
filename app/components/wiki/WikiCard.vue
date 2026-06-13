<script setup lang="ts">
import { CircleHelp } from "@lucide/vue";
import type { HTMLAttributes } from "vue";
import { Badge, type BadgeVariants } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card";
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
  <Card
    :class="cardClass"
    :role="clickable ? role : undefined"
    :tabindex="clickable ? 0 : undefined"
    :aria-disabled="disabled || undefined"
    :title="titleAttr || title"
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <CardHeader>
      <div class="flex items-start gap-3">
        <slot name="avatar" />

        <div class="min-w-0 flex-1">
          <CardTitle class="truncate text-base">{{ title }}</CardTitle>
          <CardDescription v-if="description" class="truncate">
            {{ description }}
          </CardDescription>
          <div v-if="$slots.badges || badges.length" class="mt-2 flex flex-wrap gap-2">
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

        <div
          v-if="$slots.action || tip || $slots.tip"
          class="flex shrink-0 items-center gap-1"
          @click.stop
          @keydown.stop
        >
          <slot name="action" />
          <HoverCard v-if="tip || $slots.tip">
            <HoverCardTrigger as-child>
              <Button variant="ghost" size="icon-sm" aria-label="查看说明">
                <CircleHelp />
              </Button>
            </HoverCardTrigger>
            <HoverCardContent class="w-72 max-w-[calc(100vw-2rem)] text-sm">
              <slot name="tip">{{ tip }}</slot>
            </HoverCardContent>
          </HoverCard>
        </div>
      </div>
    </CardHeader>
  </Card>
</template>
