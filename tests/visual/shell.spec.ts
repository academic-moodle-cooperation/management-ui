import { expect, test, type Page } from "@playwright/test";

import { defaultConfig } from "../../packages/ui-config/src";

/**
 * test-protocol.md §7 — Theming, as pixel diffs. Renders the shell against a
 * mocked backend (deterministic) in light and dark, so a token/theme regression
 * shows up as a screenshot diff instead of needing a human to eyeball it.
 */

// Stub the four endpoints the shell hits during boot + the landing page's
// GitHub release check — same set as the functional smoke spec.
async function stubBackend(page: Page): Promise<void> {
  await page.route("**/ui/config/management-ui/config.json", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(defaultConfig),
    }),
  );
  await page.route("**/management-tool/ui/config/plugins.json", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ plugins: [] }),
    }),
  );
  await page.route("**/info/me.json", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ user: null }),
    }),
  );
  await page.route("**/graphql", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: null }),
    }),
  );
  await page.route("https://api.github.com/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ tag_name: "v0.0.0" }),
    }),
  );
}

// Kill anything that moves (caret, transitions, animations) and wait for web
// fonts before snapshotting — the big sources of cross-run pixel noise.
async function settle(page: Page): Promise<void> {
  await page.addStyleTag({
    content:
      "*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important;}",
  });
  await page.evaluate(() => document.fonts.ready);
}

for (const scheme of ["light", "dark"] as const) {
  test.describe(`${scheme} theme`, () => {
    // The shell defaults to "System" appearance, so emulating the OS color
    // scheme drives the theme without touching app state.
    test.use({ colorScheme: scheme });

    test("shell landing page", async ({ page }) => {
      await stubBackend(page);
      await page.goto("/management-ui/");
      await expect(page.getByRole("link", { name: /home/i })).toBeVisible({ timeout: 15_000 });
      await settle(page);

      await expect(page).toHaveScreenshot(`shell-landing-${scheme}.png`, {
        fullPage: true,
        // Footer carries the build version + commit sha, which vary per build.
        mask: [page.locator("footer")],
      });
    });
  });
}
