<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import type { WikiTextPart } from "~/lib/wiki/text";

const CharacterHoverLink = defineAsyncComponent(() => import("~/components/wiki-summary/character/HoverLink.vue"));

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
    <NuxtLink
      v-else-if="part.type === 'item'"
      :to="`/items/detail/?id=${part.id}`"
      class="font-medium underline-offset-4 hover:underline"
    >
      {{ part.text }}
    </NuxtLink>
  </template>
</template>
