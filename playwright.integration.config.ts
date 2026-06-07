import { defineConfig, devices } from "@playwright/test";

import { OPENCAST_BASE_URL, SHELL_BASE_URL, STORAGE_STATE } from "./tests/integration/opencast-env";

/**
 * Integration-E2E config — the **real podman Opencast** tier of the test
 * pyramid (see docs/operations/test-automation-plan.md). Distinct from the
 * mocked-backend smoke suite in playwright.config.ts.
 *
 * Architecture: Playwright drives the shell dev server at 127.0.0.1:3000, and
 * the shell's Vite proxy forwards /graphql, /info/me.json, /j_spring_security_*,
 * and plugins.json to OPENCAST_BASE_URL. We run with VITE_LOCAL_CONFIG=true so
 * the committed default config (which enables the core plugins we test) drives
 * activation, while data + auth still hit the live backend — the §6
 * "real data/auth, local config" mode.
 *
 * globalSetup health-checks (optionally starts) Opencast; the `setup` project
 * logs in once and saves a storageState the `chromium` project reuses.
 */
export default defineConfig({
  testDir: "./tests/integration",
  globalSetup: "./tests/integration/global-setup.ts",
  fullyParallel: false,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 1 : 0,
  // Real backend round-trips are slower than the mocked smoke; give specs room.
  timeout: 90_000,
  reporter: [["list"], ["html", { outputFolder: "playwright-report-integration", open: "never" }]],
  use: {
    baseURL: SHELL_BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: STORAGE_STATE,
      },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "pnpm --filter shell dev",
    url: SHELL_BASE_URL,
    timeout: 180_000,
    reuseExistingServer: !process.env["CI"],
    stdout: "pipe",
    stderr: "pipe",
    env: {
      // Proxy data + auth to the live Opencast…
      VITE_PROXY_TARGET: OPENCAST_BASE_URL,
      // …but serve the committed default config locally so the core plugins
      // under test are enabled regardless of the backend's deployment config.
      VITE_LOCAL_CONFIG: "true",
    },
  },
});
