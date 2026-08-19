import { expect, test } from "@playwright/test";

import { defaultConfig } from "../../packages/ui-config/src";

import { installMockBackend, makeEvent } from "./_fixtures/mock-backend";
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

test("§6.2 episodesTable column config sets the default; the user's toggle wins and persists", async ({
  page,
}) => {
  // A deployment that lists columns enumerates its table: `show: false` (and
  // anything unlisted) starts hidden — but stays in the View menu, where the
  // user's own toggle wins over the config default (#80).
  const config = {
    ...defaultConfig,
    plugins: {
      ...defaultConfig.plugins,
      episodes: {
        episodesTable: {
          columns: [
            { title: { show: true } },
            { seriesName: { show: false } },
            { actions: { show: true } },
          ],
        },
      },
    },
  };
  await installMockBackend(page, { config, events: [makeEvent({ seriesName: "Physik I" })] });
  await page.goto("/management-ui/episodes");

  await expect(page.getByRole("columnheader", { name: /^title$/i })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByRole("columnheader", { name: /^series$/i })).toHaveCount(0);

  // The user re-enables the column via the View menu — their choice beats the
  // config default…
  await page.getByRole("button", { name: "View", exact: true }).click();
  await page.getByRole("menuitemcheckbox", { name: /^series/i }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("columnheader", { name: /^series$/i })).toBeVisible();

  // …and keeps beating it after a reload, because the toggle persists.
  await page.reload();
  await expect(page.getByRole("columnheader", { name: /^title$/i })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByRole("columnheader", { name: /^series$/i })).toBeVisible();
});
