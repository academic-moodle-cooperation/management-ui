import { defineConfig, devices } from "@playwright/test";

const BASE_URL = "http://127.0.0.1:3000/management-ui/";

/**
 * §11 marketplace CDN-load tier. Mocked backend (the Developer-Tools install
 * flow is entirely client-side + localStorage). globalSetup scaffolds + builds
 * a plugin so the dev server serves a real importable bundle for the install.
 */
export default defineConfig({
  testDir: "./tests/marketplace",
  globalSetup: "./tests/marketplace/global-setup.ts",
  globalTeardown: "./tests/marketplace/global-teardown.ts",
  fullyParallel: false,
  timeout: 90_000,
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
