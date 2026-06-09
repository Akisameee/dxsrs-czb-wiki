<script setup lang="ts">
useHead({ title: "武学详情" });
const route = useRoute();
</script>

<template>
  <main class="container mx-auto grid gap-6 p-6">
    <Card>
      <CardHeader>
        <CardTitle>武学详情</CardTitle>
        <CardDescription>id: {{ route.query.id || "-" }}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button as-child variant="outline">
          <NuxtLink to="/martial-arts/">返回武学</NuxtLink>
        </Button>
      </CardFooter>
    </Card>
  </main>
</template>
