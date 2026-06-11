<script setup lang="ts">
import type { ChainRecordView } from "./types";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";

defineProps<{
  records: ChainRecordView[];
}>();
</script>

<template>
  <TooltipProvider>
    <Card>
      <CardHeader>
        <CardTitle>连锁词条</CardTitle>
      </CardHeader>
      <CardContent>
        <div v-if="records.length" class="grid gap-3">
          <Card
            v-for="record in records"
            :key="record.key"
          >
            <CardHeader class="gap-3">
              <CardTitle class="truncate text-base">{{ record.label }}</CardTitle>
              <div class="flex flex-wrap gap-1.5">
                <Tooltip
                  v-for="block in record.blocks"
                  :key="block.value"
                >
                  <TooltipTrigger as-child>
                    <span
                      class="size-4 rounded-sm"
                      :class="block.class"
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    {{ block.tooltip }}
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent v-if="record.activeEffect" class="pt-0 text-sm">
              {{ record.activeEffect }}
            </CardContent>
          </Card>
        </div>
        <div v-else class="py-12 text-center text-sm text-muted-foreground">
          暂无连锁
        </div>
      </CardContent>
    </Card>
  </TooltipProvider>
</template>
