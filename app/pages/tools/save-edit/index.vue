<script setup lang="ts">
import SaveFileCard from "~/components/tools/save-edit/SaveFileCard.vue";
import SaveUploadCard from "~/components/tools/save-edit/SaveUploadCard.vue";
import { parseBgDatabase } from "~/lib/bgdatabase";
import {
  asSaveEditFile,
  formatSaveFileSize,
  saveEditCharacterName,
  writeSaveEditFile,
} from "~/components/tools/save-edit/model";

useHead({ title: "存档修改" });

const router = useRouter();
const { files, allocateId, updateItem, removeItem } = useSaveEditWorkspace();

async function uploadSaves(uploadedFiles: File[]) {
  const items = await Promise.all(uploadedFiles.map(readSaveFile));
  files.value = [...items, ...files.value];
}

async function readSaveFile(file: File): Promise<ImportedSaveItem> {
  const id = allocateId();
  const base = {
    id,
    fileName: file.name,
    fileSize: formatSaveFileSize(file.size),
    draft: {},
    selectedTableIndex: 0,
  };

  try {
    const bytes = await file.arrayBuffer();
    const save = asSaveEditFile(parseBgDatabase(bytes));
    return { ...base, save, errorMessage: "" };
  } catch (error) {
    return {
      ...base,
      save: null,
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
}

function editSave(item: ImportedSaveItem) {
  if (!item.save) return;
  void router.push({ path: "/tools/save-edit/character", query: { edit: item.fileName } });
}

function removeSave(id: number) {
  removeItem(id);
}

function downloadSave(item: ImportedSaveItem) {
  if (!item.save || !import.meta.client) return;
  try {
    const output = writeSaveEditFile(item.save, item.draft);
    const arrayBuffer = new ArrayBuffer(output.byteLength);
    new Uint8Array(arrayBuffer).set(output);
    const blob = new Blob([arrayBuffer], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = editedFileName(item.fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    updateItem(item.id, { errorMessage: error instanceof Error ? error.message : String(error) });
  }
}

function editedFileName(name: string) {
  const dot = name.lastIndexOf(".");
  if (dot <= 0) return `${name}-edited`;
  return `${name.slice(0, dot)}-edited${name.slice(dot)}`;
}
</script>

<template>
  <main class="container mx-auto grid gap-6 p-6">
    <SaveUploadCard @upload="uploadSaves" />

    <section v-if="files.length" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <SaveFileCard
        v-for="item in files"
        :key="item.id"
        :file-name="item.fileName"
        :file-size="item.fileSize"
        :character-name="item.save ? saveEditCharacterName(item.save, item.draft) : undefined"
        :table-count="item.save?.tables.length"
        :parsed-field-count="item.save?.tables.reduce((sum, table) => sum + table.parsedFieldCount, 0)"
        :field-count="item.save?.tables.reduce((sum, table) => sum + table.fieldCount, 0)"
        :changed-count="Object.keys(item.draft).length"
        :error-message="item.errorMessage"
        @edit="editSave(item)"
        @download="downloadSave(item)"
        @remove="removeSave(item.id)"
      />
    </section>

    <Card v-else>
      <CardHeader>
        <CardTitle>等待导入</CardTitle>
        <CardDescription>导入后，每个文件会在这里生成一个独立卡片</CardDescription>
      </CardHeader>
    </Card>
  </main>
</template>
