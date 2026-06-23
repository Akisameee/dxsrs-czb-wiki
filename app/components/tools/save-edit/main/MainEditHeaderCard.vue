<script setup lang="ts">
import { ArrowLeft, Database, Download, UserRound } from "@lucide/vue";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

type ViewMode = "normal" | "database";

const props = defineProps<{
  characterName: string;
  fileName: string;
  tableCount?: number;
  hasSave: boolean;
  viewMode: ViewMode;
}>();

const emit = defineEmits<{
  updateViewMode: [value: ViewMode];
  download: [];
}>();

const viewModeModel = computed<ViewMode>({
  get: () => props.viewMode,
  set: (value) => emit("updateViewMode", value),
});

function toggleViewMode() {
  viewModeModel.value = viewModeModel.value === "normal" ? "database" : "normal";
}
</script>

<template>
  <AppCard>
    <AppCardHeader>
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="grid gap-1">
          <CardTitle class="flex items-center gap-2 text-2xl">
            <UserRound class="size-5" />
            {{ characterName }}
          </CardTitle>
          <CardDescription>
            {{ fileName || "没有选择文件" }}
            <template v-if="hasSave"> · {{ tableCount }} 张表</template>
          </CardDescription>
        </div>

        <div class="flex flex-wrap gap-2">
          <AppButton type="button" variant="outline" as-child>
            <NuxtLink to="/tools/save-edit">
              <ArrowLeft class="size-4" />
              返回
            </NuxtLink>
          </AppButton>
          <AppButton
            type="button"
            :variant="viewModeModel === 'database' ? 'secondary' : 'outline'"
            :aria-pressed="viewModeModel === 'database'"
            @click="toggleViewMode"
          >
            <Database class="size-4" />
            数据库视图
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
