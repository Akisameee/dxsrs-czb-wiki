<script setup lang="ts">
import WikiText from "~/components/wiki/WikiText.vue";
import type { WikiTextPart } from "~/lib/wiki/text";

defineProps<{
  parts: WikiTextPart[];
}>();
</script>

<template>
  <AppCard>
    <AppCardHeader>
      <CardTitle>获取方式</CardTitle>
    </AppCardHeader>
    <AppCardContent class="text-sm leading-7">
      <WikiText :parts="parts.length ? parts : [{ type: 'text', text: '-' }] " />
    </AppCardContent>
  </AppCard>
</template>
