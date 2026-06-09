<script setup lang="ts">
import { enumLabel, enumMapFromRows } from "~/lib/utils";

useHead({ title: "武学" });

type MartialArt = {
  id: number;
  sect_id: number;
  type_id: number;
  rarity_id: number;
  power: number | null;
  cost: number | null;
  style_ids: number[];
};

const { queryRows } = useWikiDb();
const search = ref("");

const { data, pending, error } = await useAsyncData("martial-arts-index", async () => {
  const [arts, styles, enumRows] = await Promise.all([
    queryRows<Omit<MartialArt, "style_ids">>("SELECT * FROM martial_arts ORDER BY id"),
    queryRows<{ martial_art_id: number; style_id: number }>("SELECT martial_art_id, style_id FROM martial_art_styles ORDER BY martial_art_id, slot"),
    queryRows<{ type: string; id: number; label: string | null }>("SELECT type, id, label FROM enums ORDER BY type, id"),
  ]);
  const styleMap = new Map<number, number[]>();
  for (const row of styles) {
    styleMap.set(Number(row.martial_art_id), [...(styleMap.get(Number(row.martial_art_id)) || []), Number(row.style_id)]);
  }
  return {
    enums: enumMapFromRows(enumRows),
    arts: arts.map((item) => ({ ...item, style_ids: styleMap.get(Number(item.id)) || [] })),
  };
}, { server: false });

const enums = computed(() => data.value?.enums || {});

function artName(item: MartialArt) {
  return enumLabel(enums.value, "MartialArt", item.id, `武学 ${item.id}`);
}

const rows = computed(() => {
  const keyword = search.value.trim().toLowerCase();
  return (data.value?.arts || []).filter((item) => !keyword || artName(item).toLowerCase().includes(keyword));
});
</script>

<template>
  <main class="container mx-auto grid gap-6 p-6">
    <UiCard>
      <UiCardHeader>
        <UiCardTitle>武学</UiCardTitle>
        <UiCardDescription>{{ pending ? "读取中..." : `共 ${rows.length} 门武学` }}</UiCardDescription>
      </UiCardHeader>
      <UiCardContent>
        <UiInput v-model="search" type="search" placeholder="搜索武学" />
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
              <UiTableHead>类型</UiTableHead>
              <UiTableHead>稀有度</UiTableHead>
              <UiTableHead>门派</UiTableHead>
              <UiTableHead>风格</UiTableHead>
              <UiTableHead>威力</UiTableHead>
              <UiTableHead>真气</UiTableHead>
              <UiTableHead>操作</UiTableHead>
            </UiTableRow>
          </UiTableHeader>
          <UiTableBody>
            <UiTableRow v-for="item in rows" :key="item.id">
              <UiTableCell>{{ artName(item) }}</UiTableCell>
              <UiTableCell>{{ enumLabel(enums, "BingQiType", item.type_id) }}</UiTableCell>
              <UiTableCell>
                <UiBadge variant="outline">{{ enumLabel(enums, "WuGongRare", item.rarity_id) }}</UiBadge>
              </UiTableCell>
              <UiTableCell>{{ enumLabel(enums, "LianSuo_MP", item.sect_id) }}</UiTableCell>
              <UiTableCell>{{ item.style_ids.map((styleId) => enumLabel(enums, "LianSuo_FG", styleId)).join("、") || "-" }}</UiTableCell>
              <UiTableCell>{{ item.power ?? "-" }}</UiTableCell>
              <UiTableCell>{{ item.cost ?? "-" }}</UiTableCell>
              <UiTableCell>
                <UiButton as-child variant="outline" size="sm">
                  <NuxtLink :to="`/martial-arts/detail/?id=${item.id}`">详情</NuxtLink>
                </UiButton>
              </UiTableCell>
            </UiTableRow>
          </UiTableBody>
        </UiTable>
      </UiCardContent>
    </UiCard>
  </main>
</template>
