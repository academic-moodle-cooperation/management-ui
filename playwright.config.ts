import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;
const BASE_URL = `http://127.0.0.1:${PORT}/management-ui/`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 1 : 0,
  // Cold-start CI runs report Vite ready in ~80–90s and the first
  // page.goto then triggers full module compilation, so the default 30s
  // per-test timeout intermittently expires on the boot path. Bump to 60s
  // to absorb that without leaning on the retry.
  timeout: 60_000,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // Cold-start CI was budgeted at 120s when the comment near `timeout`
    // above was written. The lockfile has grown since, and runs against
    // GitHub-hosted runners have started exhausting the 120s ceiling
    // (see #140's two consecutive failures with `pnpm --filter shell dev`
    // never reaching "ready"). Bump to 180s to restore margin without
    // leaning on a retry.
    command: "pnpm --filter shell dev",
    url: BASE_URL,
    timeout: 180_000,
    reuseExistingServer: !process.env["CI"],
    stdout: "pipe",
    stderr: "pipe",
  },
});
