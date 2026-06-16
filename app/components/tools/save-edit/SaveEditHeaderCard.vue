<script setup lang="ts">
import { CircleHelp, Download, Trash2, Upload } from "@lucide/vue";
import {
  CardAction,
  CardDescription,
  CardTitle,
} from "~/components/ui/card";
import { Label } from "~/components/ui/label";

withDefaults(defineProps<{
  hasFiles?: boolean;
  canDownload?: boolean;
}>(), {
  hasFiles: false,
  canDownload: false,
});

const emit = defineEmits<{
  upload: [files: File[]];
  removeAll: [];
  downloadAll: [];
}>();

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = [...(input.files || [])];
  if (files.length) emit("upload", files);
  input.value = "";
}
</script>

<template>
  <AppCard>
    <AppCardHeader>
      <CardTitle class="flex items-center gap-2">
        存档导入
        <AppTooltip content-class="max-w-sm border bg-white text-slate-950 shadow-md">
          <template #trigger>
            <AppButton
              type="button"
              variant="ghost"
              size="icon"
              class="size-6 text-muted-foreground"
            >
              <CircleHelp class="size-4" />
              <span class="sr-only">存档位置</span>
            </AppButton>
          </template>
          <div class="grid gap-2 text-sm">
            <p>安卓存档通常在：</p>
            <p class="break-all rounded px-2 py-1 font-mono text-xs">
              /storage/emulated/0/Android/data/com.sq.dxcz.dxt/files/
            </p>
            <p>如果通过 TapTap 试玩安装，则存档位置在：</p>
            <p class="break-all rounded px-2 py-1 font-mono text-xs">
              /storage/emulated/0/Android/data/com.taptap/files/tap_sandbox_sd/0/Android/data/com.sq.dxcz.dxt/files/
            </p>
            <p>打开目录后，可上传所有名称为数字的文件</p>
          </div>
        </AppTooltip>
      </CardTitle>
      <CardDescription>可以一次导入多个存档文件</CardDescription>
      <CardAction>
        <AppButton
          type="button"
          variant="ghost"
          size="icon"
          :disabled="!hasFiles"
          @click="emit('removeAll')"
        >
          <Trash2 class="size-4" />
          <span class="sr-only">删除所有</span>
        </AppButton>
      </CardAction>
    </AppCardHeader>
    <AppCardContent class="flex flex-wrap gap-2">
      <div class="grid gap-2">
        <Label
          class="flex h-8 min-w-0 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-2 text-sm text-muted-foreground shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground md:h-9 md:px-2.5"
          for="save-edit-files"
        >
          <Upload class="size-4 shrink-0" />
          <span class="truncate">选择存档文件</span>
        </Label>
        <AppInput
          id="save-edit-files"
          class="sr-only"
          type="file"
          multiple
          @change="onFileChange"
        />
      </div>

      <div class="grid gap-2">
        <AppButton
          type="button"
          variant="outline"
          :disabled="!canDownload"
          @click="emit('downloadAll')"
        >
          <Download class="size-4" />
          下载所有
        </AppButton>
      </div>
    </AppCardContent>
  </AppCard>
</template>
