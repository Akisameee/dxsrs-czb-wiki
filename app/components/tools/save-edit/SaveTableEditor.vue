<script setup lang="ts">
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import WikiEnumSelect from "~/components/wiki/WikiEnumSelect.vue";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  fieldDraftKey,
  formatSaveValue,
  isEditableSaveValue,
  saveEditEnumOptions,
  saveEditCharacterName,
  type SaveEditDraft,
  type SaveEditFile,
} from "./model";
import type { BgDatabaseField, BgDatabaseValue } from "~/lib/bgdatabase";
import type { WikiEnums } from "~/lib/wiki/text";

const props = defineProps<{
  save: SaveEditFile;
  draft: SaveEditDraft;
  enums?: WikiEnums;
  selectedTableIndex: number;
}>();

const emit = defineEmits<{
  updateTable: [tableIndex: number];
  updateCell: [key: string, value: string];
}>();

const page = ref(1);
const search = ref("");
const pageSize = 50;

const table = computed(() => props.save.tables[props.selectedTableIndex] ?? props.save.zhuJue);
const parsedFields = computed(() =>
  table.value.fieldNames
    .map((name) => table.value.fields[name])
    .filter((field): field is BgDatabaseField => Boolean(field?.parsed)),
);
const filteredRowIndexes = computed(() => {
  const query = search.value.trim().toLowerCase();
  const rows = Array.from({ length: table.value.rowCount }, (_, index) => index);
  if (!query) return rows;
  return rows.filter((rowIndex) =>
    parsedFields.value.some((field) => formatSaveValue(cellValue(field, rowIndex)).toLowerCase().includes(query)),
  );
});
const totalRows = computed(() => filteredRowIndexes.value.length);
const pageCount = computed(() => Math.max(1, Math.ceil(totalRows.value / pageSize)));
const rowIndexes = computed(() => {
  const start = (page.value - 1) * pageSize;
  return filteredRowIndexes.value.slice(start, start + pageSize);
});
const parsedFieldCount = computed(() => parsedFields.value.length);

watch(
  () => props.selectedTableIndex,
  () => {
    page.value = 1;
    search.value = "";
  },
);

watch(search, () => {
  page.value = 1;
});

watch(pageCount, (count) => {
  if (page.value > count) page.value = count;
});

function setTable(value: unknown) {
  emit("updateTable", Number(value));
}

function cellValue(field: BgDatabaseField, rowIndex: number): BgDatabaseValue {
  const key = fieldDraftKey(field, rowIndex);
  return props.draft[key] ?? field.values[rowIndex] ?? null;
}

function updateCell(field: BgDatabaseField, rowIndex: number, value: string) {
  emit("updateCell", fieldDraftKey(field, rowIndex), value);
}

function enumOptions(field: BgDatabaseField) {
  return saveEditEnumOptions(props.enums, table.value.name, field.name);
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>数据表编辑</CardTitle>
      <CardDescription>{{ saveEditCharacterName(save, draft) }}：{{ table.name }}：{{ totalRows }} 行</CardDescription>
    </CardHeader>
    <CardContent class="grid gap-4 md:grid-cols-2">
      <Label class="grid gap-2">
        表
        <Select :model-value="String(selectedTableIndex)" @update:model-value="setTable">
          <SelectTrigger class="w-full">
            <SelectValue placeholder="选择数据表" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="(item, index) in save.tables"
              :key="item.name"
              :value="String(index)"
            >
              {{ item.name }} · {{ item.rowCount }} 行
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

  <Card>
    <CardContent class="grid gap-4">
      <Pagination
        v-slot="{ page: currentPage }"
        v-model:page="page"
        :items-per-page="pageSize"
        :sibling-count="1"
        :total="totalRows"
        show-edges
      >
        <PaginationContent v-slot="{ items }">
          <PaginationFirst />
          <PaginationPrevious />
          <template v-for="(item, index) in items" :key="index">
            <PaginationItem
              v-if="item.type === 'page'"
              :is-active="item.value === currentPage"
              :value="item.value"
            >
              {{ item.value }}
            </PaginationItem>
            <PaginationEllipsis v-else />
          </template>
          <PaginationNext />
          <PaginationLast />
        </PaginationContent>
      </Pagination>

      <div class="text-sm text-muted-foreground">
        {{ table.name }}：{{ table.rowCount }} 行，{{ parsedFieldCount }} / {{ table.fieldCount }} 字段可读
      </div>

      <div v-if="!totalRows || !parsedFields.length" class="rounded-md border px-3 py-8 text-center text-sm text-muted-foreground">
        当前表没有可编辑行
      </div>

      <div v-else class="overflow-auto">
        <div class="min-w-max rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="w-20">#</TableHead>
                <TableHead
                  v-for="field in parsedFields"
                  :key="field.name"
                  class="w-40"
                >
                  <div class="grid gap-1">
                    <span>{{ field.name }}</span>
                    <span class="text-xs font-normal text-muted-foreground">{{ field.fieldType }}</span>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="rowIndex in rowIndexes" :key="rowIndex">
                <TableCell class="font-medium tabular-nums">
                  {{ rowIndex }}
                </TableCell>
                <TableCell
                  v-for="field in parsedFields"
                  :key="field.name"
                  class="align-top"
                >
                  <WikiEnumSelect
                    v-if="enumOptions(field).length"
                    :model-value="formatSaveValue(cellValue(field, rowIndex))"
                    :options="enumOptions(field)"
                    @update:model-value="updateCell(field, rowIndex, $event)"
                  />
                  <Input
                    v-else-if="isEditableSaveValue(cellValue(field, rowIndex))"
                    class="h-8 w-36"
                    :model-value="formatSaveValue(cellValue(field, rowIndex))"
                    @update:model-value="updateCell(field, rowIndex, String($event))"
                  />
                  <div
                    v-else
                    class="h-8 w-36 truncate rounded-md border bg-muted px-2 py-1 text-sm text-muted-foreground"
                    :title="formatSaveValue(cellValue(field, rowIndex))"
                  >
                    {{ formatSaveValue(cellValue(field, rowIndex)) }}
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
