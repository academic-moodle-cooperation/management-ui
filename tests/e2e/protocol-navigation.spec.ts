import { expect, test } from "@playwright/test";

import { installMockBackend, makeEvent, makeSeries, resetSeeds } from "./_fixtures/mock-backend";

/**
 * Navigation / shell steps from the manual protocol (`tests/protocol/README.md`).
 * Each test claims a step with `[GEN-nn]`; `pnpm protocol:coverage` reconciles.
 *
 * GEN-04 and GEN-05 (Logout / Login) are only partially covered here: the real
 * behaviour is a Shibboleth round trip, and finding 021 ("Seit dem 09.01. ist
 * Logout nicht mehr möglich. Seite lädt kurz, ist dann aber wieder da") is a
 * session defect no mocked run reproduces. What is assertable is that the
 * controls exist and point at the configured auth endpoints.
 *
 * GEN-03 ("Klick auf den User (links unten)") is not here: the OSS shell has no
 * user area at all — that element comes from an org plugin's sidebar module, so
 * the step belongs to `tests/org-plugin/`, not to this tier.
 */

test.beforeEach(() => resetSeeds());

const seed = () => ({
  series: Array.from({ length: 3 }, () => makeSeries()),
  events: Array.from({ length: 3 }, () => makeEvent()),
});

test("[GEN-01] the layout adapts to the viewport without horizontal overflow", async ({ page }) => {
  await installMockBackend(page, seed());
  await page.goto("/management-ui/series");
  await expect(page.getByRole("columnheader").first()).toBeVisible({ timeout: 15_000 });

  // A page that scrolls sideways is the concrete failure behind "die Seite soll
  // sich der Bildschirmgröße anpassen und weiterhin problemlos verwendet werden
  // können" — the protocol's iOS run recorded exactly that ("man muss
  // rechts-links, oben-unten wischen").
  for (const viewport of [
    { width: 1280, height: 800 },
    { width: 1024, height: 768 },
    { width: 768, height: 1024 },
  ]) {
    await page.setViewportSize(viewport);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `horizontal overflow at ${viewport.width}px`).toBeLessThanOrEqual(1);
    await expect(page.getByRole("columnheader").first()).toBeVisible();
  }
});

test("[GEN-02] the header logo returns to the home page", async ({ page }) => {
  await installMockBackend(page, seed());
  await page.goto("/management-ui/series");
  await expect(page.getByRole("columnheader").first()).toBeVisible({ timeout: 15_000 });

  // The logo is contributed through the `app:header-logo` extension point and
  // rendered inside a link; an org plugin swaps the image, not the behaviour.
  await page.locator("header, [data-sidebar]").getByRole("link").first().click();

  await expect(page).toHaveURL(/\/management-ui\/?$/);
});

test("[GEN-07] the Home nav item opens the home page", async ({ page }) => {
  await installMockBackend(page, seed());
  await page.goto("/management-ui/episodes");
  await expect(page.getByRole("columnheader").first()).toBeVisible({ timeout: 15_000 });

  await page.getByRole("link", { name: /^home$/i }).click();

  await expect(page).toHaveURL(/\/management-ui\/?$/);
});

test("[GEN-06] the browser back button returns to the previous screen", async ({ page }) => {
  await installMockBackend(page, seed());
  await page.goto("/management-ui/");
  await expect(page.getByRole("link", { name: /^series$/i })).toBeVisible({ timeout: 15_000 });

  await page.getByRole("link", { name: /^series$/i }).click();
  await expect(page).toHaveURL(/\/series/);
  await page.getByRole("link", { name: /^videos$/i }).click();
  await expect(page).toHaveURL(/\/episodes/);

  await page.goBack();
  await expect(page).toHaveURL(/\/series/);
  await expect(page.getByRole("columnheader").first()).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/management-ui\/?$/);
});

test("[GEN-08] every in-app link leads to a screen that renders", async ({ page }) => {
  // Manual QA repeatedly found landing-page info links that were not clickable
  // and footer links leading to error pages. Dead or broken links are what
  // this step is really about.
  // No console-error assertion here on purpose: this spec issues a full page
  // load per link, and each one aborts the previous page's in-flight requests.
  // Firefox and WebKit surface those aborts as page errors ("due to access
  // control checks"), which says nothing about the links. Console cleanliness is
  // covered by smoke.spec.ts and the per-screen specs.
  await installMockBackend(page, seed());
  await page.goto("/management-ui/");
  await expect(page.getByRole("link", { name: /^home$/i })).toBeVisible({ timeout: 15_000 });

  // Internal targets only — external ones (GitHub, org help pages) are outside
  // the application and belong to the HAR/integration tiers.
  const hrefs = await page.evaluate(() =>
    [...document.querySelectorAll("a[href]")]
      .map((a) => a.getAttribute("href") ?? "")
      // The auth routes are excluded on purpose: they redirect off-origin to the
      // identity provider by design, and following that mid-sweep tears down the
      // mocked routes for everything after it (visible as "access control
      // checks" failures in Firefox and WebKit).
      .filter((href) => href.startsWith("/management-ui"))
      .filter((href) => !/\/(login|logout)\/?$/.test(href)),
  );
  expect(hrefs.length, "the shell rendered no internal links at all").toBeGreaterThan(0);

  for (const href of [...new Set(hrefs)]) {
    await page.goto(href);
    // "Renders" means the shell mounted something and the router did not fall
    // through to its not-found screen.
    await expect(page.locator("#root"), `${href} rendered nothing`).not.toBeEmpty();
    await expect(page.getByText(/not found|404/i), `${href} is a dead route`).toHaveCount(0);
  }
});

test("[GEN-04] a signed-in user is offered a way out", async ({ page }) => {
  // Partial: a mocked run cannot exercise the Shibboleth round trip, so this
  // pins only that the control is there. Finding 021 (logout stopped working —
  // "Seite lädt kurz, ist dann aber wieder da") needs a real session, so it
  // belongs to the integration tier or a HAR recording.
  await installMockBackend(page, seed());
  await page.goto("/management-ui/");

  // The label goes through `t("auth.logOut")` now — "Log out" in English,
  // "Abmelden" in German. Match the action rather than one wording.
  await expect(page.getByRole("button", { name: /^(log ?out|abmelden)$/i })).toBeVisible({
    timeout: 15_000,
  });
});

/*
 * [GEN-05] (Login) is not automated here.
 *
 * The shell derives auth from `currentUser.userRole !== "ROLE_USER_ANONYMOUS"`
 * (packages/router/src/auth/AuthContext.tsx). Modelling a real anonymous
 * session — which is what Opencast sends — does not produce a landing page with
 * a Login button: the shell renders an error screen ("Go Back" / "Back to
 * Home") instead. In a Shibboleth deployment the redirect happens before the
 * app ever loads, so the mocked path is not the path users take, and pinning it
 * would freeze an artefact rather than a requirement.
 *
 * Finding 011 (two Login buttons, one of them dead) is a landing-page layout
 * issue and would be better covered by the visual tier; finding 021 (logout
 * stopped working) needs a real session — integration tier or a HAR recording.
 */
