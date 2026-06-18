<script setup lang="ts">
import EditableTableCardHeader from "../EditableTableCardHeader.vue";
import SaveFieldEditor from "~/components/tools/save-edit/fields/SaveFieldEditor.vue";
import { Badge } from "~/components/ui/badge";
import {
  fieldDraftKey,
  formatSaveValue,
  parseFieldDraftKey,
  saveEditEnumOptions,
  type SaveEditDraft,
} from "~/lib/save-edit";
import {
  shangBingAttributeByPart,
  shangBingEffectText,
  shangBingEnumLabel,
  shangBingFieldText,
  shangBingFieldValue,
  shangBingTitle,
} from "~/lib/save-edit/injuries";
import type { BgDatabaseField, BgDatabaseTable } from "~/lib/save-edit";
import type { WikiEnums } from "~/lib/wiki/text";

const props = defineProps<{
  table: BgDatabaseTable;
  draft: SaveEditDraft;
  enums: WikiEnums;
}>();

const emit = defineEmits<{
  updateField: [field: BgDatabaseField, value: string, rowIndex: number];
}>();

const rowIndexes = computed(() => Array.from({ length: props.table.rowCount }, (_, index) => index));
const dirtyRows = computed(() => {
  const result = new Set<number>();
  for (const key of Object.keys(props.draft)) {
    const parsed = parseFieldDraftKey(key);
    if (parsed?.tableIndex === props.table.tableIndex) result.add(parsed.rowIndex);
  }
  return result;
});
const tableDirty = computed(() => dirtyRows.value.size > 0);

function field(fieldName: string) {
  return props.table.fields[fieldName];
}

function fieldText(fieldName: string, rowIndex: number) {
  return shangBingFieldText(props.table, props.draft, fieldName, rowIndex);
}

function initialFieldText(fieldName: string, rowIndex: number) {
  return formatSaveValue(field(fieldName)?.values[rowIndex]);
}

function enumOptions(fieldName: string) {
  return saveEditEnumOptions(props.enums, props.table.name, fieldName);
}

function rowTitle(rowIndex: number) {
  return shangBingTitle(props.table, props.draft, props.enums, rowIndex);
}

function rowEffectText(rowIndex: number) {
  return shangBingEffectText(props.table, props.draft, rowIndex);
}

function rowAttributeLabel(rowIndex: number) {
  return shangBingAttributeByPart(shangBingFieldValue(props.table, props.draft, "buwei", rowIndex)).label;
}

function rowBadgeLabel(enumType: string, fieldName: string, rowIndex: number) {
  return shangBingEnumLabel(props.enums, enumType, shangBingFieldValue(props.table, props.draft, fieldName, rowIndex));
}

function healedLabel(rowIndex: number) {
  const value = fieldText("iscure", rowIndex).toLowerCase();
  return value === "true" || value === "1" ? "已治愈" : "未治愈";
}

function rowDirty(rowIndex: number) {
  return dirtyRows.value.has(rowIndex);
}

function resetRow(rowIndex: number) {
  for (const fieldName of props.table.fieldNames) {
    const candidate = field(fieldName);
    if (!candidate?.parsed) continue;
    if (fieldDraftKey(candidate, rowIndex) in props.draft) {
      emit("updateField", candidate, initialFieldText(fieldName, rowIndex), rowIndex);
    }
  }
}

function resetTable() {
  for (const rowIndex of rowIndexes.value) resetRow(rowIndex);
}

function updateField(field: BgDatabaseField, value: string, rowIndex: number) {
  emit("updateField", field, value, rowIndex);
}
</script>

<template>
  <AppCard>
    <EditableTableCardHeader
      title="伤病"
      :description="`${table.rowCount} 条`"
      :dirty="tableDirty"
      @reset="resetTable"
    />

    <AppCardContent class="grid gap-3">
      <div v-if="!rowIndexes.length" class="rounded-md border px-3 py-8 text-center text-sm text-muted-foreground">
        当前没有伤病
      </div>

      <template v-else>
        <div
          v-for="rowIndex in rowIndexes"
          :key="rowIndex"
          class="grid gap-3 rounded-md border p-3"
        >
          <div class="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div class="min-w-0">
              <div class="truncate text-sm font-medium">
                {{ rowTitle(rowIndex) }}
              </div>
              <div class="mt-1 text-xs text-muted-foreground">
                显示效果：{{ rowEffectText(rowIndex) }}
              </div>
            </div>

            <AppButton
              v-if="rowDirty(rowIndex)"
              type="button"
              variant="ghost"
              size="sm"
              class="h-7 px-2 text-xs"
              @click="resetRow(rowIndex)"
            >
              重置
            </AppButton>
          </div>

          <div class="flex min-w-0 flex-wrap items-center gap-1.5">
            <Badge variant="secondary">
              {{ rowBadgeLabel("ShangBingType", "type", rowIndex) }}
            </Badge>
            <Badge variant="outline">
              {{ rowBadgeLabel("ShangBingBuWei", "buwei", rowIndex) }}
            </Badge>
            <Badge variant="outline">
              {{ rowBadgeLabel("ShangBingChengDu", "chengdu", rowIndex) }}
            </Badge>
            <Badge variant="outline">
              {{ healedLabel(rowIndex) }}
            </Badge>
          </div>

          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <AppFieldStack v-if="field('mingcheng')" label="名称">
              <SaveFieldEditor
                :field="field('mingcheng')"
                :row-index="rowIndex"
                :draft="draft"
                compact
                @update="updateField"
              />
            </AppFieldStack>

            <AppFieldStack v-if="field('nianxian')" label="年限">
              <SaveFieldEditor
                :field="field('nianxian')"
                :row-index="rowIndex"
                :draft="draft"
                input="number"
                :min="0"
                compact
                @update="updateField"
              />
            </AppFieldStack>

            <AppFieldStack v-if="field('type')" label="类型">
              <SaveFieldEditor
                :field="field('type')"
                :row-index="rowIndex"
                :draft="draft"
                :enum-options="enumOptions('type')"
                compact
                @update="updateField"
              />
            </AppFieldStack>

            <AppFieldStack v-if="field('iscure')" label="治愈">
              <SaveFieldEditor
                :field="field('iscure')"
                :row-index="rowIndex"
                :draft="draft"
                input="boolean"
                compact
                @update="updateField"
              />
            </AppFieldStack>

            <AppFieldStack v-if="field('buwei')" label="部位">
              <SaveFieldEditor
                :field="field('buwei')"
                :row-index="rowIndex"
                :draft="draft"
                :enum-options="enumOptions('buwei')"
                compact
                @update="updateField"
              />
            </AppFieldStack>

            <AppFieldStack v-if="field('chengdu')" label="程度">
              <SaveFieldEditor
                :field="field('chengdu')"
                :row-index="rowIndex"
                :draft="draft"
                :enum-options="enumOptions('chengdu')"
                compact
                @update="updateField"
              />
            </AppFieldStack>

            <AppFieldStack v-if="field('value1')" :label="`${rowAttributeLabel(rowIndex)}影响`">
              <SaveFieldEditor
                :field="field('value1')"
                :row-index="rowIndex"
                :draft="draft"
                input="number"
                compact
                @update="updateField"
              />
            </AppFieldStack>

            <AppFieldStack v-if="field('value2')" label="附加影响">
              <SaveFieldEditor
                :field="field('value2')"
                :row-index="rowIndex"
                :draft="draft"
                input="number"
                compact
                @update="updateField"
              />
            </AppFieldStack>
          </div>
        </div>
      </template>
    </AppCardContent>
  </AppCard>
</template>
