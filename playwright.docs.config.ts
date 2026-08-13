import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;
const BASE_URL = `http://127.0.0.1:${PORT}/management-ui/`;

/**
 * Documentation-screenshot tier — the images embedded in `docs/use/**` and
 * friends are *generated*, not hand-maintained.
 *
 * Modelled on `playwright.visual.config.ts` (same viewport, same reduced
 * motion, same clean mocked-backend dev server), with one deliberate
 * difference: these captures are **never diffed**. There is no
 * `expect.toHaveScreenshot` block and no `snapshotPathTemplate`, because
 * nothing compares them against a baseline — the spec writes PNGs straight to
 * `docs/public/screenshots/` with `page.screenshot({ path })` and those files
 * are committed. That is what makes this tier immune to the font-rendering
 * drift that forces the visual baselines to be regenerated per environment:
 * a screenshot taken on macOS and one taken on Linux are both simply *correct*
 * documentation images.
 *
 * Regenerate after a UI change that makes the shipped images stale:
 *
 *   pnpm docs:screenshots        # rewrites docs/public/screenshots/*.png
 *   git add docs/public/screenshots && git commit
 *
 * It is not part of `pnpm verify`: it produces artefacts, it does not assert.
 */
export default defineConfig({
  testDir: "./tests/docs-screenshots",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: 0,
  timeout: 60_000,
  reporter: [["list"], ["html", { outputFolder: "playwright-report-docs", open: "never" }]],
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
    // Same reason as the visual tier: reusing a stray dev server (e.g. one
    // pointed at a real backend) silently photographs the wrong UI — an
    // org theme or landing plugin instead of the shipped default. Documentation
    // must show what a stock install looks like, so always boot a clean one.
    reuseExistingServer: false,
    stdout: "pipe",
    stderr: "pipe",
  },
});
