import { defineConfig } from "astro/config";

const siteBase = process.env.SITE_BASE ?? "/dxsrs-czb-wiki";

export default defineConfig({
  site: "https://akisameee.github.io",
  base: siteBase,
  output: "static",
  trailingSlash: "always",
  vite: {
    resolve: {
      preserveSymlinks: true,
    },
  },
});
