<script setup lang="ts">
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import ItemHoverLink from "~/components/wiki/item/HoverLink.vue";
import MartialArtHoverLink from "~/components/wiki/martial-art/HoverLink.vue";

const props = defineProps<{
  kind?: "item" | "martial-art";
  id?: number | string | null;
  title: string;
  legacyName?: string;
  uid?: string;
  description?: string;
}>();

const hasEntity = computed(() => props.id !== null && props.id !== undefined);
</script>

<template>
  <DialogHeader>
    <DialogTitle class="flex items-center gap-1.5">
      <template v-if="kind === 'item' && hasEntity">
        <ItemHoverLink :id="id" :label="title" />
        <ItemHoverLink :id="id" mode="button" trigger-tabindex="-1" />
      </template>
      <template v-else-if="kind === 'martial-art' && hasEntity">
        <MartialArtHoverLink :id="id" :label="title" />
        <MartialArtHoverLink :id="id" mode="button" trigger-tabindex="-1" />
      </template>
      <span v-else>{{ title }}</span>
    </DialogTitle>
    <DialogDescription v-if="description || legacyName || uid !== undefined">
      <template v-if="description">{{ description }}</template>
      <template v-else>
        <span v-if="legacyName && legacyName !== title">存档：{{ legacyName }}，</span>
        UID：{{ uid || "-" }}
      </template>
    </DialogDescription>
  </DialogHeader>
</template>
