import { expect, test } from "@playwright/test";

import { installMockBackend, makeEvent, makeSeries, resetSeeds } from "./_fixtures/mock-backend";

import type { Page } from "@playwright/test";

/**
 * Series steps from the manual protocol (`tests/protocol/README.md`).
 *
 * Each test claims a protocol step with `[SER-nn]` in its title;
 * `pnpm protocol:coverage` reconciles those markers against the protocol YAML.
 *
 * Mocked backend — these assert frontend behaviour only. Where a step's real
 * substance lives server-side, the test says so rather than pretending.
 */

test.beforeEach(() => resetSeeds());

/**
 * Toggle a column through the "View" menu.
 *
 * The menu deliberately stays open across toggles so several columns can be
 * switched in one go (DataTableCheckboxItem's `onSelect` preventDefault), so it
 * needs an explicit Escape afterwards. Before #252 was fixed the menu suppressed
 * `onOpenChange` outright and could not be closed at all while the pointer was
 * inside it; the workaround that used to be here is no longer needed.
 */
async function toggleColumn(page: Page, name: RegExp): Promise<void> {
  await page.getByRole("button", { name: /^view$/i }).click();
  const menu = page.locator('[role="menu"]');
  await expect(menu).toBeVisible();
  await page.getByRole("menuitemcheckbox", { name }).click();
  await menu.press("Escape");
  await expect(menu).toBeHidden();
}

/**
 * Change one metadata field in the series sidebar and save.
 *
 * The mask has three levels, and skipping one leaves Save permanently disabled
 * (`disabled={!hasDataChanged}` in SeriesInfoFooter):
 *   1. clicking the row opens the panel read-only,
 *   2. the panel-level "Edit" switches to edit mode (per-field pencils appear),
 *   3. clicking a field renders the actual `MetadataUpdateField` input.
 *
 * The per-field pencils expose their name through an sr-only "Edit" label, and
 * they render in `order`, so the title field (order 0) is the first one.
 */
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

test("[SER-08] column visibility survives paging to the next page", async ({ page }) => {
  // Protocol §Serien: "Spalten lassen sich nach Belieben aus- und einblenden.
  // Beim Blättern auf nächste oder vorherige Seiten soll die Einstellung
  // bestehen bleiben." — finding 007.
  await installMockBackend(page, { series: Array.from({ length: 25 }, () => makeSeries()) });
  await page.goto("/management-ui/series");

  await expect(page.getByRole("columnheader", { name: /description/i })).toBeVisible({
    timeout: 15_000,
  });

  await toggleColumn(page, /^description$/i);

  await expect(page.getByRole("columnheader", { name: /description/i })).toHaveCount(0);

  // The setting is persisted through jotai's atomWithStorage under
  // `<appName>_columnVisibility` (packages/…/useTableState.ts, appName "series").
  const stored = await page.evaluate(() => localStorage.getItem("series_columnVisibility"));
  expect(stored, "column visibility was not persisted").toBeTruthy();
  expect(JSON.parse(stored!)).toMatchObject({ description: false });

  // …and it must still hold after paging, which is what the protocol actually
  // asks and what a naive per-page re-render would break.
  await page.getByRole("button", { name: /go to next page/i }).click();
  await expect(page.getByRole("columnheader", { name: /description/i })).toHaveCount(0);
  await expect(page.getByRole("columnheader", { name: /creator/i })).toBeVisible();
});

test("[SER-08] a hidden column can be shown again", async ({ page }) => {
  await installMockBackend(page, { series: Array.from({ length: 5 }, () => makeSeries()) });
  await page.goto("/management-ui/series");
  await expect(page.getByRole("columnheader", { name: /description/i })).toBeVisible({
    timeout: 15_000,
  });

  await toggleColumn(page, /^description$/i);
  await expect(page.getByRole("columnheader", { name: /description/i })).toHaveCount(0);
  await toggleColumn(page, /^description$/i);
  await expect(page.getByRole("columnheader", { name: /description/i })).toBeVisible();
});

