import { mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { expect, test } from "@playwright/test";

import {
  installMockBackend,
  makeEvent,
  makeSeries,
  resetSeeds,
} from "../e2e/_fixtures/mock-backend";
import { settle } from "../_shared/settle";

import type { Page } from "@playwright/test";

/**
 * The documentation screenshots, generated.
 *
 * Not a test in the assert-something sense: each case drives the shell to one
 * screen and writes a PNG to `docs/public/screenshots/`. The images are
 * committed and referenced from the docs as `/screenshots/<name>.png` —
 * VitePress prefixes the site `base` at build time. Regenerate with
 * `pnpm docs:screenshots`; see `playwright.docs.config.ts` for why this tier
 * exists separately from the visual-regression one.
 *
 * The corpus below is deliberately small, English and invented. English
 * because the shipped default config is `"locale": "en"` and a German fixture
 * would produce screenshots that contradict the running UI (the `make*`
 * factories default to German strings for the protocol specs' benefit, so
 * every visible field is overridden here). Invented because the repo rule is
 * that nothing generic-looking may carry a real course, person, room or
 * organization name.
 */

const OUT_DIR = resolve(__dirname, "../../docs/public/screenshots");
const REPO_ROOT = resolve(__dirname, "../..");

/** Product version, from the canonical VERSION file at the repo root. */
const APP_VERSION = readFileSync(resolve(REPO_ROOT, "VERSION"), "utf8").trim();

test.beforeAll(() => mkdirSync(OUT_DIR, { recursive: true }));

// The corpus is built once, at import time, so every capture in this file sees
// the same ids — `resetSeeds()` first, so those ids do not depend on whatever
// else the worker imported.
resetSeeds();

const SERIES = [
  makeSeries({
    title: "Introduction to Databases",
    created: "2026-02-02T08:00:00Z",
    description: "Relational modelling, SQL and transactions.",
    creator: "Alex Roe",
    contributors: ["Alex Roe"],
    eventCount: 12,
  }),
  makeSeries({
    title: "Linear Algebra",
    created: "2026-02-03T08:00:00Z",
    description: "Vector spaces, matrices and eigenvalues.",
    creator: "Jamie Poe",
    contributors: ["Jamie Poe"],
    eventCount: 9,
  }),
  makeSeries({
    title: "Software Engineering Basics",
    created: "2026-02-04T08:00:00Z",
    description: "Requirements, design patterns and testing.",
    creator: "Robin Doe",
    contributors: ["Robin Doe", "Alex Roe"],
    eventCount: 7,
  }),
  makeSeries({
    title: "Media Technology Lab",
    created: "2026-02-05T08:00:00Z",
    description: "Recording, encoding and streaming workflows.",
    creator: "Sam Loe",
    contributors: ["Sam Loe"],
    eventCount: 4,
  }),
];

const event = (
  title: string,
  seriesIndex: number,
  presenter: string,
  location: string,
  day: number,
  extra: Parameters<typeof makeEvent>[0] = {},
) =>
  makeEvent({
    title,
    seriesId: SERIES[seriesIndex]!.id,
    seriesName: SERIES[seriesIndex]!.title,
    creator: presenter,
    presenters: [presenter],
    location,
    created: `2026-03-${String(day).padStart(2, "0")}T09:15:00Z`,
    startDate: `2026-03-${String(day).padStart(2, "0")}T09:15:00Z`,
    ...extra,
  });

const EVENTS = [
  event("Lecture 1 — Relational Model", 0, "Alex Roe", "Lecture Hall A", 12, {
    description: "Tables, keys and the relational algebra behind them.",
    duration: "PT1H28M",
  }),
  event("Lecture 2 — Writing SQL Queries", 0, "Alex Roe", "Lecture Hall A", 11, {
    duration: "PT1H31M",
  }),
  event("Lecture 3 — Transactions and Locking", 0, "Alex Roe", "Lecture Hall A", 10, {
    duration: "PT1H12M",
    displayableStatus: "PROCESSING",
    eventStatus: "PROCESSING",
  }),
  event("Vector Spaces and Bases", 1, "Jamie Poe", "Seminar Room 2", 9, { duration: "PT52M" }),
  event("Eigenvalues in Practice", 1, "Jamie Poe", "Seminar Room 2", 6, { duration: "PT47M" }),
  event("Design Patterns Walkthrough", 2, "Robin Doe", "Seminar Room 5", 5, {
    duration: "PT1H04M",
  }),
  event("Writing Your First Test Suite", 2, "Robin Doe", "Seminar Room 5", 4, {
    duration: "PT58M",
  }),
  event("Studio Recording Basics", 3, "Sam Loe", "Recording Studio", 3, { duration: "PT36M" }),
];

const DEMO_USER = {
  username: "jdoe",
  name: "Jordan Doe",
  email: "jordan.doe@example.invalid",
  roles: ["ROLE_ADMIN"],
};

/**
 * Freeze the footer's build info. Install BEFORE `page.goto`.
 *
 * The footer renders `Management UI v<version> · <short git sha>`, and the sha
 * changes with every commit — so an unhandled footer makes every screenshot
 * churn on every push. The visual tier solves this by *masking* the footer,
 * which paints a black rectangle: fine for a pixel diff, unusable in
 * documentation, where a black bar reads as a broken UI.
 *
 * So: stub instead of mask. The line is rewritten to the version the repo's
 * VERSION file declares, dropping the commit link — exactly what a deployment
 * without a known commit shows. Nothing is hidden and nothing is invented; the
 * screenshots simply stop depending on which commit generated them.
 *
 * It has to be a MutationObserver rather than a single patch just before the
 * shot: the tables refetch in the background, and a React re-render restores
 * the original text between the patch and the screenshot. That race is exactly
 * how the first run of this spec produced two shots with a sha and two without.
 * The observer is self-quieting — it only writes when the text differs, so its
 * own write does not re-trigger it.
 */
async function pinBuildInfo(page: Page): Promise<void> {
  await page.addInitScript((version) => {
    const wanted = `Management UI v${version}`;
    const pin = () => {
      for (const span of document.querySelectorAll("footer span")) {
        if (span.textContent !== wanted && /^Management UI v/.test(span.textContent ?? "")) {
          span.textContent = wanted;
        }
      }
    };
    const start = () => {
      pin();
      new MutationObserver(pin).observe(document.body, { childList: true, subtree: true });
    };
    if (document.body) start();
    else document.addEventListener("DOMContentLoaded", start);
  }, APP_VERSION);
}

/** The mocked backend plus the deterministic footer — the shared per-shot setup. */
async function openShell(page: Page): Promise<void> {
  await installMockBackend(page, { series: SERIES, events: EVENTS, user: DEMO_USER });
  await pinBuildInfo(page);
}

/**
 * Full-page rather than viewport: the tables are the point, and a full-page
 * capture keeps the whole toolbar → table → pagination → footer story in one
 * image instead of cutting it at 800px.
 */
async function capture(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: resolve(OUT_DIR, `${name}.png`), fullPage: true });
}

