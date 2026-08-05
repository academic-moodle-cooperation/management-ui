import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;
const BASE_URL = `http://127.0.0.1:${PORT}/management-ui/`;

/**
 * Org-plugin tier — contract + visual coverage for a plugin under
 * `.local-plugins/`.
 *
 * Org plugins are excluded from every existing gate: `.local-plugins/` is
 * gitignored, and `pnpm verify` runs with `--filter='!./.local-plugins/*'`. That
 * leaves the org-specific surface — the part users actually see, and the part
 * the manual protocol spends its time on — with no automated coverage at all.
 * This tier closes that gap without pulling org code into the OSS repo: the
 * machinery is tracked, the plugin is supplied per machine.
 *
 *   ORG_PLUGIN=univie pnpm test:org-plugin
 *   ORG_PLUGIN=univie pnpm test:org-plugin:update   # (re)record visual baselines
 *
 * With ORG_PLUGIN unset every spec skips and no dev server starts.
 *
 * Runs against a MOCKED backend but a REAL plugin: the specs stub the shell's
 * boot endpoints while the dev server serves `.local-plugins/<name>/` from disk.
 * Local plugins only load in dev mode, so this tier must use `vite dev`.
 */
const orgPlugin = process.env["ORG_PLUGIN"] ?? "";
const configured = orgPlugin.length > 0 && existsSync(resolve(".local-plugins", orgPlugin));

export default defineConfig({
  testDir: "./tests/org-plugin",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: 0,
  timeout: 60_000,
  snapshotPathTemplate: "{testDir}/__screenshots__/{testFilePath}/{arg}{ext}",
  reporter: [["list"], ["html", { outputFolder: "playwright-report-org", open: "never" }]],
  expect: {
    toHaveScreenshot: {
      // Same tolerance as the OSS visual tier — absorbs sub-pixel font/AA noise
      // without hiding a real theme regression.
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    },
  },
  use: {
    baseURL: BASE_URL,
    reducedMotion: "reduce",
    viewport: { width: 1280, height: 800 },
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
  ],
  ...(configured
    ? {
        webServer: {
          command: "pnpm --filter shell dev",
          url: BASE_URL,
          timeout: 180_000,
          // Never reuse: a stray dev server pointed at a real backend would
          // serve live data and the wrong config into the snapshots.
          reuseExistingServer: false,
          stdout: "pipe" as const,
          stderr: "pipe" as const,
        },
      }
    : {}),
});
