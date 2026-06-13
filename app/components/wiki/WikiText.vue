<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import type { WikiTextPart } from "~/lib/wiki/text";

const CharacterHoverLink = defineAsyncComponent(() => import("~/components/wiki/character/HoverLink.vue"));
const ItemHoverLink = defineAsyncComponent(() => import("~/components/wiki/item/HoverLink.vue"));
const MartialArtHoverLink = defineAsyncComponent(() => import("~/components/wiki/martial-art/HoverLink.vue"));

defineProps<{
  parts: WikiTextPart[];
}>();
</script>

<template>
  <template
    v-for="(part, index) in parts"
    :key="index"
  >
    <span v-if="part.type === 'text'">{{ part.text }}</span>
    <CharacterHoverLink
      v-else-if="part.type === 'character'"
      :id="part.id"
      :label="part.text"
    />
    <ItemHoverLink
      v-else-if="part.type === 'item'"
      :id="part.id"
      :label="part.text"
    />
    <MartialArtHoverLink
      v-else-if="part.type === 'martialArt'"
      :id="part.id"
      :label="part.text"
    />
  </template>
</template>
