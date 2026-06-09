import tailwindcss from "@tailwindcss/vite";

const siteBase = process.env.SITE_BASE ?? "/dxsrs-czb-wiki/";

export default defineNuxtConfig({
  compatibilityDate: "2026-06-09",
  devtools: { enabled: false },
  modules: ["shadcn-nuxt"],
  css: ["~/assets/css/tailwind.css"],
  app: {
    baseURL: siteBase.endsWith("/") ? siteBase : `${siteBase}/`,
    head: {
      htmlAttrs: { lang: "zh-CN" },
      titleTemplate: (title) => title ? `${title} - 大侠式人生重制版` : "大侠式人生重制版",
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
      ],
    },
  },
  shadcn: {
    prefix: "",
    componentDir: "./app/components/ui",
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      preserveSymlinks: true,
    },
  },
});
