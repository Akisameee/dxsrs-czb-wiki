<script setup lang="ts">
const route = useRoute();

const links = [
  { label: "首页", to: "/" },
  { label: "配装", to: "/tools/loadout/" },
  { label: "自创", to: "/tools/self-create/" },
  { label: "武学", to: "/martial-arts/" },
  { label: "人物", to: "/characters/" },
  { label: "道具", to: "/items/" },
  { label: "数据总览", to: "/data/" },
];

function isActive(to: string) {
  if (to === "/") return route.path === "/";
  return route.path.startsWith(to);
}
</script>

<template>
  <div>
    <header class="border-b">
      <nav class="container mx-auto flex flex-wrap gap-2 p-4">
        <UiButton
          v-for="link in links"
          :key="link.to"
          as-child
          :variant="isActive(link.to) ? 'secondary' : 'ghost'"
          size="sm"
        >
          <NuxtLink :to="link.to">{{ link.label }}</NuxtLink>
        </UiButton>
      </nav>
    </header>
    <slot />
  </div>
</template>
