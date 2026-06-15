<script setup lang="ts">
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import type { SaveEditFile } from "./model";

defineProps<{
  save: SaveEditFile | null;
  characterName: string;
}>();
</script>

<template>
  <AppCard>
    <AppCardHeader>
      <CardTitle>解析结果</CardTitle>
      <CardDescription>
        <template v-if="save">主角：{{ characterName }}</template>
        <template v-else>上传存档后会显示可解析的数据表</template>
      </CardDescription>
    </AppCardHeader>
    <AppCardContent v-if="save" class="grid gap-4">
      <div class="grid gap-2 text-sm">
        <div class="flex justify-between gap-3 rounded-md border px-3 py-2">
          <span class="text-muted-foreground">数据表</span>
          <span class="tabular-nums">{{ save.tables.length }}</span>
        </div>
        <div class="flex justify-between gap-3 rounded-md border px-3 py-2">
          <span class="text-muted-foreground">主角字段</span>
          <span class="tabular-nums">{{ save.zhuJue.parsedFieldCount }} / {{ save.zhuJue.fieldCount }}</span>
        </div>
        <div class="flex justify-between gap-3 rounded-md border px-3 py-2">
          <span class="text-muted-foreground">已解析字段</span>
          <span class="tabular-nums">
            {{ save.tables.reduce((sum, table) => sum + table.parsedFieldCount, 0) }}
            /
            {{ save.tables.reduce((sum, table) => sum + table.fieldCount, 0) }}
          </span>
        </div>
      </div>

      <div class="grid gap-2">
        <div class="text-sm text-muted-foreground">包含的数据表</div>
        <div class="flex flex-wrap gap-2">
          <Badge
            v-for="table in save.tables"
            :key="table.name"
            variant="secondary"
          >
            {{ table.name }} · {{ table.rowCount }}
          </Badge>
        </div>
      </div>

      <div v-if="save.warnings.length" class="grid gap-2">
        <div class="text-sm text-muted-foreground">解析提示</div>
        <div class="grid gap-2 text-sm">
          <div
            v-for="warning in save.warnings.slice(0, 8)"
            :key="warning"
            class="rounded-md border px-3 py-2 text-muted-foreground"
          >
            {{ warning }}
          </div>
        </div>
      </div>
    </AppCardContent>
  </AppCard>
</template>
