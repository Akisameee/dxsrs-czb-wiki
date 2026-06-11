<script setup lang="ts">
import { navigationMenuTriggerStyle } from "~/components/ui/navigation-menu";

const route = useRoute();

const links = [
  { label: "首页", to: "/" },
  { label: "配装", to: "/tools/loadout/" },
  { label: "自创", to: "/tools/custom-martial-art/" },
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
    <header>
      <div class="container mx-auto flex flex-wrap items-center justify-between gap-4 p-4">
        <NuxtLink class="text-sm font-medium" to="/">大侠式人生重制版</NuxtLink>
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem
              v-for="link in links"
              :key="link.to"
            >
              <NavigationMenuLink
                as-child
                :active="isActive(link.to)"
                :class="navigationMenuTriggerStyle()"
              >
                <NuxtLink :to="link.to">{{ link.label }}</NuxtLink>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
      <Separator />
    </header>
    <slot />
  </div>
</template>
