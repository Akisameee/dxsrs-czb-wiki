<script setup lang="ts">
useHead({ title: "道具详情" });
const route = useRoute();
</script>

<template>
  <main class="container mx-auto grid gap-6 p-6">
    <Card>
      <CardHeader>
        <CardTitle>道具详情</CardTitle>
        <CardDescription>id: {{ route.query.id || "-" }}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button as-child variant="outline">
          <NuxtLink to="/items/">返回道具</NuxtLink>
        </Button>
      </CardFooter>
    </Card>
  </main>
</template>
