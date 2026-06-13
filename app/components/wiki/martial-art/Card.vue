<script setup lang="ts">
import type { HTMLAttributes } from "vue";
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
  sectLabel: string;
  styles?: MartialArtCardStyle[];
  role?: "link" | "button";
  selected?: boolean;
  disabled?: boolean;
  titleAttr?: string;
  onClick?: (event: MouseEvent) => void;
}>(), {
  styles: () => [],
  role: "link",
  selected: false,
  disabled: false,
});

const cardColor = computed<HTMLAttributes["class"]>(() => rarityCardClass(props.rarityToneId));
const styleItems = computed(() => props.styles.filter((style) => style.label));
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
        :size="40"
      />
    </template>

    <template #action>
      <MartialArtHoverLink :id="id" mode="button" />
    </template>

    <template #badges>
      <div class="flex flex-wrap gap-2" @click.stop @keydown.stop>
        <SectHoverLink
          :id="sectId"
          :label="sectLabel"
        />
        <StyleHoverLink
          v-for="style in styleItems"
          :key="`${style.id}-${style.label}`"
          :id="style.id"
          :label="style.label"
        />
      </div>
    </template>
  </WikiCard>
</template>
