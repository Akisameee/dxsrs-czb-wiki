<script setup lang="ts">
useHead({ title: "数据总览" });

const { queryRows } = useWikiDb();
const table = ref("");
const search = ref("");
const currentPage = ref(1);
const pageSize = 50;

const { data, pending, error } = await useAsyncData("data-overview", async () => {
  const tables = await queryRows<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name");
  return { tables: tables.map((item) => item.name) };
}, { server: false });

watchEffect(() => {
  if (!table.value && data.value?.tables?.length) table.value = data.value.tables[0] ?? "";
});

function quoteIdentifier(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function likeClause(columns: string[]) {
  if (!search.value.trim() || !columns.length) return { sql: "", params: [] as string[] };
  const sql = columns.map((column) => `CAST(${quoteIdentifier(column)} AS TEXT) LIKE ?`).join(" OR ");
  return {
    sql: ` WHERE ${sql}`,
    params: columns.map(() => `%${search.value.trim()}%`),
  };
}

const { data: tableData } = await useAsyncData("data-table-rows", async () => {
  if (!table.value) return { rows: [], columns: [], total: 0 };

  const tableName = quoteIdentifier(table.value);
  const infoRows = await queryRows<{ name: string }>(`PRAGMA table_info(${tableName})`);
  const columns = infoRows.map((item) => item.name);
  const where = likeClause(columns);
  const offset = (currentPage.value - 1) * pageSize;

  const [countRow] = await queryRows<{ count: number }>(
    `SELECT COUNT(*) AS count FROM ${tableName}${where.sql}`,
    where.params,
  );
  const rows = await queryRows<Record<string, unknown>>(
    `SELECT * FROM ${tableName}${where.sql} LIMIT ? OFFSET ?`,
    [...where.params, pageSize, offset],
  );

  return { rows, columns, total: Number(countRow?.count || 0) };
}, { server: false, watch: [table, search, currentPage] });

const tableRows = computed(() => tableData.value?.rows || []);
const columns = computed(() => tableData.value?.columns || []);
const totalRows = computed(() => tableData.value?.total || 0);
const pageCount = computed(() => Math.max(1, Math.ceil(totalRows.value / pageSize)));

watch([table, search], () => {
  currentPage.value = 1;
});

watch(pageCount, (count) => {
  if (currentPage.value > count) currentPage.value = count;
});
</script>

<template>
  <AppPageContainer>
    <AppCard>
      <AppCardHeader>
        <CardTitle>数据总览</CardTitle>
        <CardDescription>{{ pending ? "读取中..." : `${table || "-"}：${totalRows} 行` }}</CardDescription>
      </AppCardHeader>
      <AppCardContent class="grid gap-4 grid-cols-2">
        <Label class="grid gap-2">
          表
          <Select v-model="table">
            <AppSelectTrigger class="w-full">
              <SelectValue placeholder="选择表" />
            </AppSelectTrigger>
            <AppSelectContent>
              <SelectItem v-for="name in data?.tables || []" :key="name" :value="name">
                {{ name }}
              </SelectItem>
            </AppSelectContent>
          </Select>
        </Label>
        <Label class="grid gap-2">
          搜索
          <AppInput v-model="search" type="search" placeholder="搜索当前表" />
        </Label>
      </AppCardContent>
    </AppCard>

    <AppCard v-if="error">
      <AppCardContent class="text-destructive">{{ error.message }}</AppCardContent>
    </AppCard>

    <AppCard v-else>
      <AppCardContent class="grid gap-4">
        <AppPagination
          v-model:page="currentPage"
          :total="totalRows"
          :page-size="pageSize"
        />

        <div class="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead v-for="column in columns" :key="column">{{ column }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="(row, index) in tableRows" :key="index">
              <TableCell v-for="column in columns" :key="column">
                {{ row[column] ?? "NULL" }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        </div>
      </AppCardContent>
    </AppCard>
  </AppPageContainer>
</template>
