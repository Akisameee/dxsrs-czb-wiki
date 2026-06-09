<script setup lang="ts">
useHead({ title: "人物详情" });
const route = useRoute();
</script>

<template>
  <main class="container mx-auto grid gap-6 p-6">
    <UiCard>
      <UiCardHeader>
        <UiCardTitle>人物详情</UiCardTitle>
        <UiCardDescription>id: {{ route.query.id || "-" }}</UiCardDescription>
      </UiCardHeader>
      <UiCardFooter>
        <UiButton as-child variant="outline">
          <NuxtLink to="/characters/">返回人物</NuxtLink>
        </UiButton>
      </UiCardFooter>
    </UiCard>
  </main>
</template>
