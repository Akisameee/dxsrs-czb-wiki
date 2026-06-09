<script setup lang="ts">
import { enumLabel, enumMapFromRows } from "~/lib/utils";

useHead({ title: "道具" });

type Item = {
  id: number;
  type_id: number;
  rarity_id: number;
  is_material: number;
  description: string | null;
};

const { queryRows } = useWikiDb();
const search = ref("");

const { data, pending, error } = await useAsyncData("items-index", async () => {
  const [items, enumRows] = await Promise.all([
    queryRows<Item>("SELECT * FROM items ORDER BY id"),
    queryRows<{ type: string; id: number; label: string | null }>("SELECT type, id, label FROM enums ORDER BY type, id"),
  ]);
  return { items, enums: enumMapFromRows(enumRows) };
}, { server: false });

const enums = computed(() => data.value?.enums || {});

function itemName(item: Item) {
  return enumLabel(enums.value, "Item", item.id, `物品 ${item.id}`);
}

const rows = computed(() => {
  const keyword = search.value.trim().toLowerCase();
  return (data.value?.items || []).filter((item) => !keyword || itemName(item).toLowerCase().includes(keyword));
});
</script>

<template>
  <main class="container mx-auto grid gap-6 p-6">
    <UiCard>
      <UiCardHeader>
        <UiCardTitle>道具</UiCardTitle>
        <UiCardDescription>{{ pending ? "读取中..." : `共 ${rows.length} 个道具` }}</UiCardDescription>
      </UiCardHeader>
      <UiCardContent>
        <UiInput v-model="search" type="search" placeholder="搜索道具" />
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
              <UiTableHead>材料</UiTableHead>
              <UiTableHead>说明</UiTableHead>
              <UiTableHead>操作</UiTableHead>
            </UiTableRow>
          </UiTableHeader>
          <UiTableBody>
            <UiTableRow v-for="item in rows" :key="item.id">
              <UiTableCell>{{ itemName(item) }}</UiTableCell>
              <UiTableCell>{{ enumLabel(enums, "ItemType", item.type_id) }}</UiTableCell>
              <UiTableCell>
                <UiBadge variant="outline">{{ enumLabel(enums, "ItemRare", item.rarity_id) }}</UiBadge>
              </UiTableCell>
              <UiTableCell>{{ Number(item.is_material) ? "是" : "否" }}</UiTableCell>
              <UiTableCell>{{ item.description || "无说明" }}</UiTableCell>
              <UiTableCell>
                <UiButton as-child variant="outline" size="sm">
                  <NuxtLink :to="`/items/detail/?id=${item.id}`">详情</NuxtLink>
                </UiButton>
              </UiTableCell>
            </UiTableRow>
          </UiTableBody>
        </UiTable>
      </UiCardContent>
    </UiCard>
  </main>
</template>
