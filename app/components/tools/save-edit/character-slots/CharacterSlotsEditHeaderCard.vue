<script setup lang="ts">
import { ArrowLeft, Download } from "@lucide/vue";
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
