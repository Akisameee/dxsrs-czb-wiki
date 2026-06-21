<script setup lang="ts">
import LifeSkillRankImages from "~/components/wiki/character/LifeSkillRankImages.vue";
import type { CharacterDetailRow } from "~/composables/useCharacterData";
import type { LifeSkillType } from "~/lib/wiki/character/life-skills";

const props = defineProps<{
  character: CharacterDetailRow;
}>();

const lifeSkills = computed(() => [
  { label: "挖矿", type: "mining", value: props.character.mining },
  { label: "采药", type: "herbGathering", value: props.character.herb_gathering },
  { label: "打猎", type: "hunting", value: props.character.hunting },
  { label: "锻造", type: "forging", value: props.character.forging },
  { label: "炼丹", type: "alchemy", value: props.character.alchemy },
  { label: "裁缝", type: "sewing", value: props.character.sewing },
] satisfies Array<{ label: string; type: LifeSkillType; value: number | null | undefined }>);
</script>

<template>
  <AppCard>
    <AppCardHeader>
      <CardTitle>生活技艺</CardTitle>
    </AppCardHeader>
    <AppCardContent class="grid gap-3 grid-cols-2">
      <div
        v-for="skill in lifeSkills"
        :key="skill.label"
        class="flex items-center justify-between rounded-md border px-3 py-2"
      >
        <span>{{ skill.label }}</span>
        <LifeSkillRankImages
          :type="skill.type"
          :value="skill.value"
          :label="skill.label"
        />
      </div>
    </AppCardContent>
  </AppCard>
</template>