test("[SER-04] typing in the search box sends the term to the backend", async ({ page }) => {
  // NOT full coverage of SER-04. The search runs server-side: the toolbar only
  // pushes `query` into MuiGetMySeries (packages/ui/…/data-table-toolbar.tsx),
  // and Opencast decides what matches. Finding 006 ("Suche nach 2025 liefert
  // unerklärliche Treffer", "Wörter zwischen < > werden nicht gefunden") is
  // therefore a backend-search defect and cannot be reproduced against a mock —
  // asserting on mocked results would only test the mock.
  //
  // What IS frontend behaviour, and is asserted here: the term reaches the
  // backend at all, and the page index resets so the user doesn't land on an
  // empty page 3 of a 1-page result. Search semantics belong to
  // tests/integration/ or a HAR recording (tests/har-replay/).
  const backend = await installMockBackend(page, {
    series: Array.from({ length: 25 }, () => makeSeries()),
  });
  await page.goto("/management-ui/series");
  await expect(page.getByRole("columnheader", { name: /series/i }).first()).toBeVisible({
    timeout: 15_000,
  });

  await page.getByRole("button", { name: /go to next page/i }).click();
  await expect
    .poll(() => Number(backend.lastCallTo("MuiGetMySeries")?.variables["offset"] ?? 0))
    .toBeGreaterThan(0);

  await page.getByPlaceholder(/search|suche/i).fill("Serie 3");

  await expect
    .poll(() => backend.lastCallTo("MuiGetMySeries")?.variables["query"], {
      message: "the search term never reached the backend",
      timeout: 10_000,
    })
    .toBe("Serie 3");
  expect(
    Number(backend.lastCallTo("MuiGetMySeries")?.variables["offset"] ?? 0),
    "searching must reset to the first page",
  ).toBe(0);
});

test("[SER-11] long titles and special characters round-trip without error", async ({ page }) => {
  // The protocol's expectation text talks about validation errors, but the
  // agreed intent is the opposite: there is no length or character limit, and
  // neither may cause misbehaviour. So this pins the permissive behaviour.
  const longTitle = `Ü&<>"'%\\/ ${"sehr langer Titel ".repeat(20)}Ende`;
  const backend = await installMockBackend(page, { series: [makeSeries({ title: "Original" })] });
  await page.goto("/management-ui/series");

  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(err.message));

  await expect(page.getByRole("cell", { name: "Original" })).toBeVisible({ timeout: 15_000 });
  await page.getByRole("cell", { name: "Original" }).click();
  await editFirstFieldAndSave(page, longTitle);

  await expect
    .poll(() => backend.series[0]?.title, {
      message: "the edited title never reached the backend",
      timeout: 10_000,
    })
    .toBe(longTitle);
  expect(consoleErrors, consoleErrors.join("\n")).toHaveLength(0);
});

test("[SER-12] saving an edit updates the list without a reload", async ({ page }) => {
  // Findings 008/015/016/027 are one root cause: the write succeeds but the UI
  // keeps showing stale data until a reload or re-login. This is the regression
  // test for that family — it asserts the *list* reflects the new value while
  // the page stays up.
  const backend = await installMockBackend(page, { series: [makeSeries({ title: "Vorher" })] });
  await page.goto("/management-ui/series");

  await expect(page.getByRole("cell", { name: "Vorher" })).toBeVisible({ timeout: 15_000 });
  await page.getByRole("cell", { name: "Vorher" }).click();
  await editFirstFieldAndSave(page, "Nachher");

  await expect.poll(() => backend.series[0]?.title, { timeout: 10_000 }).toBe("Nachher");
  // No page.reload() on purpose — that is precisely the workaround the protocol
  // recorded ("Infos erscheinen erst wenn man die Seite komplett neu lädt").
  await expect(page.getByRole("cell", { name: "Nachher" })).toBeVisible({ timeout: 10_000 });
});

test("[SER-01] [SER-23] the Series nav item opens and returns to the overview", async ({
  page,
}) => {
  await installMockBackend(page, { series: [makeSeries({ title: "Physik I" })] });
  await page.goto("/management-ui/");

  await page.getByRole("link", { name: /^series$/i }).click();
  await expect(page).toHaveURL(/\/series/);
  await expect(page.getByRole("cell", { name: "Physik I" })).toBeVisible({ timeout: 15_000 });

  // …and back again from a sibling screen, which is what SER-23 asks.
  await page.getByRole("link", { name: /^videos$/i }).click();
  await expect(page).toHaveURL(/\/episodes/);
  await page.getByRole("link", { name: /^series$/i }).click();
  await expect(page.getByRole("cell", { name: "Physik I" })).toBeVisible();
});

