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
    <UiCard>
      <UiCardHeader>
        <UiCardTitle>数据总览</UiCardTitle>
        <UiCardDescription>{{ pending ? "读取中..." : `${table || "-"}：${filteredRows.length} 行` }}</UiCardDescription>
      </UiCardHeader>
      <UiCardContent class="grid gap-4 md:grid-cols-2">
        <UiLabel class="grid gap-2">
          表
          <UiSelect v-model="table">
            <UiSelectTrigger class="w-full">
              <UiSelectValue placeholder="选择表" />
            </UiSelectTrigger>
            <UiSelectContent>
              <UiSelectItem v-for="name in data?.tables || []" :key="name" :value="name">
                {{ name }}
              </UiSelectItem>
            </UiSelectContent>
          </UiSelect>
        </UiLabel>
        <UiLabel class="grid gap-2">
          搜索
          <UiInput v-model="search" type="search" placeholder="搜索当前表" />
        </UiLabel>
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
              <UiTableHead v-for="column in columns" :key="column">{{ column }}</UiTableHead>
            </UiTableRow>
          </UiTableHeader>
          <UiTableBody>
            <UiTableRow v-for="(row, index) in filteredRows" :key="index">
              <UiTableCell v-for="column in columns" :key="column">
                {{ row[column] ?? "NULL" }}
              </UiTableCell>
            </UiTableRow>
          </UiTableBody>
        </UiTable>
      </UiCardContent>
    </UiCard>
  </main>
</template>
