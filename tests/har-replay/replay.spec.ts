import { expect, test } from "@playwright/test";

import { listRecordings } from "./_recordings";

/**
 * Replay a tester's sanitized recording against a local shell.
 *
 * The HAR supplies the *backend* — config.json, plugins.json, /info/me.json,
 * every /graphql response, and (if the recording covered them) the org plugin
 * bundles served from the deployment's JARs. Anything the HAR doesn't cover
 * falls through to the live dev server, which serves the app's own modules.
 *
 * Net effect: the org-specific deployment the testers walk through by hand boots
 * locally and in CI, with its real config and real data shapes, without CI ever
 * touching that deployment. This is the tier that turns a manual pass into a
 * permanent regression test — see docs/contribute/manual-test-recording.md.
 */

const recordings = listRecordings();

// Noise that isn't a product defect: dev-server plumbing and the favicon probe.
// The websocket entry is specific to this tier — Vite's HMR client can't complete
// its upgrade handshake while routeFromHAR is intercepting, which has nothing to
// do with the recording under test.
const IGNORED_CONSOLE = [
  /\[vite\]/i,
  /favicon/i,
  /Download the React DevTools/i,
  /net::ERR_ABORTED.*\/@(vite|react-refresh)/i,
  /WebSocket connection to 'ws:\/\/[^']*' failed/i,
];

test.describe("HAR replay", () => {
  // See contract.spec.ts — an empty recordings dir must skip, not fail the run.
  if (recordings.length === 0) {
    test.skip("no recordings in tests/har-replay/recordings/ — see docs/contribute/manual-test-recording.md", () => {});
  }

  for (const recording of recordings) {
    test(`${recording.name} — shell boots against the recorded backend`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() !== "error") return;
        const text = msg.text();
        if (IGNORED_CONSOLE.some((re) => re.test(text))) return;
        consoleErrors.push(text);
      });
      page.on("pageerror", (err) => consoleErrors.push(err.message));

      // `fallback` (not `abort`): the recording covers the backend, the dev
      // server covers the app's own modules — their URLs never match a HAR entry
      // because the recorded deployment served a production build.
      await page.routeFromHAR(recording.path, { url: "**/*", notFound: "fallback" });

      await page.goto("/management-ui/");

      await expect(page).toHaveTitle(/.+/);
      // The shell mounted and rendered navigation — deliberately structural
      // rather than label-based, so an org plugin that replaces the sidebar
      // labels still satisfies it.
      await expect(page.locator("#root")).not.toBeEmpty();
      await expect(page.getByRole("link").first()).toBeVisible({ timeout: 15_000 });

      expect(consoleErrors, consoleErrors.join("\n")).toHaveLength(0);
    });
  }
});
