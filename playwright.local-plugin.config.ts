import { defineConfig, devices } from "@playwright/test";

const BASE_URL = "http://127.0.0.1:3000/management-ui/";

/**
 * §9 .local-plugins dev-loading check. Driven by scripts/verify-local-plugin.sh,
 * which scaffolds + builds the demo plugin *before* this config's webServer
 * boots the shell dev server — so the dev server's local-plugins scan sees it.
 */
export default defineConfig({
  testDir: "./tests/local-plugin",
  globalSetup: "./tests/local-plugin/global-setup.ts",
  globalTeardown: "./tests/local-plugin/global-teardown.ts",
  timeout: 60_000,
  reporter: [["list"]],
  use: { baseURL: BASE_URL },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm --filter shell dev",
    url: BASE_URL,
    timeout: 180_000,
    reuseExistingServer: false,
    stdout: "pipe",
    stderr: "pipe",
  },
});
