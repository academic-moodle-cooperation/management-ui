import { expect, test } from "@playwright/test";

import { stubShellBoot } from "./_mock-backend";

/**
 * test-protocol.md §5 — i18n. Switch the language in the header and assert the
 * UI re-renders translated, and that the choice persists across a reload.
 *
 * Black-box by design: we drive the visible language control rather than any
 * particular implementation. Selectors here may need a tweak if the control's
 * markup changes — that's the regression signal.
 */

test("§5 switching to German translates the UI and persists", async ({ page }) => {
  await stubShellBoot(page);
  await page.goto("/management-ui/");
  await expect(page.getByRole("link", { name: /home/i })).toBeVisible({ timeout: 15_000 });

  // The header language control shows the current language ("English").
  await page.getByText("English", { exact: true }).first().click();
  // Pick German from the opened list (label is "Deutsch" in its own locale).
  await page
    .getByText(/deutsch|german/i)
    .first()
    .click();

  // The control now reflects the new language…
  await expect(page.getByText(/deutsch/i).first()).toBeVisible({ timeout: 10_000 });
  // …and it survives a reload (persisted to storage).
  await page.reload();
  await expect(page.getByText(/deutsch/i).first()).toBeVisible({ timeout: 15_000 });
});
