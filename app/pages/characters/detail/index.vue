<script setup lang="ts">
useHead({ title: "人物详情" });
const route = useRoute();
</script>

<template>
  <main class="container mx-auto grid gap-6 p-6">
    <Card>
      <CardHeader>
        <CardTitle>人物详情</CardTitle>
        <CardDescription>id: {{ route.query.id || "-" }}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button as-child variant="outline">
          <NuxtLink to="/characters/">返回人物</NuxtLink>
        </Button>
      </CardFooter>
    </Card>
  </main>
</template>
