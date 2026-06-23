<script setup lang="ts">
import MainEditHeaderCard from "~/components/tools/save-edit/main/MainEditHeaderCard.vue";
import InjuriesTableCard from "~/components/tools/save-edit/main/injuries/TableCard.vue";
import InventoryTableCard from "~/components/tools/save-edit/main/inventory/TableCard.vue";
import MartialArtsTableCard from "~/components/tools/save-edit/main/martial-arts/TableCard.vue";
import EditDialog from "~/components/tools/save-edit/main/character/EditDialog.vue";
import CharacterTableCard from "~/components/tools/save-edit/main/character/CharacterTableCard.vue";
import PlayerTableCard from "~/components/tools/save-edit/main/player/TableCard.vue";
import MissingSaveCard from "~/components/tools/save-edit/main/MissingSaveCard.vue";
import SingleRowTableCard from "~/components/tools/save-edit/main/SingleRowTableCard.vue";
import SaveTableEditor from "~/components/tools/save-edit/SaveTableEditor.vue";
import {
  applySaveEditRowDraftOperation,
  createEmptySaveEditDraft,
  resetSaveEditDraftTarget,
  saveEditCharacterName,
  saveEditDraftFieldValue,
  updateSaveEditCellDraft,
  writeSaveEditFile,
  type SaveEditDraftResetOperation,
  type SaveEditDraftResetTarget,
  type SaveEditRowDraftOperation,
} from "~/lib/save-edit";
import { enumMapFromRows } from "~/lib/utils";
import type { BgDatabaseField, BgDatabaseTable } from "~/lib/save-edit";

useHead({ title: "人物存档修改" });

const route = useRoute();
const { queryRows } = useWikiDb();
const { findByFileName, updateItem } = useSaveEditWorkspace();
const viewMode = ref<"normal" | "database">("normal");
const characterDialogOpen = computed({
  get: () => characterDialogRowIndex.value !== null,
  set: (value: boolean) => {
    if (!value) characterDialogRowIndex.value = null;
  },
});
const characterDialogRowIndex = ref<number | null>(null);
const easyTableNames = ["Option", "MenPaiInfo", "JiGou", "ZiChuangWuGong", "ShengChanRandom"];

const editFileName = computed(() => String(route.query.edit || ""));
const item = computed(() => findByFileName(editFileName.value));
const save = computed(() => item.value?.save || null);
const draft = computed(() => item.value?.draft || createEmptySaveEditDraft());
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
const injuryTable = computed(() => save.value?.tables.find((table) => table.name === "ShangBing") || null);
const inventoryTable = computed(() => save.value?.tables.find((table) => table.name === "XingNang") || null);
const jsWugongTable = computed(() => save.value?.tables.find((table) => table.name === "JSWugong") || null);
const gWugongTable = computed(() => save.value?.tables.find((table) => table.name === "GWuGong") || null);
const gWugongDetailTable = computed(() => save.value?.tables.find((table) => table.name === "GWuGongDetail") || null);
const npcTable = computed(() => save.value?.tables.find((table) => table.name === "Npc") || null);
const activeCharacterRowIndex = computed(() => characterDialogRowIndex.value);
const activeCharacterLabel = computed(() => {
  const rowIndex = activeCharacterRowIndex.value;
  if (rowIndex === null) return "";
  const fullName = `${npcFieldText("xing", rowIndex)}${npcFieldText("ming", rowIndex)}`.trim();
  return fullName || npcFieldText("name", rowIndex) || `角色 ${rowIndex}`;
});
const activeCharacterOwnerName = computed(() => {
  const rowIndex = activeCharacterRowIndex.value;
  return rowIndex === null ? "" : npcFieldText("name", rowIndex);
});
const activeCharacterEquippedUids = computed(() => {
  const rowIndex = activeCharacterRowIndex.value;
  if (rowIndex === null) return {};
  return {
    weapon: npcFieldText("wq_uid", rowIndex),
    armor: npcFieldText("fj_uid", rowIndex),
  };
});
const npcEquipmentSlots = [
  { key: "weapon", label: "武器" },
  { key: "armor", label: "防具" },
];
const equippedUids = computed(() => ({
  weapon1: zhuJueFieldText("wq1_uid"),
  weapon2: zhuJueFieldText("wq2_uid"),
  armor: zhuJueFieldText("fj_uid"),
}));

function zhuJueFieldText(fieldName: string) {
  const field = save.value?.zhuJue.fields[fieldName];
  if (!field) return "";
  return String(saveEditDraftFieldValue(field, 0, draft.value) ?? "");
}

function npcFieldText(fieldName: string, rowIndex: number) {
  const field = npcTable.value?.fields[fieldName];
  if (!field) return "";
  return String(saveEditDraftFieldValue(field, rowIndex, draft.value) ?? "");
}

function updateField(field: BgDatabaseField, value: string, rowIndex = 0) {
  if (!item.value) return;
  updateDraftValue(field, rowIndex, value);
}

function editCharacter(rowIndex: number) {
  characterDialogRowIndex.value = rowIndex;
}

function updateActiveTable(tableIndex: number) {
  if (!item.value) return;
  updateItem(item.value.id, { selectedTableIndex: tableIndex });
}

