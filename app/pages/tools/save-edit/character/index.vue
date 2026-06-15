<script setup lang="ts">
import CharacterEditHeaderCard from "~/components/tools/save-edit/character/CharacterEditHeaderCard.vue";
import InventoryTableCard from "~/components/tools/save-edit/character/inventory/TableCard.vue";
import MartialArtsTableCard from "~/components/tools/save-edit/character/martial-arts/TableCard.vue";
import ZhuJueTableCard from "~/components/tools/save-edit/character/player/TableCard.vue";
import MissingSaveCard from "~/components/tools/save-edit/character/MissingSaveCard.vue";
import SingleRowTableCard from "~/components/tools/save-edit/character/SingleRowTableCard.vue";
import SaveTableEditor from "~/components/tools/save-edit/SaveTableEditor.vue";
import {
  fieldDraftKey,
  formatSaveValue,
  parseFieldDraftKey,
  saveEditCharacterName,
  writeSaveEditFile,
} from "~/components/tools/save-edit/model";
import { enumMapFromRows } from "~/lib/utils";
import type { BgDatabaseField, BgDatabaseTable } from "~/lib/bgdatabase";

useHead({ title: "人物存档修改" });

const route = useRoute();
const { queryRows } = useWikiDb();
const { findByFileName, updateItem } = useSaveEditWorkspace();
const viewMode = ref<"normal" | "database">("normal");
const easyTableNames = ["Option", "MenPaiInfo", "JiGou", "ZiChuangWuGong", "ShengChanRandom"];

const editFileName = computed(() => String(route.query.edit || ""));
const item = computed(() => findByFileName(editFileName.value));
const save = computed(() => item.value?.save || null);
const draft = computed(() => item.value?.draft || {});
const characterName = computed(() => (save.value ? saveEditCharacterName(save.value, draft.value) : "未选择存档"));
const headerFileName = computed(() => item.value?.fileName || editFileName.value);

const { data: labelRows } = await useAsyncData(
  "save-edit-labels",
  async () => {
    const [enumRows, sectRows] = await Promise.all([
      queryRows<{ type: string; id: number; label: string | null }>("SELECT type, id, label FROM enums ORDER BY type, id"),
      queryRows<{ id: number; name: string | null; legacy_id: number | null; legacy_name: string | null }>(
        "SELECT id, name, legacy_id, legacy_name FROM sects ORDER BY id",
      ),
    ]);
    return { enumRows, sectRows };
  },
  { server: false },
);
const enums = computed(() => ({
  ...enumMapFromRows(labelRows.value?.enumRows || []),
  MenPai: Object.fromEntries(
    (labelRows.value?.sectRows || [])
      .filter((row) => row.legacy_id !== null)
      .map((row) => [String(row.legacy_id), row.name || row.legacy_name]),
  ),
  LianSuo_MP: Object.fromEntries((labelRows.value?.sectRows || []).map((row) => [String(row.id), row.name])),
}));

const easyTables = computed(() => {
  if (!save.value) return [];
  return easyTableNames
    .map((name) => save.value?.tables.find((table) => table.name === name))
    .filter((table): table is BgDatabaseTable => Boolean(table && table.rowCount <= 1));
});
const inventoryTable = computed(() => save.value?.tables.find((table) => table.name === "XingNang") || null);
const jsWugongTable = computed(() => save.value?.tables.find((table) => table.name === "JSWugong") || null);
const gWugongTable = computed(() => save.value?.tables.find((table) => table.name === "GWuGong") || null);
const gWugongDetailTable = computed(() => save.value?.tables.find((table) => table.name === "GWuGongDetail") || null);
const equippedUids = computed(() => ({
  weapon1: zhuJueFieldText("wq1_uid"),
  weapon2: zhuJueFieldText("wq2_uid"),
  armor: zhuJueFieldText("fj_uid"),
}));

function zhuJueFieldText(fieldName: string) {
  const field = save.value?.zhuJue.fields[fieldName];
  if (!field) return "";
  const key = fieldDraftKey(field, 0);
  return String(draft.value[key] ?? field.values[0] ?? "");
}

