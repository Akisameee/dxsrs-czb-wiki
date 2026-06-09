<script setup lang="ts">
useHead({ title: "数据总览" });

const { queryRows } = useWikiDb();
const table = ref("");
const search = ref("");

const { data, pending, error } = await useAsyncData("data-overview", async () => {
  const tables = await queryRows<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name");
  return { tables: tables.map((item) => item.name) };
}, { server: false });

watchEffect(() => {
  if (!table.value && data.value?.tables?.length) table.value = data.value.tables[0];
});

const { data: tableRows } = await useAsyncData(`table-${table.value}`, async () => {
  if (!table.value) return [];
  return queryRows<Record<string, unknown>>(`SELECT * FROM ${table.value} LIMIT 200`);
}, { server: false, watch: [table] });

const filteredRows = computed(() => {
  const keyword = search.value.trim().toLowerCase();
  if (!keyword) return tableRows.value || [];
  return (tableRows.value || []).filter((row) => Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(keyword)));
});

const columns = computed(() => Object.keys(filteredRows.value[0] || {}));
</script>

<template>
  <main class="container mx-auto grid gap-6 p-6">
    <Card>
      <CardHeader>
        <CardTitle>数据总览</CardTitle>
        <CardDescription>{{ pending ? "读取中..." : `${table || "-"}：${filteredRows.length} 行` }}</CardDescription>
      </CardHeader>
      <CardContent class="grid gap-4 md:grid-cols-2">
        <Label class="grid gap-2">
          表
          <Select v-model="table">
            <SelectTrigger class="w-full">
              <SelectValue placeholder="选择表" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="name in data?.tables || []" :key="name" :value="name">
                {{ name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </Label>
        <Label class="grid gap-2">
          搜索
          <Input v-model="search" type="search" placeholder="搜索当前表" />
        </Label>
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
              <TableHead v-for="column in columns" :key="column">{{ column }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="(row, index) in filteredRows" :key="index">
              <TableCell v-for="column in columns" :key="column">
                {{ row[column] ?? "NULL" }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </main>
</template>
