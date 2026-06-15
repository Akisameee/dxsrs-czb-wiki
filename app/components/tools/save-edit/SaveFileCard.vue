<script setup lang="ts">
import { Download, Pencil, Trash2 } from "@lucide/vue";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

defineProps<{
  fileName: string;
  fileSize: string;
  characterName?: string;
  tableCount?: number;
  parsedFieldCount?: number;
  fieldCount?: number;
  active?: boolean;
  errorMessage: string;
}>();

const emit = defineEmits<{
  edit: [];
  download: [];
  remove: [];
}>();
</script>

<template>
  <AppCard :class="active ? 'border-primary' : undefined">
    <AppCardHeader class="gap-2">
      <CardTitle class="break-all text-base">{{ fileName }}</CardTitle>
      <CardDescription>
        <template v-if="errorMessage">解析失败 · {{ fileSize }}</template>
        <template v-else>{{ characterName }} · {{ fileSize }}</template>
      </CardDescription>
      <CardAction>
        <AppButton type="button" variant="ghost" size="icon" @click="emit('remove')">
          <Trash2 class="size-4" />
        </AppButton>
      </CardAction>
    </AppCardHeader>
    <AppCardContent class="grid gap-4">
      <p v-if="errorMessage" class="text-sm text-destructive">{{ errorMessage }}</p>

      <div v-else class="flex flex-wrap gap-2">
        <Badge variant="secondary">{{ tableCount }} 张表</Badge>
        <Badge variant="secondary">{{ parsedFieldCount }} / {{ fieldCount }} 字段</Badge>
      </div>

      <div v-if="!errorMessage" class="flex flex-wrap gap-2">
        <AppButton type="button" @click="emit('edit')">
          <Pencil class="size-4" />
          修改
        </AppButton>
        <AppButton type="button" variant="outline" @click="emit('download')">
          <Download class="size-4" />
          下载
        </AppButton>
      </div>
    </AppCardContent>
  </AppCard>
</template>