function updateField(field: BgDatabaseField, value: string, rowIndex = 0) {
  if (!item.value) return;
  const key = fieldDraftKey(field, rowIndex);
  updateDraftValue(key, field, rowIndex, value);
}

function updateActiveTable(tableIndex: number) {
  if (!item.value) return;
  updateItem(item.value.id, { selectedTableIndex: tableIndex });
}

function updateDatabaseCell(key: string, value: string) {
  if (!item.value) return;
  const parsed = parseFieldDraftKey(key);
  const table = save.value?.tables.find((candidate) => candidate.tableIndex === parsed?.tableIndex);
  const field = table?.fieldNames
    .map((fieldName) => table.fields[fieldName])
    .find((candidate) => candidate?.fieldIndex === parsed?.fieldIndex);
  if (!parsed || !field) {
    updateItem(item.value.id, { draft: { ...item.value.draft, [key]: value } });
    return;
  }
  updateDraftValue(key, field, parsed.rowIndex, value);
}

function updateDraftValue(key: string, field: BgDatabaseField, rowIndex: number, value: string) {
  if (!item.value) return;
  const initialValue = formatSaveValue(field.values[rowIndex]);
  const currentDraftValue = item.value.draft[key];
  if (value === initialValue && currentDraftValue === undefined) return;
  if (value !== initialValue && currentDraftValue === value) return;

  const nextDraft = { ...item.value.draft };
  if (value === initialValue) {
    delete nextDraft[key];
  } else {
    nextDraft[key] = value;
  }
  updateItem(item.value.id, { draft: nextDraft });
}

function downloadSave() {
  if (!item.value?.save || !import.meta.client) return;
  try {
    const output = writeSaveEditFile(item.value.save, item.value.draft);
    const arrayBuffer = new ArrayBuffer(output.byteLength);
    new Uint8Array(arrayBuffer).set(output);
    const blob = new Blob([arrayBuffer], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = editedFileName(item.value.fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    if (item.value) updateItem(item.value.id, { errorMessage: error instanceof Error ? error.message : String(error) });
  }
}

function editedFileName(name: string) {
  const dot = name.lastIndexOf(".");
  if (dot <= 0) return `${name}-edited`;
  return `${name.slice(0, dot)}-edited${name.slice(dot)}`;
}
</script>

<template>
  <AppPageContainer>
    <CharacterEditHeaderCard
      :character-name="characterName"
      :file-name="headerFileName"
      :table-count="save?.tables.length"
      :has-save="Boolean(save)"
      :view-mode="viewMode"
      @update-view-mode="viewMode = $event"
      @download="downloadSave"
    />

    <MissingSaveCard v-if="!save" />

    <template v-else-if="viewMode === 'database'">
      <SaveTableEditor
        :save="save"
        :draft="draft"
        :enums="enums"
        :selected-table-index="item?.selectedTableIndex || 0"
        @update-table="updateActiveTable"
        @update-cell="updateDatabaseCell"
      />
    </template>

    <template v-else>
      <ZhuJueTableCard
        :save="save"
        :table="save.zhuJue"
        :draft="draft"
        :enums="enums"
        @update-field="updateField"
      />

      <MartialArtsTableCard
        v-if="jsWugongTable && gWugongTable && gWugongDetailTable"
        :js-table="jsWugongTable"
        :base-table="gWugongTable"
        :detail-table="gWugongDetailTable"
        :draft="draft"
        :enums="enums"
        @update-field="updateField"
      />

      <InventoryTableCard
        v-if="inventoryTable"
        :table="inventoryTable"
        :equipped-uids="equippedUids"
        :draft="draft"
        :enums="enums"
        @update-field="updateField"
      />

      <div v-if="easyTables.length" class="grid gap-6 lg:grid-cols-2">
        <SingleRowTableCard
          v-for="table in easyTables"
          :key="table.name"
          :table="table"
          :draft="draft"
          :enums="enums"
          @update-field="updateField"
        />
      </div>
    </template>
  </AppPageContainer>
</template>
