<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import GameImage from "~/components/wiki/WikiImage.vue";
import WikiCard from "~/components/wiki/WikiCard.vue";
import ItemHoverLink from "~/components/wiki/item/HoverLink.vue";
import { rarityCardClass } from "~/lib/rarity";

const props = withDefaults(defineProps<{
  id: number;
  name: string;
  imageId?: string | null;
  description?: string;
  rarityId?: number | string | null;
  role?: "link" | "button";
  selected?: boolean;
  disabled?: boolean;
  titleAttr?: string;
  actionText?: string | null;
  actionTextClass?: HTMLAttributes["class"];
  onClick?: (event: MouseEvent) => void;
}>(), {
  imageId: null,
  description: undefined,
  rarityId: null,
  role: "link",
  selected: false,
  disabled: false,
  titleAttr: undefined,
  actionText: null,
  actionTextClass: undefined,
});

const initial = computed(() => props.name.slice(0, 1));
const cardColor = computed<HTMLAttributes["class"]>(() => rarityCardClass(props.rarityId));
</script>

<template>
  <WikiCard
    :role="role"
    :title="name"
    :description="description"
    :color="cardColor"
    :selected="selected"
    :disabled="disabled"
    :title-attr="titleAttr || name"
    :on-click="onClick"
  >
    <template #avatar>
      <GameImage
        :id="imageId"
        :alt="name"
        :fallback="initial"
        :size="40"
      />
    </template>

    <template #action>
      <span
        v-if="actionText"
        :class="['text-sm text-muted-foreground tabular-nums', actionTextClass]"
      >
        {{ actionText }}
      </span>
      <ItemHoverLink :id="id" mode="button" />
    </template>
  </WikiCard>
</template>
