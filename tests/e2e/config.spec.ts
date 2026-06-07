import { expect, test } from "@playwright/test";

import { defaultConfig } from "../../packages/ui-config/src";

import { stubShellBoot } from "./_mock-backend";

/**
 * test-protocol.md §6 — Configuration is actually consumed. We serve an edited
 * `config.json` (mocked) and assert the shell's behavior changes accordingly.
 */

test("§6.2 default config activates the Episodes plugin (nav item present)", async ({ page }) => {
  await stubShellBoot(page);
  await page.goto("/management-ui/");
  await expect(page.getByRole("link", { name: /videos/i })).toBeVisible({ timeout: 15_000 });
});

test("§6.2 removing a plugin from enabledPlugins hides its nav item", async ({ page }) => {
  const config = {
    ...defaultConfig,
    app: {
      ...defaultConfig.app,
      enabledPlugins: defaultConfig.app.enabledPlugins.filter((p) => p !== "episodes"),
    },
  };
  await stubShellBoot(page, config);
  await page.goto("/management-ui/");

  // Sibling plugins still load…
  await expect(page.getByRole("link", { name: /series/i })).toBeVisible({ timeout: 15_000 });
  // …but the de-listed Episodes plugin no longer mounts its nav entry.
  await expect(page.getByRole("link", { name: /videos/i })).toHaveCount(0);
});

test("§6.5 an unknown top-level config key doesn't break boot", async ({ page }) => {
  const config = { ...defaultConfig, legacyThing: 1 } as typeof defaultConfig;
  await stubShellBoot(page, config);
  await page.goto("/management-ui/");
  // The `[key: string]: unknown` passthrough means the shell still boots.
  await expect(page.getByRole("link", { name: /home/i })).toBeVisible({ timeout: 15_000 });
});
