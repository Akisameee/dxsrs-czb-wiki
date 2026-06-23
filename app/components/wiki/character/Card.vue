<script setup lang="ts">
import { useMediaQuery } from "@vueuse/core";
import type { HTMLAttributes } from "vue";
import { Badge } from "~/components/ui/badge";
import CharacterHoverLink from "~/components/wiki/character/HoverLink.vue";
import CharacterPortrait, { type CharacterPortraitIds } from "~/components/wiki/character/CharacterPortrait.vue";
import SectHoverLink from "~/components/wiki/sect/HoverLink.vue";
import WikiCard from "~/components/wiki/WikiCard.vue";
import { rarityCardClass } from "~/lib/rarity";

const props = withDefaults(defineProps<{
  id?: number | string | null;
  name: string;
  description?: string;
  portrait?: string | null;
  rarityId?: number | string | null;
  sectId?: number | string | null;
  sectLabel: string;
  weaponType: string;
  role?: "link" | "button";
  selected?: boolean;
  disabled?: boolean;
  titleAttr?: string;
  interactiveBadges?: boolean;
  onClick?: (event: MouseEvent) => void;
}>(), {
  id: null,
  description: undefined,
  portrait: null,
  rarityId: null,
  sectId: null,
  role: "link",
  selected: false,
  disabled: false,
  titleAttr: undefined,
  interactiveBadges: true,
});

const initial = computed(() => props.name.slice(0, 1));
const cardColor = computed<HTMLAttributes["class"]>(() => rarityCardClass(props.rarityId));
const portraitIds = computed<CharacterPortraitIds>(() => ({
  characterId: props.id,
  portrait: props.portrait,
}));
const hasCharacterId = computed(() => props.id !== null && props.id !== undefined);
const isSm = useMediaQuery("(min-width: 640px)");
const isLg = useMediaQuery("(min-width: 1024px)");
const isXl = useMediaQuery("(min-width: 1280px)");
const portraitSize = computed(() => {
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
    :description="description"
    :color="cardColor"
    :selected="selected"
    :disabled="disabled"
    :title-attr="titleAttr || name"
    :on-click="onClick"
  >
    <template #avatar>
      <CharacterPortrait
        :ids="portraitIds"
        :fallback="initial"
        :size="portraitSize"
      />
    </template>

    <template #action>
      <slot name="action">
        <CharacterHoverLink v-if="hasCharacterId" :id="id" mode="button" />
      </slot>
    </template>

    <template #badges>
      <div
        v-if="interactiveBadges"
        class="flex flex-wrap gap-2"
        @click.stop
        @keydown.stop
      >
        <SectHoverLink :id="sectId" :label="sectLabel" />
        <Badge variant="secondary">{{ weaponType }}</Badge>
      </div>
      <div v-else class="flex flex-wrap gap-2">
        <Badge variant="outline">{{ sectLabel }}</Badge>
        <Badge variant="secondary">{{ weaponType }}</Badge>
      </div>
    </template>
  </WikiCard>
</template>
