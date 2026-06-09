<script setup lang="ts">
useHead({ title: "首页" });

const entries = [
  { title: "配装工具", text: "选择武学并查看门派、风格连锁。", to: "/tools/loadout/" },
  { title: "自创武学", text: "模拟初始四维、风格、攻击范围、效果和威力。", to: "/tools/self-create/" },
  { title: "武学", text: "查看武学门派、类型、风格、效果和获取方式。", to: "/martial-arts/" },
  { title: "人物", text: "按地点、门派、资质和武功路线索引 NPC。", to: "/characters/" },
  { title: "道具", text: "查看道具类型、稀有度、用途和说明。", to: "/items/" },
  { title: "数据总览", text: "直接浏览 wiki.sqlite 中的表和字段。", to: "/data/" },
];
</script>

<template>
  <main class="container mx-auto grid gap-6 p-6">
    <Card>
      <CardHeader>
        <CardTitle>大侠式人生重制版 Wiki</CardTitle>
        <CardDescription>数据、工具和逆向公式整理。</CardDescription>
      </CardHeader>
      <CardContent>
        <Separator />
      </CardContent>
    </Card>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Card v-for="entry in entries" :key="entry.to">
        <CardHeader>
          <CardTitle>{{ entry.title }}</CardTitle>
          <CardDescription>{{ entry.text }}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button as-child>
            <NuxtLink :to="entry.to">进入</NuxtLink>
          </Button>
        </CardFooter>
      </Card>
    </div>
  </main>
</template>
