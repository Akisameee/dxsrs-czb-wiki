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

const viewModeOptions = [
  { value: "normal", label: "正常视图" },
  { value: "database", label: "数据库视图" },
] satisfies Array<{ value: ViewMode; label: string }>;
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
          <AppTabsToggle
            v-model="viewModeModel"
            :options="viewModeOptions"
            trigger-class="gap-1.5"
          >
            <template #trigger-normal>
              <UserRound class="size-4" />
              正常视图
            </template>
            <template #trigger-database>
              <Database class="size-4" />
              数据库视图
            </template>
          </AppTabsToggle>
          <AppButton v-if="hasSave" type="button" @click="emit('download')">
            <Download class="size-4" />
            下载
          </AppButton>
        </div>
      </div>
    </AppCardHeader>
  </AppCard>
</template>
