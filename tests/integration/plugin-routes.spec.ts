import { expect, test } from "@playwright/test";

import { GraphqlRecorder } from "./graphql-recorder";

/**
 * test-protocol.md §3 — built-in plugin routes mount and render against the real
 * backend (the §4 GraphQL data assertions live in graphql.spec.ts; here we check
 * the rendered result the user actually sees).
 *
 * Non-destructive only. The §3.2 "Create series" mutation lives in
 * create-series.spec.ts instead — it writes a series the API can't delete, so
 * it's opt-in (OPENCAST_ALLOW_MUTATIONS) and meant for a disposable backend.
 */

test("§3.2 series route renders a table", async ({ page }) => {
  await page.goto("/management-ui/series");
  await expect(page.getByRole("table")).toBeVisible({ timeout: 20_000 });
});

test("§3.3 upload route mounts without crashing", async ({ page }) => {
  // Gate on uncaught exceptions (a real crash), not console.warn/error: the
  // upload route currently logs pre-existing React "className on Fragment"
  // warnings + a 404 (tracked as a separate follow-up). Those shouldn't mask
  // the actual signal here — does the route render?
  const pageErrors: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(err.message));

  await page.goto("/management-ui/upload");
  // The upload plugin renders a dropzone region; assert the route produced real
  // content (a heading) rather than a blank/error screen.
  await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 20_000 });
  expect(pageErrors, pageErrors.join("\n")).toHaveLength(0);
});

test("§3.4 marketplace lists registered plugins", async ({ page }) => {
  const gql = GraphqlRecorder.attach(page);
  await page.goto("/management-ui/admin/marketplace/plugins");

  await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 20_000 });
  // The marketplace advertises the core plugins; "Episodes" is a stable entry.
  await expect(page.getByText(/episodes/i).first()).toBeVisible({ timeout: 20_000 });

  // Any GraphQL the marketplace fires must still honour the contracts.
  for (const call of gql.calls) {
    expect(call.operationName).toMatch(/^Mui/);
    expect(call.response?.errors, JSON.stringify(call.response?.errors)).toBeFalsy();
  }
});
