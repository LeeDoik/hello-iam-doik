import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: "http://localhost:4321", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm preview --host 127.0.0.1 --port 4321",
    url: "http://localhost:4321/",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    // Astro auto-backgrounds `preview` when it detects an agent-driven shell (Windows CI/agent
    // environments included), which detaches the process Playwright is watching and makes it
    // report "Process from config.webServer exited early." Force foreground mode so the process
    // Playwright spawns stays attached for the lifetime of the test run.
    env: { ASTRO_PREVIEW_BACKGROUND: "1" },
  },
});
