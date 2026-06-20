<script setup lang="ts">
import WikiText from "~/components/wiki/WikiText.vue";
import {
  formatQuestParts,
  type CharacterQuestRow,
  type CharacterQuestTargetRow,
  type WikiEnums,
} from "~/lib/wiki/character";

const props = defineProps<{
  quests: CharacterQuestRow[];
  questTargets: CharacterQuestTargetRow[];
  enums: WikiEnums;
}>();

const targetsByQuest = computed(() => {
  const groups = new Map<number, CharacterQuestTargetRow[]>();
  for (const target of props.questTargets) {
    const targets = groups.get(target.quest_id) || [];
    targets.push(target);
    groups.set(target.quest_id, targets);
  }
  return groups;
});

function questSummaryParts(quest: CharacterQuestRow) {
  return formatQuestParts(quest, targetsByQuest.value.get(quest.id) || [], props.enums);
}
</script>

<template>
  <AppCard v-if="quests.length">
    <AppCardHeader>
      <CardTitle>心愿任务</CardTitle>
    </AppCardHeader>
    <AppCardContent class="grid gap-3">
      <div
        v-for="quest in quests"
        :key="quest.id"
        class="flex flex-col gap-1 rounded-md border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
      >
        <span>
          <span class="text-sm text-muted-foreground">阶段 {{ quest.stage }}：</span>
          <WikiText :parts="questSummaryParts(quest)" />
        </span>
        <span class="text-sm text-muted-foreground">亲密度 {{ quest.required_affinity }}</span>
      </div>
    </AppCardContent>
  </AppCard>
</template>
