import { expect, test } from "@playwright/test";

import { GraphqlRecorder } from "./graphql-recorder";

/**
 * test-protocol.md §3.2 / §4.3 — the "Create series" dialog actually creates a
 * series via MuiCreateSeries against the real backend.
 *
 * This is a WRITE: it leaves a series behind, and the API exposes no
 * series-delete to clean up. So it is **opt-in** — it only runs when
 * OPENCAST_ALLOW_MUTATIONS is set, which you should do *only* against a
 * disposable backend (your local podman stack), never a shared one. Each run
 * uses a unique, identifiable title so repeats don't collide.
 */
test.skip(
  !process.env["OPENCAST_ALLOW_MUTATIONS"],
  "mutating spec — set OPENCAST_ALLOW_MUTATIONS=1 against a disposable backend",
);

test("§3.2 Create series creates a series (MuiCreateSeries, no errors)", async ({ page }) => {
  const gql = GraphqlRecorder.attach(page);
  const title = `E2E Series ${Date.now()}`;

  await page.goto("/management-ui/series");
  await expect(page.getByRole("table")).toBeVisible({ timeout: 20_000 });

  // Open the dialog from the table toolbar.
  await page.getByRole("button", { name: "Create series" }).click();

  // The title field has a stable id; filling it enables the submit button.
  const titleField = page.locator("#create-series-title");
  await expect(titleField).toBeVisible({ timeout: 10_000 });
  await titleField.fill(title);

  // Submit ("Create" in the dialog footer; "Cancel" is the other button).
  await page.getByRole("dialog").getByRole("button", { name: "Create", exact: true }).click();

  // The mutation must round-trip with data and no errors.
  await expect
    .poll(() => gql.byName("MuiCreateSeries").length, { timeout: 20_000 })
    .toBeGreaterThan(0);
  const call = gql.byName("MuiCreateSeries").at(-1);
  expect(
    call?.response?.errors,
    `MuiCreateSeries returned errors: ${JSON.stringify(call?.response?.errors)}`,
  ).toBeFalsy();
  expect(call?.response?.data, "MuiCreateSeries returned no data").toBeTruthy();

  // On success the component closes the dialog — a robust UI-level signal that
  // doesn't depend on where the new row lands in a paginated list.
  await expect(titleField).toBeHidden({ timeout: 15_000 });
});
