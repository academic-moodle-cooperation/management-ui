import { expect, test } from "@playwright/test";

import { stubShellBoot } from "./_mock-backend";

/**
 * test-protocol.md §5 — i18n. Switch the language in the header and assert the
 * UI re-renders translated, and that the choice persists across a reload.
 *
 * Black-box by design: we drive the visible language control rather than any
 * particular implementation. Selectors here may need a tweak if the control's
 * markup changes — that's the regression signal.
 *
 * The assertions are deliberately strict about *which* element says "Deutsch".
 * A bare `getByText(/deutsch/i)` is satisfied by the still-open menu item the
 * moment it is clicked, so an earlier version of this test reloaded before the
 * switch had finished: the language is restored after a reload from what
 * i18next caches once the German bundles have *loaded*, and under a loaded
 * machine (the full parallel suite) that load lost the race against
 * `page.reload()` — the page came back in English and the test flaked.
 */

test("§5 switching to German translates the UI and persists", async ({ page }) => {
  await stubShellBoot(page);
  await page.goto("/management-ui/");
  await expect(page.getByRole("link", { name: /home/i })).toBeVisible({ timeout: 15_000 });

  // The header language control is a button showing the current language.
  const control = (name: RegExp) => page.getByRole("button", { name });
  await control(/^english$/i).click();
  // Pick German from the opened menu (label is "Deutsch" in its own locale).
  await page.getByRole("menuitem", { name: /deutsch|german/i }).click();

  // The switch is complete only once the UI speaks German: the control shows
  // the new language and a navigation label is translated ("Series" → "Serien").
  await expect(control(/^deutsch$/i)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("link", { name: /serien/i })).toBeVisible({ timeout: 10_000 });

  // …and it survives a reload (persisted to storage).
  await page.reload();
  await expect(control(/^deutsch$/i)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("link", { name: /serien/i })).toBeVisible({ timeout: 15_000 });
});
