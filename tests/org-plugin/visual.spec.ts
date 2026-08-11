import { expect, test } from "@playwright/test";

import {
  configWithOrgPlugin,
  isConfigured,
  ORG_PLUGIN,
  readManifest,
  settle,
  SKIP_REASON,
  stubBackend,
} from "./_org-plugin";

/**
 * Pixel baselines for the org plugin's own chrome.
 *
 * This is the part of an org deployment that is *worth* snapshotting: the
 * sidebar, footer, landing page and empty state are static — no backend rows, no
 * timestamps — so they diff cleanly. The data screens are not (that's why the
 * OSS visual tier stops at the landing page).
 *
 * Baselines are written to `__screenshots__/`, which is gitignored for this tier:
 * an org's branding does not belong in the OSS repo. Keep them wherever the org
 * keeps its test artifacts and restore them before a release run.
 */

// Test titles are built at collection time, before the skip fires — so with
// ORG_PLUGIN unset they'd read "landing with  active". Fall back to a label.
const LABEL = ORG_PLUGIN || "org plugin";

test.describe("org plugin visuals", () => {
  test.skip(!isConfigured(), SKIP_REASON);

  for (const scheme of ["light", "dark"] as const) {
    test.describe(`${scheme}`, () => {
      // The shell defaults to "System" appearance, so emulating the OS scheme
      // drives light/dark without touching app state.
      test.use({ colorScheme: scheme });

      test(`landing with ${LABEL} active`, async ({ page }) => {
        await stubBackend(page, configWithOrgPlugin());
        await page.goto("/management-ui/");
        await expect(page.getByRole("link").first()).toBeVisible({ timeout: 15_000 });
        await settle(page);
        await expect(page).toHaveScreenshot(`${ORG_PLUGIN}-landing-${scheme}.png`, {
          fullPage: true,
        });
      });

      test(`landing with the ${LABEL} theme applied`, async ({ page }) => {
        const manifest = readManifest();
        const theme = manifest.namespace ?? ORG_PLUGIN;
        await stubBackend(page, configWithOrgPlugin({ theme }));
        await page.goto("/management-ui/");
        await expect(page.getByRole("link").first()).toBeVisible({ timeout: 15_000 });
        await settle(page);
        await expect(page).toHaveScreenshot(`${ORG_PLUGIN}-theme-${scheme}.png`, {
          fullPage: true,
        });
      });
    });
  }
});