function updateDatabaseCell(field: BgDatabaseField, rowIndex: number, value: string) {
  if (!item.value) return;
  updateDraftValue(field, rowIndex, value);
}

function updateDraftValue(field: BgDatabaseField, rowIndex: number, value: string) {
  if (!item.value) return;
  updateItem(item.value.id, { draft: updateSaveEditCellDraft(item.value.draft, field, rowIndex, value) });
}

function applyInventoryRowOperation(operation: SaveEditRowDraftOperation) {
  if (!item.value || !inventoryTable.value) return;
  updateItem(item.value.id, {
    draft: applySaveEditRowDraftOperation(item.value.draft, inventoryTable.value, operation),
  });
}

function applyTableRowOperation(table: BgDatabaseTable, operation: SaveEditRowDraftOperation) {
  if (!item.value) return;
  updateItem(item.value.id, {
    draft: applySaveEditRowDraftOperation(item.value.draft, table, operation),
  });
}

function applyInventoryRowOperations(operations: SaveEditRowDraftOperation[]) {
  if (!item.value || !inventoryTable.value || !operations.length) return;
  const nextDraft = operations.reduce(
    (currentDraft, operation) => applySaveEditRowDraftOperation(currentDraft, inventoryTable.value!, operation),
    item.value.draft,
  );
  updateItem(item.value.id, { draft: nextDraft });
}

function applyTableRowOperations(table: BgDatabaseTable, operations: SaveEditRowDraftOperation[]) {
  if (!item.value || !operations.length) return;
  const nextDraft = operations.reduce(
    (currentDraft, operation) => applySaveEditRowDraftOperation(currentDraft, table, operation),
    item.value.draft,
  );
  updateItem(item.value.id, { draft: nextDraft });
}

function resetTableDraft(table: BgDatabaseTable | null | undefined, target: SaveEditDraftResetTarget) {
  if (!item.value || !table) return;
  updateItem(item.value.id, {
    draft: resetSaveEditDraftTarget(item.value.draft, table, target),
  });
}

function resetTableDrafts(operations: SaveEditDraftResetOperation[]) {
  if (!item.value || !operations.length) return;
  const nextDraft = operations.reduce(
    (currentDraft, operation) => resetSaveEditDraftTarget(currentDraft, operation.table, operation.target),
    item.value.draft,
  );
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
    link.download = item.value.fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    if (item.value) updateItem(item.value.id, { errorMessage: error instanceof Error ? error.message : String(error) });
  }
}

</script>

<template>
  <AppPageContainer>
    <MainEditHeaderCard
      :character-name="characterName"
      :file-name="headerFileName"
      :table-count="save?.tables.length"
      :has-save="Boolean(save)"
      :view-mode="viewMode"
      @update-view-mode="viewMode = $event"
      @download="downloadSave"
    />

    <MissingSaveCard v-if="!save" />

    <template v-else>
      <template v-if="viewMode === 'database'">
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
        <PlayerTableCard
          :save="save"
          :table="save.zhuJue"
          :draft="draft"
          :enums="enums"
          @update-field="updateField"
        />

        <InjuriesTableCard
          v-if="injuryTable"
          :table="injuryTable"
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
          @row-operation="applyTableRowOperation"
          @row-operations="applyTableRowOperations"
          @reset-drafts="resetTableDrafts"
        />

        <InventoryTableCard
          v-if="inventoryTable"
          :table="inventoryTable"
          :equipped-uids="equippedUids"
          :draft="draft"
          :enums="enums"
          @row-operation="applyInventoryRowOperation"
          @row-operations="applyInventoryRowOperations"
          @reset-draft="resetTableDraft"
        />

        <CharacterTableCard
          v-if="npcTable"
          :table="npcTable"
          :draft="draft"
          :enums="enums"
          :js-wugong-table="jsWugongTable"
          :g-wugong-table="gWugongTable"
          :g-wugong-detail-table="gWugongDetailTable"
          :inventory-table="inventoryTable"
          @edit-character="editCharacter"
          @reset-drafts="resetTableDrafts"
          @table-row-operations="applyTableRowOperations"
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

      <EditDialog
        v-if="npcTable"
        v-model:open="characterDialogOpen"
        :table="npcTable"
        :row-index="activeCharacterRowIndex"
        :draft="draft"
        :enums="enums"
        :owner-name="activeCharacterOwnerName"
        :owner-label="activeCharacterLabel"
        :equipped-uids="activeCharacterEquippedUids"
        :equipment-slots="npcEquipmentSlots"
        :js-wugong-table="jsWugongTable"
        :g-wugong-table="gWugongTable"
        :g-wugong-detail-table="gWugongDetailTable"
        :inventory-table="inventoryTable"
        @update-field="updateField"
        @table-row-operation="applyTableRowOperation"
        @table-row-operations="applyTableRowOperations"
        @row-operation="applyInventoryRowOperation"
        @row-operations="applyInventoryRowOperations"
        @reset-draft="resetTableDraft"
        @reset-drafts="resetTableDrafts"
      />
    </template>
  </AppPageContainer>
</template>
