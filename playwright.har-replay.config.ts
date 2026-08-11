import { existsSync, readdirSync } from "node:fs";

import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;
const BASE_URL = `http://127.0.0.1:${PORT}/management-ui/`;
const RECORDINGS_DIR = "tests/har-replay/recordings";

/**
 * HAR-replay tier — the manual test protocol, captured and replayed.
 *
 * Testers record their session (DevTools → Network → "Save all as HAR with
 * content"), run it through `pnpm har:sanitize`, and drop the result into
 * tests/har-replay/recordings/. The specs then (a) assert on the recorded
 * payloads statically and (b) boot the shell with the recording standing in for
 * the backend.
 *
 * Why its own tier: the recordings come from a real, org-specific deployment
 * (config, JAR plugins, real data shapes) that neither the mocked smoke suite
 * nor the vanilla podman integration suite ever sees.
 *
 * Recordings are gitignored — the machinery is shared, the data is not. With an
 * empty recordings dir every spec skips and no dev server is started.
 *
 * See docs/operations/manual-test-recording.md.
 */
const hasRecordings =
  existsSync(RECORDINGS_DIR) && readdirSync(RECORDINGS_DIR).some((f) => f.endsWith(".har"));

export default defineConfig({
  testDir: "./tests/har-replay",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: 0,
  timeout: 60_000,
  reporter: [["list"], ["html", { outputFolder: "playwright-report-har", open: "never" }]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Only pay for a dev server when there is something to replay. The static
  // contract specs would run without it, but Playwright starts webServer for the
  // whole run, so gating it keeps the empty case instant.
  ...(hasRecordings
    ? {
        webServer: {
          command: "pnpm --filter shell dev",
          url: BASE_URL,
          timeout: 180_000,
          // Never reuse: a stray dev server pointed at a real backend would
          // serve live data through the parts the HAR doesn't cover.
          reuseExistingServer: false,
          stdout: "pipe" as const,
          stderr: "pipe" as const,
        },
      }
    : {}),
});
