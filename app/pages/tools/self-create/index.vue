<script setup lang="ts">
import { SelfCreateSimulation, makeZiChuangSeed } from "~/lib/self-create";

useHead({ title: "自创武学" });

const sampleInput = {
  yi: 6,
  qi: 1,
  xing: 6,
  shen: 7,
  weaponType: 2,
  name: "自创武功",
};

const { data: context, pending, error } = await useSelfCreateAlgorithmData();

const sampleRoute = computed(() => {
  if (!context.value) return null;
  return new SelfCreateSimulation(sampleInput, context.value.data).toRoute(context.value.styleNames);
});
</script>

<template>
  <main class="container mx-auto grid gap-6 p-6">
    <Card>
      <CardHeader>
        <CardTitle>自创武学</CardTitle>
        <CardDescription>自创算法已接入，界面按新组件体系重建。</CardDescription>
      </CardHeader>
      <CardContent v-if="pending" class="text-muted-foreground">读取 sqlite 数据中...</CardContent>
      <CardContent v-else-if="error" class="text-destructive">{{ error.message }}</CardContent>
      <CardContent v-else-if="sampleRoute?.initial" class="flex flex-wrap gap-2">
        <Badge variant="outline">seed：{{ makeZiChuangSeed(sampleInput) }}</Badge>
        <Badge variant="outline">改良空间：{{ sampleRoute.initialImproveLimit }}</Badge>
        <Badge variant="outline">初始风格：{{ sampleRoute.initial.style.name }}</Badge>
        <Badge variant="outline">攻击范围：{{ sampleRoute.initial.area.name }}</Badge>
        <Badge variant="outline">威力：{{ sampleRoute.initial.power }}</Badge>
        <Badge variant="outline">真气：{{ sampleRoute.initial.cost }}</Badge>
      </CardContent>
    </Card>
  </main>
</template>
