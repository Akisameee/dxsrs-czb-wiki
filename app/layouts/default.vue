<script setup lang="ts">
import { navigationMenuTriggerStyle } from "~/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { cn } from "~/lib/utils";

const route = useRoute();

const links = [
  { label: "首页", to: "/" },
  { label: "武学", to: "/martial-arts/" },
  { label: "人物", to: "/characters/" },
  { label: "道具", to: "/items/" },
  { label: "数据总览", to: "/data/" },
];

const toolLinks = [
  { label: "武学配装", to: "/tools/loadout/" },
  { label: "自创模拟", to: "/tools/custom-martial-art/" },
];

function isActive(to: string) {
  if (to === "/") return route.path === "/";
  return route.path.startsWith(to);
}

const toolsActive = computed(() => toolLinks.some((link) => isActive(link.to)));
</script>

<template>
  <div>
    <header>
      <div class="container mx-auto flex flex-wrap items-center justify-between gap-4 p-4">
        <NuxtLink class="text-sm font-medium" to="/">大侠式人生重制版</NuxtLink>
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem
              v-for="link in links.slice(0, -1)"
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

            <NavigationMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  :class="cn(navigationMenuTriggerStyle(), toolsActive && 'bg-muted/50')"
                >
                  工具
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    v-for="link in toolLinks"
                    :key="link.to"
                    as-child
                    :class="isActive(link.to) ? 'bg-muted/50' : undefined"
                  >
                    <NuxtLink class="w-full whitespace-nowrap" :to="link.to">{{ link.label }}</NuxtLink>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </NavigationMenuItem>

            <NavigationMenuItem
              v-for="link in links.slice(-1)"
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
