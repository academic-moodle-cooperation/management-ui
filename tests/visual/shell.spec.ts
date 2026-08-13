import { expect, test, type Page } from "@playwright/test";

import { defaultConfig } from "../../packages/ui-config/src";
import { settle } from "../_shared/settle";

/**
 * test-protocol.md §7 — Theming, as pixel diffs. Renders the shell against a
 * mocked backend (deterministic) so a token/theme regression shows up as a
 * screenshot diff instead of needing a human to eyeball it. Covers the default
 * theme + an alternate showcase theme (oxford-navy), each in light and dark, on
 * the landing + the episodes/series screens.
 */

type AppConfig = typeof defaultConfig;

const oxfordNavy: AppConfig = {
  ...defaultConfig,
  app: { ...defaultConfig.app, theme: "oxford-navy" },
};

// Stub the endpoints the shell hits during boot + the landing page's GitHub
// release check + gravatar — same set as the functional smoke spec. `config`
// lets a variant render with an alternate theme.
async function stubBackend(page: Page, config: AppConfig = defaultConfig): Promise<void> {
  await page.route("**/ui/config/management-ui/config.json", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(config) }),
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
  await page.route("https://www.gravatar.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "image/png", body: Buffer.from([]) }),
  );
}

const MASK = (page: Page) => ({ mask: [page.locator("footer")], fullPage: true as const });

for (const scheme of ["light", "dark"] as const) {
  test.describe(`${scheme} theme`, () => {
    // The shell defaults to "System" appearance, so emulating the OS color
    // scheme drives light/dark without touching app state.
    test.use({ colorScheme: scheme });

    test("landing — default theme", async ({ page }) => {
      await stubBackend(page);
      await page.goto("/management-ui/");
      await expect(page.getByRole("link", { name: /home/i })).toBeVisible({ timeout: 15_000 });
      await settle(page);
      await expect(page).toHaveScreenshot(`shell-landing-${scheme}.png`, MASK(page));
    });

    test("landing — oxford-navy theme", async ({ page }) => {
      await stubBackend(page, oxfordNavy);
      await page.goto("/management-ui/");
      await expect(page.getByRole("link", { name: /home/i })).toBeVisible({ timeout: 15_000 });
      await settle(page);
      await expect(page).toHaveScreenshot(`shell-landing-oxford-navy-${scheme}.png`, MASK(page));
    });

    // Per-screen visual (episodes/series tables) needs real rows to be
    // meaningful — with the mocked null backend the table never populates. Those
    // belong in a real-backend visual tier (integration); tracked as a follow-up.
  });
}
