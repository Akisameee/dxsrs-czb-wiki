<script setup lang="ts">
import { CircleHelp, Upload } from "@lucide/vue";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";

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
      <CardTitle class="flex items-center gap-2">
        存档导入
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                class="size-6 text-muted-foreground"
              >
                <CircleHelp class="size-4" />
                <span class="sr-only">存档位置</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent class="max-w-sm border bg-white text-slate-950 shadow-md">
              <div class="grid gap-2 text-sm">
                <p>安卓存档通常在：</p>
                <p class="break-all rounded px-2 py-1 font-mono text-xs">
                  /storage/emulated/0/Android/data/com.sq.dxcz.dxt/files/
                </p>
                <p>如果通过 TapTap 安装，则存档位置在：</p>
                <p class="break-all rounded px-2 py-1 font-mono text-xs">
                  /storage/emulated/0/Android/data/com.taptap/files/tap_sandbox_sd/0/Android/data/com.sq.dxcz.dxt/files/
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardTitle>
      <CardDescription>可以一次导入多个 BGDatabase 存档文件</CardDescription>
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
