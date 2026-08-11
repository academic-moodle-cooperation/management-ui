import { expect, test } from "@playwright/test";

import { installMockBackend, makeEvent, resetSeeds } from "./_fixtures/mock-backend";

import type { Page } from "@playwright/test";

/**
 * #287 — a failed metadata save must not look like a successful one.
 *
 * Before the fix, the sidebar closed unconditionally right after firing the
 * mutation: no error toast, edits gone, the table silently unchanged. The
 * only difference to a successful save was the missing success toast.
 */

test.beforeEach(() => resetSeeds());

/** Same three-level edit mask as the protocol specs. */
async function editFirstFieldAndSave(page: Page, value: string): Promise<void> {
  const panel = page.locator('[role="dialog"], aside').first();
  await page.getByRole("button", { name: /^edit$/i }).click();
  await page
    .getByRole("button", { name: /^edit$/i })
    .first()
    .click();
  await panel.getByRole("textbox").last().fill(value);

  const save = page.getByRole("button", { name: /^save$/i });
  await expect(save, "Save stayed disabled — the edit never registered as a change").toBeEnabled();
  await save.click();
}

test("a rejected save shows an error, keeps the panel open, and the edit survives a retry", async ({
  page,
}) => {
  const backend = await installMockBackend(page, {
    events: [makeEvent({ title: "Vorher" })],
    failOperations: ["MuiUpdateEvent"],
  });
  await page.goto("/management-ui/episodes");

  await expect(page.getByRole("cell", { name: "Vorher" })).toBeVisible({ timeout: 15_000 });
  await page.getByRole("cell", { name: "Vorher" }).click();
  await editFirstFieldAndSave(page, "Nachher");

  // The failure is visible…
  const errorToast = page.getByText(/failed to save|konnten nicht gespeichert/i);
  await expect(errorToast).toBeVisible({ timeout: 10_000 });
  // …the panel stayed open with the edit intact…
  const panel = page.locator('[role="dialog"], aside').first();
  await expect(panel.getByRole("textbox").last()).toHaveValue("Nachher");
  // …and nothing was persisted.
  expect(backend.events[0]?.title).toBe("Vorher");

  // Backend recovers → the SAME kept edit saves on retry. The error toast
  // renders bottom-right ON TOP of the Save button and sonner pauses its
  // auto-dismiss timer depending on page focus, so in headless runs it may
  // never leave — and even a force-click goes by coordinates and would hit
  // the toast. Dispatch the click event straight on the button instead;
  // the overlay is an incidental toast, not a real modal.
  backend.failOperations.delete("MuiUpdateEvent");
  await page.getByRole("button", { name: /^save$/i }).dispatchEvent("click");

  await expect(page.getByText(/have been saved|wurden gespeichert/i)).toBeVisible({
    timeout: 10_000,
  });
  await expect.poll(() => backend.events[0]?.title, { timeout: 10_000 }).toBe("Nachher");
});
