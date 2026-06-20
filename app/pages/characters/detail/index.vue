<script setup lang="ts">
import { rarityCardClass } from "~/lib/rarity";
import CharacterAttributeRadarCard from "~/components/wiki/character/detail/CharacterAttributeRadarCard.vue";
import CharacterBasicInfoCard from "~/components/wiki/character/detail/CharacterBasicInfoCard.vue";
import CharacterItemsCard from "~/components/wiki/character/detail/CharacterItemsCard.vue";
import CharacterInvitationRequirementsCard from "~/components/wiki/character/detail/CharacterInvitationRequirementsCard.vue";
import CharacterLifeSkillsCard from "~/components/wiki/character/detail/CharacterLifeSkillsCard.vue";
import CharacterMartialArtsCard from "~/components/wiki/character/detail/CharacterMartialArtsCard.vue";
import CharacterQuestsCard from "~/components/wiki/character/detail/CharacterQuestsCard.vue";
import CharacterShopCard from "~/components/wiki/character/detail/CharacterShopCard.vue";
import CharacterWeaponCultivationsCard from "~/components/wiki/character/detail/CharacterWeaponCultivationsCard.vue";
import WikiDetailHeaderCard from "~/components/wiki/WikiDetailHeaderCard.vue";
import {
  characterLocationText,
  characterName,
} from "~/lib/wiki/character";
import {
  loadCharacterMartialArtCards,
  type CharacterMartialArtCard,
} from "~/lib/wiki/character-martial-arts";
import { useMartialArtData } from "~/composables/useMartialArtData";
import {
  useCharacterData,
  type CharacterDetailData,
} from "~/composables/useCharacterData";

useHead({ title: "人物详情" });

const route = useRoute();
const { loadCharacterDetail } = useCharacterData();
const { loadMartialArtDetail } = useMartialArtData();
type CharacterDetailPageData = CharacterDetailData & {
  martialArtCards: CharacterMartialArtCard[];
  martialArtPoolCards: CharacterMartialArtCard[];
};

const characterId = computed(() => Number(route.query.id));

const { data, pending, error } = useLazyAsyncData<CharacterDetailPageData>(
  () => `characters-detail-${route.query.id || "empty"}`,
  async (): Promise<CharacterDetailPageData> => {
    const id = Number(route.query.id);
    if (!Number.isFinite(id)) {
      return {
        character: null,
        defaultEquipment: null,
        defaultEquipmentItems: { weapon: null, armor: null },
        shopItems: [],
        martialArts: [],
        martialArtCards: [],
        martialArtPool: [],
        martialArtPoolCards: [],
        yearlyPurchaseItems: [],
        inventoryPresets: [],
        quests: [],
        questTargets: [],
        invitationRequirements: [],
        invitationRequirementSummaries: [],
        enums: {},
      };
    }

    const detail = await loadCharacterDetail(id);
    const [martialArtCards, martialArtPoolCards] = await Promise.all([
      loadCharacterMartialArtCards(detail.martialArts, detail.enums, loadMartialArtDetail),
      loadCharacterMartialArtCards(detail.martialArtPool, detail.enums, loadMartialArtDetail),
    ]);

    return {
      ...detail,
      martialArtCards,
      martialArtPoolCards,
    };
  },
  { server: false, watch: [characterId] },
);

const character = computed(() => data.value?.character || null);
const defaultEquipment = computed(() => data.value?.defaultEquipment || null);
const defaultEquipmentItems = computed(() => data.value?.defaultEquipmentItems || { weapon: null, armor: null });
const shopItems = computed(() => data.value?.shopItems || []);
const martialArtCards = computed(() => data.value?.martialArtCards || []);
const martialArtPoolCards = computed(() => data.value?.martialArtPoolCards || []);
const yearlyPurchaseItems = computed(() => data.value?.yearlyPurchaseItems || []);
const inventoryPresets = computed(() => data.value?.inventoryPresets || []);
const invitationRequirementSummaries = computed(() => data.value?.invitationRequirementSummaries || []);
const quests = computed(() => data.value?.quests || []);
const questTargets = computed(() => data.value?.questTargets || []);
const enums = computed(() => data.value?.enums || {});
</script>

<template>
  <AppPageContainer>
    <AppCard v-if="error">
      <AppCardContent class="text-destructive">{{ error.message }}</AppCardContent>
    </AppCard>

    <AppCard v-else-if="pending">
      <AppCardHeader>
        <CardTitle>人物详情</CardTitle>
        <CardDescription>读取中...</CardDescription>
      </AppCardHeader>
    </AppCard>

    <AppCard v-else-if="!character">
      <AppCardHeader>
        <CardTitle>人物详情</CardTitle>
        <CardDescription>没有找到 id: {{ route.query.id || "-" }}</CardDescription>
      </AppCardHeader>
    </AppCard>

    <template v-else>
      <WikiDetailHeaderCard
        :title="characterName(character)"
        :description="characterLocationText(character, enums)"
        :color-class="rarityCardClass(character.rarity_id)"
      />

      <div class="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(320px,2fr)]">
        <CharacterBasicInfoCard
          :character="character"
          :default-equipment="defaultEquipment"
          :enums="enums"
        />

        <CharacterAttributeRadarCard :character="character" />
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <CharacterWeaponCultivationsCard :character="character" />
        <CharacterLifeSkillsCard :character="character" />
      </div>

      <CharacterInvitationRequirementsCard :rows="invitationRequirementSummaries" />

      <CharacterQuestsCard
        :quests="quests"
        :quest-targets="questTargets"
        :enums="enums"
      />

      <CharacterMartialArtsCard
        v-if="!shopItems.length"
        :initial-cards="martialArtCards"
        :all-cards="martialArtPoolCards"
      />

      <CharacterShopCard
        v-if="shopItems.length"
        :shop-items="shopItems"
        :enums="enums"
      />
      <CharacterItemsCard
        v-else
        :default-equipment-items="defaultEquipmentItems"
        :inventory-presets="inventoryPresets"
        :yearly-purchase-items="yearlyPurchaseItems"
        :enums="enums"
      />
    </template>
  </AppPageContainer>
</template>
