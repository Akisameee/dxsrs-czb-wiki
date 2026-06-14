<script setup lang="ts">
import { ArrowLeft, Database, Download, UserRound } from "@lucide/vue";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";

defineProps<{
  characterName: string;
  fileName: string;
  tableCount?: number;
  changedCount: number;
  hasSave: boolean;
  viewMode: "normal" | "database";
}>();

const emit = defineEmits<{
  updateViewMode: [value: "normal" | "database"];
  download: [];
}>();
</script>

<template>
  <Card>
    <CardHeader>
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="grid gap-1">
          <CardTitle class="text-2xl">{{ characterName }}</CardTitle>
          <CardDescription>
            {{ fileName || "没有选择文件" }}
            <template v-if="hasSave"> · {{ tableCount }} 张表 · {{ changedCount }} 处修改</template>
          </CardDescription>
        </div>

        <div class="flex flex-wrap gap-2">
          <Button type="button" variant="outline" as-child>
            <NuxtLink to="/tools/save-edit">
              <ArrowLeft class="size-4" />
              返回
            </NuxtLink>
          </Button>
          <div class="flex rounded-md border p-1">
            <Button
              type="button"
              size="sm"
              :variant="viewMode === 'normal' ? 'default' : 'ghost'"
              @click="emit('updateViewMode', 'normal')"
            >
              <UserRound class="size-4" />
              正常视图
            </Button>
            <Button
              type="button"
              size="sm"
              :variant="viewMode === 'database' ? 'default' : 'ghost'"
              @click="emit('updateViewMode', 'database')"
            >
              <Database class="size-4" />
              数据库视图
            </Button>
          </div>
          <Button v-if="hasSave" type="button" @click="emit('download')">
            <Download class="size-4" />
            下载
          </Button>
        </div>
      </div>
    </CardHeader>
  </Card>
</template>
