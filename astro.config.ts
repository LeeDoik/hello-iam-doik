import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://hello-iam-doik.vercel.app",
  trailingSlash: "always",
  build: { format: "directory" },
  i18n: {
    defaultLocale: "ko",
    locales: ["ko", "en"],
    routing: { prefixDefaultLocale: false },
  },
});
