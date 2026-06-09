<script setup lang="ts">
import { enumLabel, enumMapFromRows } from "~/lib/utils";

useHead({ title: "人物" });

type Character = {
  id: number;
  region_id: number | null;
  location_id: number | null;
  sect_id: number;
  rarity_id: number;
  weapon_type_id: number;
  martial_type_id: number;
};

const { queryRows } = useWikiDb();
const search = ref("");

const { data, pending, error } = await useAsyncData("characters-index", async () => {
  const [characters, enumRows] = await Promise.all([
    queryRows<Character>("SELECT * FROM characters ORDER BY id"),
    queryRows<{ type: string; id: number; label: string | null }>("SELECT type, id, label FROM enums ORDER BY type, id"),
  ]);
  return { characters, enums: enumMapFromRows(enumRows) };
}, { server: false });

const enums = computed(() => data.value?.enums || {});

function characterName(item: Character) {
  return enumLabel(enums.value, "Character", item.id, `人物 ${item.id}`);
}

function locationText(item: Character) {
  if (item.region_id === null || item.location_id === null) return "无地点";
  return `${enumLabel(enums.value, "DiDian", item.region_id)} / ${enumLabel(enums.value, "Area", item.location_id)}`;
}

const rows = computed(() => {
  const keyword = search.value.trim().toLowerCase();
  return (data.value?.characters || []).filter((item) => !keyword || characterName(item).toLowerCase().includes(keyword));
});
</script>

<template>
  <main class="container mx-auto grid gap-6 p-6">
    <UiCard>
      <UiCardHeader>
        <UiCardTitle>人物</UiCardTitle>
        <UiCardDescription>{{ pending ? "读取中..." : `共 ${rows.length} 人` }}</UiCardDescription>
      </UiCardHeader>
      <UiCardContent>
        <UiInput v-model="search" type="search" placeholder="搜索人物" />
      </UiCardContent>
    </UiCard>

    <UiCard v-if="error">
      <UiCardContent class="text-destructive">{{ error.message }}</UiCardContent>
    </UiCard>

    <UiCard v-else>
      <UiCardContent class="overflow-auto">
        <UiTable>
          <UiTableHeader>
            <UiTableRow>
              <UiTableHead>名称</UiTableHead>
              <UiTableHead>地点</UiTableHead>
              <UiTableHead>门派</UiTableHead>
              <UiTableHead>资质</UiTableHead>
              <UiTableHead>武器</UiTableHead>
              <UiTableHead>路线</UiTableHead>
              <UiTableHead>操作</UiTableHead>
            </UiTableRow>
          </UiTableHeader>
          <UiTableBody>
            <UiTableRow v-for="item in rows" :key="item.id">
              <UiTableCell>{{ characterName(item) }}</UiTableCell>
              <UiTableCell>{{ locationText(item) }}</UiTableCell>
              <UiTableCell>{{ enumLabel(enums, "LianSuo_MP", item.sect_id) }}</UiTableCell>
              <UiTableCell>
                <UiBadge variant="outline">{{ enumLabel(enums, "NPC_Rare", item.rarity_id) }}</UiBadge>
              </UiTableCell>
              <UiTableCell>{{ enumLabel(enums, "BingQiType", item.weapon_type_id) }}</UiTableCell>
              <UiTableCell>{{ enumLabel(enums, "NPC_WuGongType", item.martial_type_id) }}</UiTableCell>
              <UiTableCell>
                <UiButton as-child variant="outline" size="sm">
                  <NuxtLink :to="`/characters/detail/?id=${item.id}`">详情</NuxtLink>
                </UiButton>
              </UiTableCell>
            </UiTableRow>
          </UiTableBody>
        </UiTable>
      </UiCardContent>
    </UiCard>
  </main>
</template>
