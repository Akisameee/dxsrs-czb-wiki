<script setup lang="ts">
import WikiText from "~/components/wiki/WikiText.vue";
import type { CharacterInvitationRequirementSummary } from "~/lib/wiki/character";

defineProps<{
  rows: CharacterInvitationRequirementSummary[];
}>();
</script>

<template>
  <AppCard v-if="rows.length">
    <AppCardHeader>
      <CardTitle>邀请条件</CardTitle>
    </AppCardHeader>
    <AppCardContent class="grid gap-3">
      <div
        v-for="requirement in rows"
        :key="requirement.slot"
        class="rounded-md border px-3 py-2"
      >
        <span class="text-muted-foreground">条件 {{ requirement.slot + 1 }}：</span>
        <WikiText :parts="requirement.parts" />
      </div>
    </AppCardContent>
  </AppCard>
</template>
