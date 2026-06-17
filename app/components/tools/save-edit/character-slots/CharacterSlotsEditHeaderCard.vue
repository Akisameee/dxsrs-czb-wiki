<script setup lang="ts">
import { ArrowLeft, CircleHelp, Download } from "@lucide/vue";
import {
  CardDescription,
  CardTitle,
} from "~/components/ui/card";
import { saveEditDbKeyInfoByKey } from "~/lib/save-edit";

const headerIcon = saveEditDbKeyInfoByKey("CunDangs")?.icon;

defineProps<{
  fileName: string;
  slotCount: number;
  activeCount: number;
  hasSave: boolean;
}>();

const emit = defineEmits<{
  download: [];
}>();
</script>

<template>
  <AppCard>
    <AppCardHeader>
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="grid gap-1">
          <CardTitle class="flex items-center gap-2 text-2xl">
            <component :is="headerIcon" v-if="headerIcon" class="size-5" />
            存档槽
            <AppTooltip content-class="max-w-sm border bg-white text-slate-950 shadow-md">
              <template #trigger>
                <AppButton
                  type="button"
                  variant="ghost"
                  size="icon"
                  class="size-6 text-muted-foreground"
                >
                  <CircleHelp class="size-4" />
                  <span class="sr-only">存档槽编辑说明</span>
                </AppButton>
              </template>
              <div class="grid gap-2 text-sm">
                <p>这里编辑的是存档槽索引文件，只会影响槽位列表里保存的摘要信息。</p>
                <p>如果要修改真实人物数据，请打开对应的人物存档修改；如果要修改游戏实际读取的当前槽，请打开当前存档槽文件修改。</p>
                <p>重置也只重置当前页面打开的存档槽索引文件。</p>
              </div>
            </AppTooltip>
          </CardTitle>
          <CardDescription>
            {{ fileName || "没有选择文件" }}
            <template v-if="hasSave"> · {{ activeCount }} / {{ slotCount }} 个槽位已使用</template>
          </CardDescription>
        </div>

        <div class="flex flex-wrap gap-2">
          <AppButton type="button" variant="outline" as-child>
            <NuxtLink to="/tools/save-edit">
              <ArrowLeft class="size-4" />
              返回
            </NuxtLink>
          </AppButton>
          <AppButton v-if="hasSave" type="button" @click="emit('download')">
            <Download class="size-4" />
            下载
          </AppButton>
        </div>
      </div>
    </AppCardHeader>
  </AppCard>
</template>
