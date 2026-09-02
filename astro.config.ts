import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://hello-iam-doik.vercel.app",
  trailingSlash: "always",
  build: { format: "directory" },
});
