import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;
const BASE_URL = `http://127.0.0.1:${PORT}/management-ui/`;

/**
 * Browser matrix — the manual protocol's result columns, run as projects.
 *
 * The wiki protocol has one result column per browser/device and a human walks
 * every step in each of them. Those columns are this array: the specs in
 * `tests/e2e/` are written once and executed across all of them.
 *
 * | Protocol column           | Project here          |
 * |---------------------------|-----------------------|
 * | Chrome/Edge               | chromium              |
 * | Firefox                   | firefox               |
 * | Safari                    | webkit                |
 * | Android (Tablet) Chrome   | tablet-android        |
 * | iOS (Tablet) Safari       | tablet-ios            |
 * | Android (Tablet) Firefox  | — see below           |
 *
 * **Android Firefox has no project.** Playwright cannot drive Firefox with
 * device emulation (`isMobile` is Chromium/WebKit only), so a "firefox with a
 * tablet viewport" project would claim a coverage it doesn't have. That column
 * is also empty in all 94 rows of the protocol — it was never actually tested.
 *
 * **Emulation is not the real device.** WebKit-on-Linux is not iOS Safari, and
 * an emulated tablet is not a touchscreen. The protocol's own NOKs prove the
 * gap: the iPad search losing focus after 1–3 characters (finding 019) and
 * hover-only tooltips that "worked with the Apple Pencil" are input-stack
 * behaviours no emulator reproduces. Those rows stay manual — see
 * `tests/protocol/README.md`.
 *
 * Kept separate from `playwright.config.ts` on purpose: that one stays
 * single-browser so `pnpm verify` remains a fast pre-push gate. This one is the
 * pre-release sweep.
 *
 *   pnpm test:matrix:install   # one-time: chromium + firefox + webkit
 *   pnpm test:matrix
 *   pnpm test:matrix --project=webkit
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 1 : 0,
  timeout: 60_000,
  reporter: [["list"], ["html", { outputFolder: "playwright-report-matrix", open: "never" }]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    // Landscape on purpose: both the "View" menu and the layout toggle are
    // `hidden lg:flex`, so below 1024px they aren't rendered at all and the
    // column-visibility steps would fail for a reason that has nothing to do
    // with the browser. Portrait tablets need their own, narrower expectations.
    { name: "tablet-android", use: { ...devices["Galaxy Tab S4 landscape"] } },
    { name: "tablet-ios", use: { ...devices["iPad Pro 11 landscape"] } },
  ],
  webServer: {
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