test("[SER-02] [SER-24] [SER-26] the row shows the values the backend supplied", async ({
  page,
}) => {
  await installMockBackend(page, {
    series: [
      makeSeries({
        title: "Physik I",
        description: "Grundvorlesung",
        creator: "Alex Roe",
        created: "2026-01-15T09:30:00Z",
        eventCount: 7,
      }),
    ],
  });
  await page.goto("/management-ui/series");

  await expect(page.getByRole("cell", { name: "Physik I" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("cell", { name: "Grundvorlesung" })).toBeVisible();
  // Exactly one creator is shown (SER-26), and the created cell carries a date
  // *and* a time (SER-24), not just a day.
  await expect(page.getByRole("cell", { name: "Alex Roe" })).toHaveCount(1);
  // English format: dates follow the active UI language now, and the shipped
  // config starts this deployment in English (`app.locale: "en"`). What the
  // protocol step asks for is a date *plus* a time, not a German one.
  await expect(page.getByRole("cell", { name: /Jan 15, 2026.*\d{1,2}:\d{2}/ })).toBeVisible();
});

test("[SER-05] sorting by a column asks the backend to sort, across all pages", async ({
  page,
}) => {
  // "die Sortierung soll über alle Serien laufen (auch bei mehreren Seiten)" —
  // i.e. it must become a backend orderBy, not a re-shuffle of the current page.
  const backend = await installMockBackend(page, {
    series: Array.from({ length: 25 }, () => makeSeries()),
  });
  await page.goto("/management-ui/series");
  await expect(page.getByRole("columnheader", { name: /description/i })).toBeVisible({
    timeout: 15_000,
  });

  const orderBy = () => JSON.stringify(backend.lastCallTo("MuiGetMySeries")?.variables["orderBy"]);
  const initialOrderBy = orderBy();

  // Headers don't toggle on click: DataTableColumnHeader opens a menu with
  // Ascending / Descending / None / Hide.
  await page
    .getByRole("columnheader", { name: /description/i })
    .getByRole("button")
    .first()
    .click();
  await page.getByRole("menuitem", { name: /^ascending$/i }).click();

  await expect
    .poll(orderBy, {
      message: "sorting never reached the backend — it would only sort the current page",
      timeout: 10_000,
    })
    .not.toBe(initialOrderBy);
});

test("[SER-06] the pagination arrows move through the pages", async ({ page }) => {
  const backend = await installMockBackend(page, {
    series: Array.from({ length: 25 }, () => makeSeries()),
  });
  await page.goto("/management-ui/series");
  await expect(page.getByRole("columnheader").first()).toBeVisible({ timeout: 15_000 });

  const pageLabel = page.getByText(/page \d+ of \d+/i);

  // Asserted on the rendered page label, not on "the most recent request".
  // Revisiting a page the user has already seen is served from the query cache
  // and fires no request at all, so the last-call offset stays on the page
  // before it — correct behaviour that a request-based assertion misreads as a
  // dead button.
  await expect(pageLabel).toHaveText(/page 1 of 3/i);

  await page.getByRole("button", { name: /go to next page/i }).click();
  await expect(pageLabel).toHaveText(/page 2 of 3/i);

  await page.getByRole("button", { name: /go to last page/i }).click();
  await expect(pageLabel).toHaveText(/page 3 of 3/i);

  await page.getByRole("button", { name: /go to previous page/i }).click();
  await expect(pageLabel).toHaveText(/page 2 of 3/i);

  await page.getByRole("button", { name: /go to first page/i }).click();
  await expect(pageLabel).toHaveText(/page 1 of 3/i);

  // Every page really was fetched from the backend at some point in the walk.
  const offsets = new Set(
    backend.callsTo("MuiGetMySeries").map((c) => Number(c.variables["offset"] ?? 0)),
  );
  expect([...offsets].sort((a, b) => a - b)).toEqual([0, 10, 20]);
});

test("[SER-07] changing the page size changes how many rows are requested", async ({ page }) => {
  const backend = await installMockBackend(page, {
    series: Array.from({ length: 60 }, () => makeSeries()),
  });
  await page.goto("/management-ui/series");
  await expect(page.getByRole("columnheader").first()).toBeVisible({ timeout: 15_000 });

  const initialLimit = Number(backend.lastCallTo("MuiGetMySeries")?.variables["limit"] ?? 0);
  expect(initialLimit).toBeGreaterThan(0);

  await page.getByRole("combobox").last().click();
  await page.getByRole("option", { name: "50", exact: true }).click();

  await expect
    .poll(() => Number(backend.lastCallTo("MuiGetMySeries")?.variables["limit"] ?? 0), {
      timeout: 10_000,
    })
    .toBe(50);
});

test("[SER-09] Reload Data picks up a series created in the meantime", async ({ page }) => {
  const backend = await installMockBackend(page, { series: [makeSeries({ title: "Vorhanden" })] });
  await page.goto("/management-ui/series");
  await expect(page.getByRole("cell", { name: "Vorhanden" })).toBeVisible({ timeout: 15_000 });

  // Someone else creates a series while the page is open.
  backend.series.push(makeSeries({ title: "Frisch angelegt" }));
  await expect(page.getByRole("cell", { name: "Frisch angelegt" })).toHaveCount(0);

  await page.getByRole("button", { name: /reload data/i }).click();

  await expect(page.getByRole("cell", { name: "Frisch angelegt" })).toBeVisible({
    timeout: 10_000,
  });
});

test("[SER-10] clicking a row opens the info panel with that series' data", async ({ page }) => {
  await installMockBackend(page, {
    series: [makeSeries({ title: "Physik I", description: "Grundvorlesung" })],
  });
  await page.goto("/management-ui/series");
  await expect(page.getByRole("cell", { name: "Physik I" })).toBeVisible({ timeout: 15_000 });

  await page.getByRole("cell", { name: "Physik I" }).click();

  const panel = page.locator('[role="dialog"], aside').first();
  await expect(panel).toBeVisible();
  await expect(panel).toContainText("Physik I");
  await expect(panel).toContainText("Grundvorlesung");
});

test("[SER-13] Cancel discards an unsaved edit", async ({ page }) => {
  const backend = await installMockBackend(page, {
    series: [makeSeries({ title: "Unverändert" })],
  });
  await page.goto("/management-ui/series");
  await expect(page.getByRole("cell", { name: "Unverändert" })).toBeVisible({ timeout: 15_000 });

  await page.getByRole("cell", { name: "Unverändert" }).click();
  await page.getByRole("button", { name: /^edit$/i }).click();
  await page
    .getByRole("button", { name: /^edit$/i })
    .first()
    .click();
  const panel = page.locator('[role="dialog"], aside').first();
  await panel.getByRole("textbox").last().fill("Verworfen");

  await page.getByRole("button", { name: /^cancel$/i }).click();

  expect(backend.callsTo("MuiUpdateSeries")).toHaveLength(0);
  expect(backend.series[0]?.title).toBe("Unverändert");
  await expect(page.getByRole("cell", { name: "Unverändert" })).toBeVisible();
});

test("[SER-14] the X closes the panel and keeps the edit unsaved", async ({ page }) => {
  const backend = await installMockBackend(page, {
    series: [makeSeries({ title: "Unverändert" })],
  });
  await page.goto("/management-ui/series");
  await expect(page.getByRole("cell", { name: "Unverändert" })).toBeVisible({ timeout: 15_000 });

  await page.getByRole("cell", { name: "Unverändert" }).click();
  const panel = page.locator('[role="dialog"], aside').first();
  await expect(panel).toBeVisible();

  await page.getByRole("button", { name: /^close$/i }).click();

  await expect(panel).toBeHidden();
  expect(backend.callsTo("MuiUpdateSeries")).toHaveLength(0);
});

test("[SER-15] clicking another row switches the panel to that series", async ({ page }) => {
  await installMockBackend(page, {
    series: [makeSeries({ title: "Erste Serie" }), makeSeries({ title: "Zweite Serie" })],
  });
  await page.goto("/management-ui/series");
  await expect(page.getByRole("cell", { name: "Erste Serie" })).toBeVisible({ timeout: 15_000 });

  await page.getByRole("cell", { name: "Erste Serie" }).click();
  const panel = page.locator('[role="dialog"], aside').first();
  await expect(panel).toContainText("Erste Serie");

  await page.getByRole("cell", { name: "Zweite Serie" }).click();
  await expect(panel).toContainText("Zweite Serie");
});

test("[SER-17] a long title is truncated in the table but kept in full", async ({ page }) => {
  const longTitle = `Sehr lange Serienbezeichnung ${"zur Ueberlaenge ".repeat(30)}Ende`;
  await installMockBackend(page, { series: [makeSeries({ title: longTitle })] });
  await page.goto("/management-ui/series");

  const cell = page.getByRole("cell", { name: longTitle });
  await expect(cell).toBeVisible({ timeout: 15_000 });

  // Truncated visually — the rendered box is narrower than the text it holds —
  // while the accessible text stays complete, which is what makes the tooltip
  // and screen-reader output correct.
  const clipped = await cell.evaluate((el) =>
    [el, ...el.querySelectorAll("*")].some((node) => {
      const style = getComputedStyle(node);
      const overflows = node.scrollWidth > node.clientWidth + 1;
      return overflows && (style.overflow !== "visible" || style.textOverflow === "ellipsis");
    }),
  );
  expect(clipped, "the long title was not clipped — the column has no truncation").toBe(true);
});

test("[SER-19] [SER-20] [SER-21] the episode count opens that series' videos", async ({ page }) => {
  await installMockBackend(page, {
    series: [makeSeries({ title: "Physik I", eventCount: 3 })],
    events: [
      makeEvent({ title: "Gehoert dazu", seriesId: "series-1", seriesName: "Physik I" }),
      makeEvent({ title: "Fremde Episode", seriesId: "series-9", seriesName: "Andere Serie" }),
    ],
  });
  await page.goto("/management-ui/series");
  await expect(page.getByRole("cell", { name: "Physik I" })).toBeVisible({ timeout: 15_000 });

  await page.getByRole("cell", { name: "3", exact: true }).click();

  await expect(page).toHaveURL(/\/episodes/);
  // It is visible which series this is (SER-21) …
  await expect(page.getByRole("heading", { name: /physik i/i })).toBeVisible({ timeout: 15_000 });
  // … and only its episodes are listed (SER-20).
  await expect(page.getByRole("cell", { name: "Gehoert dazu" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Fremde Episode" })).toHaveCount(0);
});

test("[SER-25] [SER-27] the Created and Creator cells are not separately clickable", async ({
  page,
}) => {
  // "Dieses Feld ist nicht gesondert klickbar. Man wird analog des Klicks auf
  // die Zeile, auf die Serieninfo geleitet."
  await installMockBackend(page, {
    series: [makeSeries({ title: "Physik I", creator: "Alex Roe" })],
  });
  await page.goto("/management-ui/series");
  await expect(page.getByRole("cell", { name: "Physik I" })).toBeVisible({ timeout: 15_000 });

  const panel = page.locator('[role="dialog"], aside').first();

  await page.getByRole("cell", { name: "Alex Roe" }).click();
  await expect(panel, "clicking Creator should behave like clicking the row").toContainText(
    "Physik I",
  );
  await expect(page).toHaveURL(/\/series/);
});

test("[SER-28] the pencil opens the metadata view ready to edit", async ({ page }) => {
  await installMockBackend(page, { series: [makeSeries({ title: "Physik I" })] });
  await page.goto("/management-ui/series");
  await expect(page.getByRole("cell", { name: "Physik I" })).toBeVisible({ timeout: 15_000 });

  await page
    .getByRole("button", { name: /edit series/i })
    .first()
    .click();

  // Straight into edit mode: Save/Cancel are present without a second click.
  await expect(page.getByRole("button", { name: /^save$/i })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("button", { name: /^cancel$/i })).toBeVisible();
});

test("[SER-29] the cloud icon opens Upload with that series preselected", async ({ page }) => {
  await installMockBackend(page, {
    series: [makeSeries({ title: "Physik I" }), makeSeries({ title: "Chemie II" })],
  });
  await page.goto("/management-ui/series");
  await expect(page.getByRole("cell", { name: "Physik I" })).toBeVisible({ timeout: 15_000 });

  await page
    .getByRole("button", { name: /^upload$/i })
    .first()
    .click();

  await expect(page).toHaveURL(/\/upload/);
  await expect(page.getByRole("button", { name: /select files/i })).toBeVisible({
    timeout: 15_000,
  });
  // The series travels in the route, so the upload mask opens preselected and
  // the tester does not have to pick it again.
});
