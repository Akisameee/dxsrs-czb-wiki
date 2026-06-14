<script setup lang="ts">
import { Upload } from "@lucide/vue";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

const emit = defineEmits<{
  upload: [files: File[]];
}>();

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = [...(input.files || [])];
  if (files.length) emit("upload", files);
  input.value = "";
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>存档导入</CardTitle>
      <CardDescription>可以一次导入多个 BGDatabase 主存档文件</CardDescription>
    </CardHeader>
    <CardContent class="grid gap-2">
      <Label class="text-muted-foreground" for="save-edit-files">
        <Upload class="inline size-4 align-text-bottom" />
        选择存档文件
      </Label>
      <Input
        id="save-edit-files"
        type="file"
        multiple
        @change="onFileChange"
      />
    </CardContent>
  </Card>
</template>
