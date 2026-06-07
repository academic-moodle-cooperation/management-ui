import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;
const BASE_URL = `http://127.0.0.1:${PORT}/management-ui/`;

/**
 * Visual-regression tier (test-protocol.md §7 / testing.md Follow-up #6).
 * Separate from the functional smoke (playwright.config.ts) and the real-backend
 * integration tier — this one is pixel-diffing, gated on its own command.
 *
 * It runs against a MOCKED backend (the specs stub the shell's boot endpoints),
 * so snapshots are deterministic and don't need a real Opencast.
 *
 * Flake control: fixed viewport, reduced motion, animations disabled + fonts
 * awaited in-spec, dynamic regions masked, and a small pixel tolerance.
 *
 * Baselines are environment-sensitive (font rendering differs across OS/GPU).
 * Generate them in the SAME environment you'll compare in:
 *   pnpm test:visual:update     # writes tests/visual/__screenshots__/**
 *   pnpm test:visual            # compares
 * For CI, regenerate inside the CI container and commit those — see
 * tests/visual/README.md. Do not mix baselines from different environments.
 */
export default defineConfig({
  testDir: "./tests/visual",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: 0,
  timeout: 60_000,
  snapshotPathTemplate: "{testDir}/__screenshots__/{testFilePath}/{arg}{ext}",
  reporter: [["list"], ["html", { outputFolder: "playwright-report-visual", open: "never" }]],
  expect: {
    toHaveScreenshot: {
      // Absorb sub-pixel font/AA noise without hiding real theme regressions.
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    },
  },
  use: {
    baseURL: BASE_URL,
    reducedMotion: "reduce",
    viewport: { width: 1280, height: 800 },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: {
    command: "pnpm --filter shell dev",
    url: BASE_URL,
    timeout: 180_000,
    reuseExistingServer: !process.env["CI"],
    stdout: "pipe",
    stderr: "pipe",
  },
});
