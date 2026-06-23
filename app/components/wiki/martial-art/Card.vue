<script setup lang="ts">
import { useMediaQuery } from "@vueuse/core";
import type { HTMLAttributes } from "vue";
import { Badge } from "~/components/ui/badge";
import { rarityCardClass } from "~/lib/rarity";
import MartialArtHoverLink from "~/components/wiki/martial-art/HoverLink.vue";
import MartialArtIcon from "~/components/wiki/martial-art/MartialArtIcon.vue";
import SectHoverLink from "~/components/wiki/sect/HoverLink.vue";
import StyleHoverLink from "~/components/wiki/style/HoverLink.vue";
import WikiCard from "~/components/wiki/WikiCard.vue";

export type MartialArtCardStyle = {
  id: number | string | null | undefined;
  label: string;
};

const props = withDefaults(defineProps<{
  id: number;
  name: string;
  type: string;
  typeId?: number | string | null;
  rarityId?: number | string | null;
  rarityToneId?: number | string | null;
  sectId?: number | string | null;
  sectLabel?: string;
  styles?: MartialArtCardStyle[];
  role?: "link" | "button";
  selected?: boolean;
  disabled?: boolean;
  titleAttr?: string;
  interactiveBadges?: boolean;
  onClick?: (event: MouseEvent) => void;
}>(), {
  styles: () => [],
  role: "link",
  selected: false,
  disabled: false,
  interactiveBadges: true,
});

const cardColor = computed<HTMLAttributes["class"]>(() => rarityCardClass(props.rarityToneId));
const styleItems = computed(() => props.styles.filter((style) => style.label));
const isSm = useMediaQuery("(min-width: 640px)");
const isLg = useMediaQuery("(min-width: 1024px)");
const isXl = useMediaQuery("(min-width: 1280px)");
const iconSize = computed(() => {
  if (isXl.value) return 48;
  if (isLg.value) return 44;
  if (isSm.value) return 40;
  return 34;
});
</script>

<template>
  <WikiCard
    :role="role"
    :title="name"
    :description="type"
    :color="cardColor"
    :selected="selected"
    :disabled="disabled"
    :title-attr="titleAttr || name"
    :on-click="onClick"
  >
    <template #avatar>
      <MartialArtIcon
        :name="name"
        :type-id="typeId"
        :rarity-id="rarityId"
        :size="iconSize"
      />
    </template>

    <template #action>
      <slot name="action">
        <MartialArtHoverLink :id="id" mode="button" />
      </slot>
    </template>

    <template #badges>
      <slot name="badges">
        <div
          v-if="interactiveBadges"
          class="flex flex-wrap gap-2"
          @click.stop
          @keydown.stop
        >
          <SectHoverLink :id="sectId" :label="sectLabel || '无门派'" />
          <StyleHoverLink v-for="style in styleItems" :key="`${style.id}-${style.label}`" :id="style.id" :label="style.label" />
        </div>
        <div v-else class="flex flex-wrap gap-2">
          <Badge variant="outline">{{ sectLabel || "无门派" }}</Badge>
          <Badge
            v-for="style in styleItems"
            :key="`${style.id}-${style.label}`"
            variant="outline"
          >
            {{ style.label }}
          </Badge>
        </div>
      </slot>
    </template>
  </WikiCard>
</template>
