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
    <Card>
      <CardHeader>
        <CardTitle>武学</CardTitle>
        <CardDescription>{{ pending ? "读取中..." : `共 ${rows.length} 门武学` }}</CardDescription>
      </CardHeader>
      <CardContent>
        <Input v-model="search" type="search" placeholder="搜索武学" />
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
              <TableHead>门派</TableHead>
              <TableHead>风格</TableHead>
              <TableHead>威力</TableHead>
              <TableHead>真气</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="item in rows" :key="item.id">
              <TableCell>{{ artName(item) }}</TableCell>
              <TableCell>{{ enumLabel(enums, "BingQiType", item.type_id) }}</TableCell>
              <TableCell>
                <Badge variant="outline">{{ enumLabel(enums, "WuGongRare", item.rarity_id) }}</Badge>
              </TableCell>
              <TableCell>{{ enumLabel(enums, "LianSuo_MP", item.sect_id) }}</TableCell>
              <TableCell>{{ item.style_ids.map((styleId) => enumLabel(enums, "LianSuo_FG", styleId)).join("、") || "-" }}</TableCell>
              <TableCell>{{ item.power ?? "-" }}</TableCell>
              <TableCell>{{ item.cost ?? "-" }}</TableCell>
              <TableCell>
                <Button as-child variant="outline" size="sm">
                  <NuxtLink :to="`/martial-arts/detail/?id=${item.id}`">详情</NuxtLink>
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </main>
</template>
