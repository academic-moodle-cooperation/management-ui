import { expect, test } from "@playwright/test";

import { GraphqlRecorder } from "./graphql-recorder";

/**
 * test-protocol.md §4 — GraphQL data flow, automated against the *real*
 * Opencast schema (this is what mocked CI can't do: catch schema drift like the
 * `EventOrderByInput` sort regression).
 *
 * For every GraphQL operation the shell fires while loading a route we assert:
 *   1. the operation name carries the `Mui` prefix (Operation Naming Contract), and
 *   2. the response has a top-level `data` and **no** `errors` array.
 *
 * Runs authenticated (storageState from auth.setup.ts), so the "my events" /
 * "my series" queries actually return data instead of an auth error.
 */

function assertHealthyCall(call: {
  operationName: string;
  response: { data?: unknown; errors?: unknown[] } | null;
}) {
  expect(call.operationName, "operation must carry the Mui prefix").toMatch(/^Mui/);
  expect(call.response, `${call.operationName} returned no JSON body`).not.toBeNull();
  expect(
    call.response?.errors,
    `${call.operationName} returned GraphQL errors: ${JSON.stringify(call.response?.errors)}`,
  ).toBeFalsy();
  expect(call.response?.data, `${call.operationName} returned no data`).toBeTruthy();
}

test("episodes route: MuiGetMyEvents returns data, not errors", async ({ page }) => {
  const gql = GraphqlRecorder.attach(page);

  await page.goto("/management-ui/episodes");
  // Wait until the list query has actually round-tripped.
  await expect
    .poll(() => gql.byName("MuiGetMyEvents").length, {
      message: `saw operations: ${gql.operationNames().join(", ")}`,
      timeout: 20_000,
    })
    .toBeGreaterThan(0);

  for (const call of gql.byName("MuiGetMyEvents")) assertHealthyCall(call);
});

test("series route: MuiGetMySeries returns data, not errors", async ({ page }) => {
  const gql = GraphqlRecorder.attach(page);

  await page.goto("/management-ui/series");
  await expect
    .poll(() => gql.byName("MuiGetMySeries").length, {
      message: `saw operations: ${gql.operationNames().join(", ")}`,
      timeout: 20_000,
    })
    .toBeGreaterThan(0);

  for (const call of gql.byName("MuiGetMySeries")) assertHealthyCall(call);
});

test("every GraphQL operation the shell fires is healthy (Mui-named, data, no errors)", async ({
  page,
}) => {
  const gql = GraphqlRecorder.attach(page);

  // A single route load fires several operations (current user, the list query,
  // lookups). Drive a couple of routes to widen coverage.
  await page.goto("/management-ui/episodes");
  await expect.poll(() => gql.calls.length, { timeout: 20_000 }).toBeGreaterThan(0);
  await page.goto("/management-ui/series");
  await page.waitForTimeout(2_000);

  // Every op the shell fires must honour the §4 contract end-to-end: the Mui
  // naming prefix *and* a healthy response (data, no errors). This used to be
  // relaxed to naming-only because the shell fired MuiGetSeriesNameById with a
  // null identifier for series-less events and the backend rejected it; that
  // bug is now fixed (the lookup is guarded with `enabled: Boolean(seriesId)`),
  // so the full guarantee holds across the board.
  expect(gql.calls.length, "expected the shell to fire GraphQL").toBeGreaterThan(0);
  for (const call of gql.calls) assertHealthyCall(call);
});