for (const scheme of ["light", "dark"] as const) {
  test.describe(`${scheme}`, () => {
    // The shell defaults to "System" appearance, so emulating the OS colour
    // scheme drives light/dark without touching app state.
    test.use({ colorScheme: scheme });

    test(`episodes list — ${scheme}`, async ({ page }) => {
      await openShell(page);
      await page.goto("/management-ui/episodes");

      await expect(page.getByRole("cell", { name: "Lecture 1 — Relational Model" })).toBeVisible({
        timeout: 15_000,
      });
      await settle(page);
      await capture(page, `episodes-list-${scheme}`);
    });

    test(`episode details in edit mode — ${scheme}`, async ({ page }) => {
      await openShell(page);
      await page.goto("/management-ui/episodes");

      const row = page.getByRole("cell", { name: "Lecture 1 — Relational Model" });
      await expect(row).toBeVisible({ timeout: 15_000 });
      await row.click();

      // The sidebar opens read-only; "Edit" flips it into the editable mask,
      // which is the state the docs describe (panel → Edit → pencil → Save).
      await page.getByRole("button", { name: /^edit$/i }).click();
      await expect(page.getByRole("button", { name: /^save$/i })).toBeVisible({ timeout: 10_000 });

      await settle(page);
      await capture(page, `episode-details-edit-${scheme}`);
    });

    test(`upload — ${scheme}`, async ({ page }) => {
      await openShell(page);
      await page.goto("/management-ui/upload");

      await expect(page.getByRole("button", { name: /select files/i })).toBeVisible({
        timeout: 15_000,
      });
      await settle(page);
      await capture(page, `upload-${scheme}`);
    });

    test(`series list — ${scheme}`, async ({ page }) => {
      await openShell(page);
      await page.goto("/management-ui/series");

      await expect(page.getByRole("cell", { name: "Introduction to Databases" })).toBeVisible({
        timeout: 15_000,
      });
      await settle(page);
      await capture(page, `series-list-${scheme}`);
    });
  });
}
