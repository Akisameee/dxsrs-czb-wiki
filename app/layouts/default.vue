<script setup lang="ts">
import { Menu } from "@lucide/vue";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { navigationMenuTriggerStyle } from "~/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { cn } from "~/lib/utils";

const route = useRoute();
const { queryOne } = useWikiDb();
const mobileNavOpen = ref(false);
const detailEntityName = ref("");
let detailEntityNameRequestId = 0;

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
  { label: "存档修改", to: "/tools/save-edit/" },
];

type NavBreadcrumbItem = {
  label: string;
  to: string;
};

type DetailRouteConfig = {
  label: string;
  listTo: string;
  table: "characters" | "items" | "martial_arts";
  fallback: string;
};

const detailRouteConfigs: Record<string, DetailRouteConfig> = {
  "/characters/detail": {
    label: "人物",
    listTo: "/characters/",
    table: "characters",
    fallback: "人物详情",
  },
  "/items/detail": {
    label: "道具",
    listTo: "/items/",
    table: "items",
    fallback: "道具详情",
  },
  "/martial-arts/detail": {
    label: "武学",
    listTo: "/martial-arts/",
    table: "martial_arts",
    fallback: "武学详情",
  },
};

const routeBreadcrumbs: Record<string, NavBreadcrumbItem[]> = {
  "/": [{ label: "首页", to: "/" }],
  "/characters": [
    { label: "首页", to: "/" },
    { label: "人物", to: "/characters/" },
  ],
  "/items": [
    { label: "首页", to: "/" },
    { label: "道具", to: "/items/" },
  ],
  "/martial-arts": [
    { label: "首页", to: "/" },
    { label: "武学", to: "/martial-arts/" },
  ],
  "/data": [
    { label: "首页", to: "/" },
    { label: "数据总览", to: "/data/" },
  ],
  "/tools/loadout": [
    { label: "首页", to: "/" },
    { label: "工具", to: "/tools/loadout/" },
    { label: "武学配装", to: "/tools/loadout/" },
  ],
  "/tools/custom-martial-art": [
    { label: "首页", to: "/" },
    { label: "工具", to: "/tools/loadout/" },
    { label: "自创模拟", to: "/tools/custom-martial-art/" },
  ],
  "/tools/save-edit": [
    { label: "首页", to: "/" },
    { label: "工具", to: "/tools/loadout/" },
    { label: "存档修改", to: "/tools/save-edit/" },
  ],
};

function normalizedPath(path: string) {
  if (path === "/") return "/";
  return path.replace(/\/+$/, "");
}

function isActive(to: string) {
  const currentPath = normalizedPath(route.path);
  const targetPath = normalizedPath(to);
  if (targetPath === "/") return currentPath === "/";
  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
}

const toolsActive = computed(() => toolLinks.some((link) => isActive(link.to)));
const currentDetailRouteConfig = computed(() => detailRouteConfigs[normalizedPath(route.path)] || null);

const breadcrumbs = computed<NavBreadcrumbItem[]>(() => {
  const path = normalizedPath(route.path);
  const detailConfig = currentDetailRouteConfig.value;

  if (detailConfig) {
    return [
      { label: "首页", to: "/" },
      { label: detailConfig.label, to: detailConfig.listTo },
      { label: detailEntityName.value || detailConfig.fallback, to: route.fullPath },
    ];
  }

  if (path === "/tools/save-edit/character") {
    return [
      ...routeBreadcrumbs["/tools/save-edit"],
      { label: String(route.query.edit || "人物存档"), to: route.fullPath },
    ];
  }

  return routeBreadcrumbs[path] || [{ label: "首页", to: "/" }];
});

async function updateDetailEntityName() {
  const requestId = ++detailEntityNameRequestId;
  const detailConfig = currentDetailRouteConfig.value;
  detailEntityName.value = "";
  if (!import.meta.client || !detailConfig) return;

  const id = Number(route.query.id);
  if (!Number.isFinite(id)) return;

  try {
    const row = await queryOne<{ name: string | null }>(
      `SELECT name FROM ${detailConfig.table} WHERE id = ?`,
      [id],
    );
    if (requestId === detailEntityNameRequestId) detailEntityName.value = row?.name || "";
  } catch {
    if (requestId === detailEntityNameRequestId) detailEntityName.value = "";
  }
}

watch(() => route.fullPath, () => {
  mobileNavOpen.value = false;
  void updateDetailEntityName();
}, { immediate: true });

function mobileLinkClass(to: string) {
  return cn(
    "flex h-10 items-center rounded-md px-3 text-sm transition-colors hover:bg-muted",
    isActive(to) && "bg-muted font-medium",
  );
}
</script>

<template>
  <div>
    <header>
      <div class="container mx-auto flex items-center justify-between gap-3 px-4 py-3">
        <Breadcrumb class="min-w-0 flex-1 overflow-hidden md:flex-none">
          <BreadcrumbList class="flex-nowrap overflow-hidden">
            <template
              v-for="(item, index) in breadcrumbs"
              :key="`${item.to}-${index}`"
            >
              <BreadcrumbItem class="min-w-0">
                <BreadcrumbLink as-child>
                  <NuxtLink
                    class="block truncate text-sm font-medium"
                    :to="item.to"
                  >
                    {{ item.label }}
                  </NuxtLink>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator
                v-if="index < breadcrumbs.length - 1"
                class="shrink-0"
              />
            </template>
          </BreadcrumbList>
        </Breadcrumb>

        <NavigationMenu class="hidden md:flex">
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

        <Sheet v-model:open="mobileNavOpen" :modal="false">
          <SheetTrigger as-child>
            <AppButton
              type="button"
              variant="outline"
              size="icon"
              class="md:hidden"
            >
              <Menu class="size-4" />
              <span class="sr-only">打开导航</span>
            </AppButton>
          </SheetTrigger>
          <SheetContent
            side="right"
            class="w-72 max-w-[80vw] data-open:!animation-duration-300 data-closed:!animation-duration-300 data-[side=right]:data-open:!slide-in-from-right data-[side=right]:data-closed:!slide-out-to-right"
          >
            <SheetHeader>
              <SheetTitle>导航</SheetTitle>
            </SheetHeader>

            <nav class="grid gap-6 px-4">
              <div class="grid gap-1">
                <div class="px-3 text-xs font-medium text-muted-foreground">数据</div>
                <SheetClose
                  v-for="link in links"
                  :key="link.to"
                  as-child
                >
                  <NuxtLink :class="mobileLinkClass(link.to)" :to="link.to">
                    {{ link.label }}
                  </NuxtLink>
                </SheetClose>
              </div>

              <div class="grid gap-1">
                <div class="px-3 text-xs font-medium text-muted-foreground">工具</div>
                <SheetClose
                  v-for="link in toolLinks"
                  :key="link.to"
                  as-child
                >
                  <NuxtLink :class="mobileLinkClass(link.to)" :to="link.to">
                    {{ link.label }}
                  </NuxtLink>
                </SheetClose>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
      <Separator />
    </header>
    <slot />
  </div>
</template>
