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
    <Card>
      <CardHeader>
        <CardTitle>道具</CardTitle>
        <CardDescription>{{ pending ? "读取中..." : `共 ${rows.length} 个道具` }}</CardDescription>
      </CardHeader>
      <CardContent>
        <Input v-model="search" type="search" placeholder="搜索道具" />
      </CardContent>
    </Card>

    <Card v-if="error">
      <CardContent class="text-destructive">{{ error.message }}</CardContent>
    </Card>

    <Card v-else>
      <CardContent class="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名称</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>稀有度</TableHead>
              <TableHead>材料</TableHead>
              <TableHead>说明</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="item in rows" :key="item.id">
              <TableCell>{{ itemName(item) }}</TableCell>
              <TableCell>{{ enumLabel(enums, "ItemType", item.type_id) }}</TableCell>
              <TableCell>
                <Badge variant="outline">{{ enumLabel(enums, "ItemRare", item.rarity_id) }}</Badge>
              </TableCell>
              <TableCell>{{ Number(item.is_material) ? "是" : "否" }}</TableCell>
              <TableCell>{{ item.description || "无说明" }}</TableCell>
              <TableCell>
                <Button as-child variant="outline" size="sm">
                  <NuxtLink :to="`/items/detail/?id=${item.id}`">详情</NuxtLink>
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </main>
</template>
