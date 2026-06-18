<script setup lang="ts">
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Select,
  SelectItem,
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
} from "~/lib/save-edit";
import type { BgDatabaseField, BgDatabaseValue } from "~/lib/save-edit";
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
const pageSize = 20;

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
const enumOptionsByField = computed(() => {
  const result = new Map<string, ReturnType<typeof saveEditEnumOptions>>();
  for (const field of parsedFields.value) {
    const options = saveEditEnumOptions(props.enums, table.value.name, field.name);
    if (options.length) result.set(field.name, options);
  }
  return result;
});

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
  return enumOptionsByField.value.get(field.name) || [];
}

function selectValue(event: Event) {
  return String((event.target as HTMLSelectElement).value);
}
</script>

<template>
  <AppCard>
    <AppCardHeader>
      <CardTitle>数据表编辑</CardTitle>
      <CardDescription>{{ saveEditCharacterName(save, draft) }}：{{ table.name }}：{{ totalRows }} 行</CardDescription>
    </AppCardHeader>
    <AppCardContent class="grid gap-4 grid-cols-2">
      <AppFieldStack label="表">
        <Select :model-value="String(selectedTableIndex)" @update:model-value="setTable">
          <AppSelectTrigger class="w-full">
            <SelectValue placeholder="选择数据表" />
          </AppSelectTrigger>
          <AppSelectContent>
            <SelectItem
              v-for="(item, index) in save.tables"
              :key="item.name"
              :value="String(index)"
            >
              {{ item.name }} · {{ item.rowCount }} 行
            </SelectItem>
          </AppSelectContent>
        </Select>
      </AppFieldStack>

      <AppFieldStack label="搜索">
        <AppInput v-model="search" type="search" placeholder="搜索当前表" />
      </AppFieldStack>
    </AppCardContent>
  </AppCard>

  <AppCard>
    <AppCardContent class="grid gap-4">
      <AppPagination
        v-model:page="page"
        :total="totalRows"
        :page-size="pageSize"
      />

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
                  <select
                    v-if="enumOptions(field).length"
                    class="h-8 w-36 rounded-md border border-input bg-background px-2 text-sm"
                    :value="formatSaveValue(cellValue(field, rowIndex))"
                    @change="updateCell(field, rowIndex, selectValue($event))"
                  >
                    <option
                      v-for="option in enumOptions(field)"
                      :key="option.id"
                      :value="option.id"
                    >
                      {{ option.label }}
                    </option>
                  </select>
                  <AppInput
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
    </AppCardContent>
  </AppCard>
</template>
