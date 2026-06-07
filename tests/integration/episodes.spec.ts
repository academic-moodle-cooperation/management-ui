import { expect, test } from "@playwright/test";

import { GraphqlRecorder } from "./graphql-recorder";

/**
 * test-protocol.md §3.1 — Episodes route renders against the real backend, and
 * §4.4 — sorting sends a valid `orderBy` that the real schema accepts (this is
 * exactly the path the `EventOrderByInput` regression broke: a sort field the
 * UI offered that the backend rejected, surfacing as a GraphQL `errors` array).
 *
 * Selectors here are deliberately role-based rather than text-based so they
 * don't break on i18n label changes. Confirm locally that the episodes view
 * renders a <table> (getByRole("table")) — if it ever switches to a grid/gallery
 * default, update the assertion.
 */

test("episodes list renders a table", async ({ page }) => {
  await page.goto("/management-ui/episodes");
  await expect(page.getByRole("table")).toBeVisible({ timeout: 20_000 });
});

test("sorting a column fires MuiGetMyEvents with an orderBy and no errors", async ({ page }) => {
  const gql = GraphqlRecorder.attach(page);

  await page.goto("/management-ui/episodes");
  await expect(page.getByRole("table")).toBeVisible({ timeout: 20_000 });
  await expect.poll(() => gql.byName("MuiGetMyEvents").length).toBeGreaterThan(0);

  const before = gql.byName("MuiGetMyEvents").length;

  // Each sortable header is a ghost button inside a columnheader; clicking it
  // opens a dropdown whose first item is "sort ascending" (toggleSorting(false)).
  const firstSortableHeader = page.getByRole("columnheader").locator("button").first();
  await firstSortableHeader.click();
  await page.getByRole("menuitem").first().click();

  // The sort triggers a fresh list query carrying an orderBy variable.
  await expect
    .poll(() => gql.byName("MuiGetMyEvents").length, { timeout: 20_000 })
    .toBeGreaterThan(before);

  const sortedCall = gql.byName("MuiGetMyEvents").at(-1);
  expect(sortedCall, "expected a post-sort MuiGetMyEvents call").toBeTruthy();
  expect(
    JSON.stringify(sortedCall?.variables ?? {}),
    "post-sort query should carry an orderBy variable",
  ).toContain("orderBy");
  expect(
    sortedCall?.response?.errors,
    `sorted MuiGetMyEvents returned errors: ${JSON.stringify(sortedCall?.response?.errors)}`,
  ).toBeFalsy();
  expect(sortedCall?.response?.data, "sorted MuiGetMyEvents returned no data").toBeTruthy();
});
