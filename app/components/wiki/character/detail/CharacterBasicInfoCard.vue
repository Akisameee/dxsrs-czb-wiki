<script setup lang="ts">
import { enumLabel } from "~/lib/utils";
import CharacterPortrait from "~/components/wiki/character/CharacterPortrait.vue";
import ItemHoverLink from "~/components/wiki/item/HoverLink.vue";
import SectHoverLink from "~/components/wiki/sect/HoverLink.vue";
import {
  characterInitial,
  type CharacterSummaryRow,
  type WikiEnums,
} from "~/lib/wiki/character";
import type { CharacterDetailRow } from "~/composables/useCharacterData";

type CharacterDefaultEquipmentLike = {
  weaponItemId: number | null;
  armorItemId: number | null;
};

const props = defineProps<{
  character: CharacterDetailRow;
  defaultEquipment: CharacterDefaultEquipmentLike | null;
  enums: WikiEnums;
}>();

const favoriteItems = computed(() => [
  { label: "茶", value: props.character.likes_tea },
  { label: "酒", value: props.character.likes_wine },
  { label: "琴", value: props.character.likes_music },
  { label: "棋", value: props.character.likes_chess },
  { label: "书", value: props.character.likes_book },
  { label: "画", value: props.character.likes_painting },
].filter((entry) => entry.value));

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  return String(Math.round(Number(value)));
}

function label(type: string, id: number | string | null | undefined, fallback = "未知") {
  return enumLabel(props.enums, type, id, fallback);
}
</script>

<template>
  <AppCard>
    <AppCardHeader>
      <CardTitle>基础信息</CardTitle>
    </AppCardHeader>
    <AppCardContent class="grid items-start gap-6 text-sm md:grid-cols-[auto_1fr]">
      <div class="flex justify-center rounded-md">
        <CharacterPortrait
          :ids="{ characterId: character.id, portrait: character.portrait }"
          :fallback="characterInitial(character as CharacterSummaryRow)"
          :size="180"
        />
      </div>
      <div class="grid auto-rows-min content-start gap-3 text-sm grid-cols-2">
        <AppInfoRow label="门派">
          <template #default>
            <SectHoverLink
              mode="link"
              :id="character.sect_id"
              :label="character.sect_name || '无门派'"
            />
          </template>
        </AppInfoRow>
        <AppInfoRow label="地位" :value="label('DiWei', character.position_id, '地位')" />
        <AppInfoRow label="资质" :value="label('NPC_Rare', character.rarity_id, '资质')" />
        <AppInfoRow label="资历" :value="label('Dengji', character.rank_id, '资历')" />
        <AppInfoRow label="名声" :value="formatNumber(character.fame)" />
        <AppInfoRow label="侠义" :value="formatNumber(character.chivalry)" />
        <AppInfoRow label="银两" :value="formatNumber(character.gold)" />
        <AppInfoRow label="等级" :value="formatNumber(character.level)" />
        <AppInfoRow label="武器类型" :value="label('BingQiType', character.weapon_type_id)" />
        <AppInfoRow v-if="favoriteItems.length" label="偏好">
          <div class="flex flex-wrap justify-end gap-2">
            <Badge
              v-for="item in favoriteItems"
              :key="item.label"
              variant="secondary"
            >
              {{ item.label }}
            </Badge>
          </div>
        </AppInfoRow>
        <AppInfoRow label="默认武器">
          <ItemHoverLink
            v-if="defaultEquipment?.weaponItemId != null"
            :id="defaultEquipment.weaponItemId"
          />
          <span v-else>{{ character.equipment_weapon || "-" }}</span>
        </AppInfoRow>
        <AppInfoRow label="默认防具">
          <ItemHoverLink
            v-if="defaultEquipment?.armorItemId != null"
            :id="defaultEquipment.armorItemId"
          />
          <span v-else>{{ character.equipment_armor || "-" }}</span>
        </AppInfoRow>
      </div>
    </AppCardContent>
  </AppCard>
</template>
