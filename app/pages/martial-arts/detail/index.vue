<script setup lang="ts">
useHead({ title: "武学详情" });
const route = useRoute();
</script>

<template>
  <main class="container mx-auto grid gap-6 p-6">
    <UiCard>
      <UiCardHeader>
        <UiCardTitle>武学详情</UiCardTitle>
        <UiCardDescription>id: {{ route.query.id || "-" }}</UiCardDescription>
      </UiCardHeader>
      <UiCardFooter>
        <UiButton as-child variant="outline">
          <NuxtLink to="/martial-arts/">返回武学</NuxtLink>
        </UiButton>
      </UiCardFooter>
    </UiCard>
  </main>
</template>
