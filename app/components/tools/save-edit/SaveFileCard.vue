<script setup lang="ts">
import { Download, Pencil, RotateCcwIcon, Trash2 } from "@lucide/vue";
import { Badge } from "~/components/ui/badge";
import {
  CardAction,
  CardDescription,
  CardTitle,
} from "~/components/ui/card";
import type { Component } from "vue";

defineProps<{
  fileName: string;
  fileSize: string;
  fileType: string;
  fileIcon?: Component;
  characterName?: string;
  tableCount?: number;
  parsedFieldCount?: number;
  fieldCount?: number;
  canEdit?: boolean;
  dirty?: boolean;
  active?: boolean;
  errorMessage: string;
}>();

const emit = defineEmits<{
  edit: [];
  download: [];
  remove: [];
  reset: [];
}>();
</script>

<template>
  <AppCard :class="active ? 'border-primary' : undefined">
    <AppCardHeader class="gap-2">
      <CardTitle class="flex items-start gap-2 text-base">
        <component
          :is="fileIcon"
          v-if="fileIcon"
          class="mt-0.5 size-4 shrink-0 text-muted-foreground"
        />
        <span class="min-w-0 break-all">{{ fileName }}</span>
      </CardTitle>
      <CardDescription>
        <template v-if="errorMessage">解析失败 · {{ fileSize }}</template>
        <template v-else>
          {{ fileType }}
          <template v-if="characterName"> · {{ characterName }}</template>
          · {{ fileSize }}
        </template>
      </CardDescription>
      <CardAction>
        <div class="flex items-center gap-1">
          <AppButton
            v-if="dirty"
            type="button"
            variant="ghost"
            size="icon"
            class="size-6 rounded-full border bg-background text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground"
            @click="emit('reset')"
          >
            <RotateCcwIcon class="size-3.5" />
            <span class="sr-only">重置所有修改</span>
          </AppButton>
          <AppButton type="button" variant="ghost" size="icon" @click="emit('remove')">
            <Trash2 class="size-4" />
          </AppButton>
        </div>
      </CardAction>
    </AppCardHeader>
    <AppCardContent class="grid gap-4">
      <p v-if="errorMessage" class="text-sm text-destructive">{{ errorMessage }}</p>

      <div v-if="!errorMessage && canEdit" class="flex flex-wrap gap-2">
        <Badge variant="secondary">{{ tableCount }} 张表</Badge>
        <Badge variant="secondary">{{ parsedFieldCount }} / {{ fieldCount }} 字段</Badge>
      </div>

      <slot v-if="!errorMessage" name="actions">
        <div v-if="canEdit" class="flex flex-wrap gap-2">
          <AppButton type="button" @click="emit('edit')">
            <Pencil class="size-4" />
            修改
          </AppButton>
          <AppButton type="button" variant="outline" @click="emit('download')">
            <Download class="size-4" />
            下载
          </AppButton>
        </div>
      </slot>
    </AppCardContent>
  </AppCard>
</template>
