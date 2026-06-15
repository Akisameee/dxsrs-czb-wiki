<script setup lang="ts">
import {
  BarChart3,
  Download,
  Dumbbell,
  ExternalLink,
  FilePenLine,
  MessagesSquare,
  Package,
  ScrollText,
  Sparkles,
  Users,
} from "@lucide/vue";
import { Separator } from "~/components/ui/separator";

useHead({ title: "首页" });

const entries = [
  { title: "武学", text: "查看武学门派、类型、风格、效果和获取方式", to: "/martial-arts/", icon: ScrollText },
  { title: "人物", text: "按地点、门派、资质和武功路线索引 NPC", to: "/characters/", icon: Users },
  { title: "道具", text: "查看道具类型、稀有度、用途和说明", to: "/items/", icon: Package },
  { title: "武学配装", text: "选择武学并查看门派、风格连锁", to: "/tools/loadout/", icon: Dumbbell },
  { title: "自创模拟", text: "模拟初始四维、风格、攻击范围、效果和威力", to: "/tools/custom-martial-art/", icon: Sparkles },
  { title: "存档修改", text: "导入存档并编辑主角、行囊和武学数据", to: "/tools/save-edit/", icon: FilePenLine },
  { title: "数据总览", text: "直接浏览整理后的游戏数据", to: "/data/", icon: BarChart3 },
];

const gameLinks = [
  {
    title: "游戏下载",
    href: "https://www.taptap.cn/app/452158",
    icon: Download,
  },
  {
    title: "TapTap 讨论区",
    href: "https://www.taptap.cn/app/452158/topic",
    icon: MessagesSquare,
  },
];
</script>

<template>
  <AppPageContainer>
    <Card>
      <CardHeader>
        <CardTitle>大侠式人生-重制版 Wiki</CardTitle>
      </CardHeader>
    </Card>
    <Separator/>
    <div class="grid gap-4 grid-cols-2 xl:grid-cols-3">
      <NuxtLink
        v-for="entry in entries"
        :key="entry.to"
        class="group rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        :to="entry.to"
      >
        <AppCard class="h-full transition group-hover:-translate-y-0.5 group-hover:shadow-md">
          <AppCardHeader>
            <CardTitle class="flex items-center gap-2">
              <component :is="entry.icon" class="size-4 text-muted-foreground" />
              {{ entry.title }}
            </CardTitle>
            <CardDescription>{{ entry.text }}</CardDescription>
          </AppCardHeader>
        </AppCard>
      </NuxtLink>
    </div>
    <Separator/>
    <div class="grid gap-4 grid-cols-2">
      <a
        v-for="link in gameLinks"
        :key="link.title"
        class="group rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        :href="link.href"
        target="_blank"
        rel="noopener noreferrer"
      >
        <AppCard class="h-full transition group-hover:-translate-y-0.5 group-hover:shadow-md">
          <AppCardHeader>
            <CardTitle class="flex items-center gap-2">
              <component :is="link.icon" class="size-4 text-muted-foreground" />
              {{ link.title }}
              <ExternalLink class="ml-auto size-3.5 text-muted-foreground" />
            </CardTitle>
          </AppCardHeader>
        </AppCard>
      </a>
    </div>
  </AppPageContainer>
</template>
