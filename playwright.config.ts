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
    // CI runs against the production build via `vite preview` (the E2E job
    // builds the SDK + shell first): it serves prebuilt assets, so there is no
    // dev-mode on-demand transform. The dev-server path had a long history of
    // cold-start timeouts on 2-core runners (#140's 120s→180s bump; with dist
    // as the canonical entry point, "ready" grew to ~170s and the first
    // page.goto exceeded the 60s test timeout), and preview also exercises
    // what actually ships. Locally the dev server is used (and reused if
    // already running) so the iterate loop keeps HMR and needs no build.
    command: process.env["CI"]
      ? "pnpm --filter shell preview -- --port 3000 --strictPort"
      : "pnpm --filter shell dev",
    url: BASE_URL,
    timeout: 180_000,
    reuseExistingServer: !process.env["CI"],
    stdout: "pipe",
    stderr: "pipe",
  },
});
