import { expect, test } from "@playwright/test";

import { installMockBackend, makeEvent, makeSeries, resetSeeds } from "./_fixtures/mock-backend";

import type { Page } from "@playwright/test";

/**
 * Videos steps from the manual protocol (`tests/protocol/README.md`).
 * Each test claims a step with `[VID-nn]`; `pnpm protocol:coverage` reconciles.
 *
 * Mocked backend — frontend behaviour only. See protocol-series.spec.ts for the
 * same caveat about server-side search.
 */

test.beforeEach(() => resetSeeds());

/** See protocol-series.spec.ts — the menu stays open across toggles by design. */
async function toggleColumn(page: Page, name: RegExp): Promise<void> {
  await page.getByRole("button", { name: /^view$/i }).click();
  const menu = page.locator('[role="menu"]');
  await expect(menu).toBeVisible();
  await page.getByRole("menuitemcheckbox", { name }).click();
  await menu.press("Escape");
  await expect(menu).toBeHidden();
}

/** Same three-level mask as the series sidebar; see protocol-series.spec.ts. */
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

test("[VID-02] the list renders the fields the backend supplied", async ({ page }) => {
  // Finding 010: series language was not carried over to the event. The general
  // shape of that step — "Felder sind entsprechend den Informationen, die in der
  // Admin hinterlegt sind, befüllt" — is what's pinned here.
  await installMockBackend(page, {
    series: [makeSeries()],
    events: [
      makeEvent({
        title: "Vorlesung Mechanik",
        seriesName: "Physik I",
        location: "Hörsaal C1",
        presenters: ["Alex Roe"],
      }),
    ],
  });
  await page.goto("/management-ui/episodes");

  await expect(page.getByRole("cell", { name: "Vorlesung Mechanik" })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByRole("cell", { name: "Physik I" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Alex Roe" })).toBeVisible();
});

test("[VID-29] the Origin column shows the event location", async ({ page }) => {
  // Finding 003: "Location wird bei Videos nicht als Spalte der Tabelle
  // angezeigt, obwohl in der Config aktiviert."
  await installMockBackend(page, {
    events: [makeEvent({ title: "Mit Ort", location: "Hörsaal C1" })],
  });
  await page.goto("/management-ui/episodes");

  await expect(page.getByRole("columnheader", { name: /origin|herkunft/i })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByRole("cell", { name: "Hörsaal C1" })).toBeVisible();
});

test("[VID-16] column visibility survives paging to the next page", async ({ page }) => {
  // Finding 007, the episodes half of the same defect as [SER-08].
  await installMockBackend(page, { events: Array.from({ length: 25 }, () => makeEvent()) });
  await page.goto("/management-ui/episodes");

  await expect(page.getByRole("columnheader", { name: /^description$/i })).toBeVisible({
    timeout: 15_000,
  });
  await toggleColumn(page, /^description$/i);
  await expect(page.getByRole("columnheader", { name: /^description$/i })).toHaveCount(0);

  const stored = await page.evaluate(() => localStorage.getItem("episodes_columnVisibility"));
  expect(stored, "column visibility was not persisted").toBeTruthy();
  expect(JSON.parse(stored!)).toMatchObject({ description: false });

  await page.getByRole("button", { name: /go to next page/i }).click();
  await expect(page.getByRole("columnheader", { name: /^description$/i })).toHaveCount(0);
});

test("[VID-19] long titles and special characters round-trip without error", async ({ page }) => {
  // Same agreed intent as [SER-11]: no length or character limit, and neither
  // may cause misbehaviour.
  const longTitle = `Ü&<>"'%\\/ ${"sehr langer Titel ".repeat(20)}Ende`;
  const backend = await installMockBackend(page, { events: [makeEvent({ title: "Original" })] });
  await page.goto("/management-ui/episodes");

  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(err.message));

  await expect(page.getByRole("cell", { name: "Original" })).toBeVisible({ timeout: 15_000 });
  await page.getByRole("cell", { name: "Original" }).click();
  await editFirstFieldAndSave(page, longTitle);

  await expect
    .poll(() => backend.events[0]?.title, {
      message: "the edited title never reached the backend",
      timeout: 10_000,
    })
    .toBe(longTitle);
  expect(consoleErrors, consoleErrors.join("\n")).toHaveLength(0);
});

test("[VID-21] saving an edit updates the list without a reload", async ({ page }) => {
  // The 008/015 family on the episodes side: the write lands but the UI keeps
  // showing stale data until a reload or re-login.
  const backend = await installMockBackend(page, { events: [makeEvent({ title: "Vorher" })] });
  await page.goto("/management-ui/episodes");

  await expect(page.getByRole("cell", { name: "Vorher" })).toBeVisible({ timeout: 15_000 });
  await page.getByRole("cell", { name: "Vorher" }).click();
  await editFirstFieldAndSave(page, "Nachher");

  await expect.poll(() => backend.events[0]?.title, { timeout: 10_000 }).toBe("Nachher");
  // Deliberately no reload — that is the workaround the protocol recorded.
  await expect(page.getByRole("cell", { name: "Nachher" })).toBeVisible({ timeout: 10_000 });
});

test("[VID-04] typing in the search box sends the term to the backend", async ({ page }) => {
  // Partial coverage only — see the long note on [SER-04]. The search itself is
  // server-side, so finding 006 cannot be reproduced against a mock.
  const backend = await installMockBackend(page, {
    events: Array.from({ length: 25 }, () => makeEvent()),
  });
  await page.goto("/management-ui/episodes");
  await expect(page.getByRole("columnheader", { name: /^title$/i })).toBeVisible({
    timeout: 15_000,
  });

  await page.getByPlaceholder(/search|suche/i).fill("Video 7");
  await expect
    .poll(() => backend.lastCallTo("MuiGetMyEvents")?.variables["query"], { timeout: 10_000 })
    .toBe("Video 7");
});

/**
 * The layout toggle's accessible name reflects the TARGET state (#254):
 * "Switch to gallery view" while the list is showing, "Switch to list view"
 * in the gallery — the same information a screen reader announces.
 */
const layoutToggle = (page: Page) =>
  page.getByRole("button", { name: /switch to gallery view/i });

test("[VID-32] the action icons are present and point at the right targets", async ({ page }) => {
  // Finding 028 ("kein Hinweistext über Download-Button") and 014 (the editor
  // link 404s). We can pin the contract — that the buttons exist, are named, and
  // build the documented URLs — but not that the editor answers; that target
  // lives outside the Management UI.
  await installMockBackend(page, { events: [makeEvent({ title: "Mit Aktionen" })] });
  await page.goto("/management-ui/episodes");
  await expect(page.getByRole("cell", { name: "Mit Aktionen" })).toBeVisible({ timeout: 15_000 });

  const row = page.getByRole("row").nth(1);
  // #42: both views show the same three direct actions; Download and the
  // delete actions live behind "More actions".
  for (const name of ["Edit Data", "Edit Video", "Play Video", "More actions"]) {
    await expect(row.getByRole("button", { name, exact: true }), `${name} missing`).toBeVisible();
  }
  await expect(row.getByRole("button", { name: "Download", exact: true })).toHaveCount(0);
  await row.getByRole("button", { name: "More actions", exact: true }).click();
  await expect(page.getByRole("menuitem", { name: /download/i })).toBeVisible();
  await page.keyboard.press("Escape");

  // Editor and player are plain links, so their href is assertable even though
  // the destinations are other applications.
  await expect(row.locator('a[href*="/editor-ui/index.html"]')).toHaveAttribute(
    "href",
    /mediaPackageId=event-\d+/,
  );
  await expect(row.locator('a[href*="/play/"]')).toBeVisible();

  // …and the pencil opens the metadata sidebar rather than navigating away.
  await row.getByRole("button", { name: "Edit Data", exact: true }).click();
  await expect(page.getByRole("button", { name: /^save$/i })).toBeVisible({ timeout: 10_000 });
});

test("[VID-38] the default delete is a soft delete, and Cancel really cancels", async ({
  page,
}) => {
  // Findings 018 and 029: "Bei Klick auf den Delete Button passiert nichts" and
  // "Buttons die hinter den 3 Punkten versteckt sind funktionieren nicht".
  //
  // The protocol's expectation is a *recycle bin*: "wird das Video in der
  // Admin-ui in die Papierkorbserie gelegt. Für den User sieht es so aus, als
  // wäre es wirklich gelöscht." That is `mui.deleteEvent` (MuiDeleteEvent), not
  // the index-level removal — so this asserts which mutation the UI picks, not
  // just that the row disappears.
  const backend = await installMockBackend(page, {
    events: [makeEvent({ title: "Zu löschen" }), makeEvent({ title: "Bleibt" })],
  });
  await page.goto("/management-ui/episodes");
  await expect(page.getByRole("cell", { name: "Zu löschen" })).toBeVisible({ timeout: 15_000 });

  const row = page.getByRole("row").nth(1);
  const openTrashDialog = async () => {
    await row.getByRole("button", { name: "More actions", exact: true }).click();
    await page.getByRole("menuitem", { name: /move to trash/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
  };

  // Rejecting must leave everything alone — "bei Ablehnung darf nichts passieren."
  await openTrashDialog();
  await expect(page.getByRole("heading", { name: /move video to trash\?/i })).toBeVisible();
  await page.getByRole("button", { name: /^cancel$/i }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  expect(backend.callsTo("MuiDeleteEvent")).toHaveLength(0);
  await expect(page.getByRole("cell", { name: "Zu löschen" })).toBeVisible();

  // Confirming soft-deletes exactly the one event.
  await openTrashDialog();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /move to trash/i })
    .click();

  await expect.poll(() => backend.callsTo("MuiDeleteEvent").length, { timeout: 10_000 }).toBe(1);
  expect(
    backend.callsTo("MuiDeleteEventPermanently"),
    "the default action must not remove the event from the index",
  ).toHaveLength(0);
  await expect(page.getByRole("cell", { name: "Zu löschen" })).toHaveCount(0, { timeout: 10_000 });
  await expect(page.getByRole("cell", { name: "Bleibt" })).toBeVisible();
});

test("[VID-38] an admin can delete permanently, with its own confirmation", async ({ page }) => {
  const backend = await installMockBackend(page, {
    events: [makeEvent({ title: "Endgültig weg" })],
    user: {
      username: "admin",
      name: "Admin User",
      email: "admin@example.invalid",
      roles: ["ROLE_ADMIN"],
    },
  });
  await page.goto("/management-ui/episodes");
  await expect(page.getByRole("cell", { name: "Endgültig weg" })).toBeVisible({ timeout: 15_000 });

  await page
    .getByRole("row")
    .nth(1)
    .getByRole("button", { name: "More actions", exact: true })
    .click();
  await page.getByRole("menuitem", { name: /delete permanently/i }).click();

  // A distinct dialog, so the irreversible action cannot be confused with the
  // recoverable one — the heading says "permanently", the body says
  // "permanently and irreversibly".
  await expect(page.getByRole("heading", { name: /delete video permanently\?/i })).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText(/permanently and irreversibly/i);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /^delete$/i })
    .click();

  await expect
    .poll(() => backend.callsTo("MuiDeleteEventPermanently").length, { timeout: 10_000 })
    .toBe(1);
  expect(backend.callsTo("MuiDeleteEvent")).toHaveLength(0);
});

test("[VID-38] a non-admin is not offered permanent deletion", async ({ page }) => {
  // The gate authorizes against the granted roles array; a plain user holds
  // neither ROLE_ADMIN nor the organization's configured admin role.
  await installMockBackend(page, {
    events: [makeEvent({ title: "Nur Papierkorb" })],
    user: {
      username: "tester",
      name: "Test User",
      email: "tester@example.invalid",
      roles: ["ROLE_USER"],
    },
  });
  await page.goto("/management-ui/episodes");
  await expect(page.getByRole("cell", { name: "Nur Papierkorb" })).toBeVisible({ timeout: 15_000 });

  await page
    .getByRole("row")
    .nth(1)
    .getByRole("button", { name: "More actions", exact: true })
    .click();

  await expect(page.getByRole("menuitem", { name: /move to trash/i })).toBeVisible();
  await expect(
    page.getByRole("menuitem", { name: /delete permanently/i }),
    "permanent deletion must stay admin-only",
  ).toHaveCount(0);
});

test("[VID-09] the gallery view shows a preview image", async ({ page }) => {
  // Finding 013: "Vorschaubild bei optionaler Ansicht der Videotabelle wird
  // nicht angezeigt."
  await installMockBackend(page, {
    events: [makeEvent({ title: "Mit Vorschau", hasPreview: true })],
  });
  await page.goto("/management-ui/episodes");
  await expect(page.getByRole("cell", { name: "Mit Vorschau" })).toBeVisible({ timeout: 15_000 });

  await layoutToggle(page).click();

  await expect(page.locator('img[src*="thumb"]').first()).toBeVisible({ timeout: 10_000 });
});

test("[VID-11] the action buttons still work in the gallery view", async ({ page }) => {
  // Findings 014/018/020: "Buttons reagieren wie erwartet" was NOK in the
  // gallery view specifically — several were missing or did nothing there.
  const backend = await installMockBackend(page, { events: [makeEvent({ title: "Galerie" })] });
  await page.goto("/management-ui/episodes");
  await expect(page.getByRole("cell", { name: "Galerie" })).toBeVisible({ timeout: 15_000 });

  await layoutToggle(page).click();
  await expect(page.locator('img[src*="thumb"]').first()).toBeVisible({ timeout: 10_000 });

  // The same action set must survive the layout switch…
  await expect(page.getByRole("button", { name: "More actions", exact: true })).toBeVisible();

  // …and still be wired up: deleting from the gallery hits the backend.
  await page.getByRole("button", { name: "More actions", exact: true }).click();
  await page.getByRole("menuitem", { name: /move to trash/i }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /move to trash/i })
    .click();
  await expect.poll(() => backend.callsTo("MuiDeleteEvent").length, { timeout: 10_000 }).toBe(1);
});

test("[VID-01] the Videos nav item opens the episodes page", async ({ page }) => {
  await installMockBackend(page, { events: [makeEvent({ title: "Vorlesung" })] });
  await page.goto("/management-ui/");

  await page.getByRole("link", { name: /^videos$/i }).click();

  await expect(page).toHaveURL(/\/episodes/);
  await expect(page.getByRole("cell", { name: "Vorlesung" })).toBeVisible({ timeout: 15_000 });
});

test("[VID-27] [VID-28] [VID-30] [VID-31] the row shows presenter, series, date and status", async ({
  page,
}) => {
  await installMockBackend(page, {
    events: [
      makeEvent({
        title: "Vorlesung",
        presenters: ["Alex Roe"],
        seriesName: "Physik I",
        created: "2026-02-10T14:05:00Z",
        startDate: "2026-02-10T14:05:00Z",
        displayableStatus: "SUCCEEDED",
      }),
    ],
  });
  await page.goto("/management-ui/episodes");

  await expect(page.getByRole("cell", { name: "Vorlesung" })).toBeVisible({ timeout: 15_000 });
  // Exactly one presenter name (VID-27), the series name (VID-28), a date with
  // a time (VID-30) and a status column that carries something (VID-31).
  await expect(page.getByRole("cell", { name: "Alex Roe" })).toHaveCount(1);
  await expect(page.getByRole("cell", { name: "Physik I" })).toBeVisible();
  // English format — see the note in protocol-series.spec.ts; VID-30 asks for
  // a date with a time, which this still pins.
  await expect(page.getByRole("cell", { name: /Feb 10, 2026.*\d{1,2}:\d{2}/ })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: /status/i })).toBeVisible();
});

test("[VID-05] [VID-14] the column header menu sorts and hides", async ({ page }) => {
  // Both live in the same DataTableColumnHeader dropdown — VID-05 is
  // Ascending/Descending, VID-14 is the "Hide" entry ("Auge-Symbol"). Only the
  // columns wired through DataTableColumnHeader carry that menu, so both steps
  // are exercised on Title rather than assuming every header has one.
  const backend = await installMockBackend(page, {
    events: Array.from({ length: 25 }, () => makeEvent()),
  });
  await page.goto("/management-ui/episodes");
  await expect(page.getByRole("columnheader", { name: /^title$/i })).toBeVisible({
    timeout: 15_000,
  });

  const orderBy = () => JSON.stringify(backend.lastCallTo("MuiGetMyEvents")?.variables["orderBy"]);
  const initialOrderBy = orderBy();

  const openTitleMenu = async () => {
    await page
      .getByRole("columnheader", { name: /^title$/i })
      .getByRole("button")
      .first()
      .click();
    await expect(page.locator('[role="menu"]')).toBeVisible();
  };

  await openTitleMenu();
  await page.getByRole("menuitem", { name: /^ascending$/i }).click();
  await expect
    .poll(orderBy, { message: "sorting never reached the backend", timeout: 10_000 })
    .not.toBe(initialOrderBy);

  await openTitleMenu();
  await page.getByRole("menuitem", { name: /^hide$/i }).click();
  await expect(page.getByRole("columnheader", { name: /^title$/i })).toHaveCount(0);
});

test("[VID-06] [VID-07] paging and page size", async ({ page }) => {
  const backend = await installMockBackend(page, {
    events: Array.from({ length: 60 }, () => makeEvent()),
  });
  await page.goto("/management-ui/episodes");
  await expect(page.getByRole("columnheader", { name: /^title$/i })).toBeVisible({
    timeout: 15_000,
  });

  const pageLabel = page.getByText(/page \d+ of \d+/i);
  await expect(pageLabel).toHaveText(/page 1 of 6/i);

  await page.getByRole("button", { name: /go to next page/i }).click();
  await expect(pageLabel).toHaveText(/page 2 of 6/i);
  await page.getByRole("button", { name: /go to last page/i }).click();
  await expect(pageLabel).toHaveText(/page 6 of 6/i);
  await page.getByRole("button", { name: /go to first page/i }).click();
  await expect(pageLabel).toHaveText(/page 1 of 6/i);

  // A larger page size collapses the same 60 rows into fewer pages.
  await page.getByRole("combobox").last().click();
  await page.getByRole("option", { name: "50", exact: true }).click();
  await expect(pageLabel).toHaveText(/page 1 of 2/i);
  await expect
    .poll(() => Number(backend.lastCallTo("MuiGetMyEvents")?.variables["limit"] ?? 0), {
      timeout: 10_000,
    })
    .toBe(50);
});

test("[VID-17] Reload Data picks up a video uploaded in the meantime", async ({ page }) => {
  const backend = await installMockBackend(page, { events: [makeEvent({ title: "Vorhanden" })] });
  await page.goto("/management-ui/episodes");
  await expect(page.getByRole("cell", { name: "Vorhanden" })).toBeVisible({ timeout: 15_000 });

  backend.events.push(makeEvent({ title: "Frisch hochgeladen" }));
  await expect(page.getByRole("cell", { name: "Frisch hochgeladen" })).toHaveCount(0);

  await page.getByRole("button", { name: /reload data/i }).click();

  await expect(page.getByRole("cell", { name: "Frisch hochgeladen" })).toBeVisible({
    timeout: 10_000,
  });
});

test("[VID-18] [VID-24] the panel opens on a row and follows the next one", async ({ page }) => {
  await installMockBackend(page, {
    events: [makeEvent({ title: "Erstes Video" }), makeEvent({ title: "Zweites Video" })],
  });
  await page.goto("/management-ui/episodes");
  await expect(page.getByRole("cell", { name: "Erstes Video" })).toBeVisible({ timeout: 15_000 });

  await page.getByRole("cell", { name: "Erstes Video" }).click();
  const panel = page.locator('[role="dialog"], aside').first();
  await expect(panel).toBeVisible();
  await expect(panel).toContainText("Erstes Video");

  await page.getByRole("cell", { name: "Zweites Video" }).click();
  await expect(panel).toContainText("Zweites Video");
});

test("[VID-22] Cancel discards an unsaved episode edit", async ({ page }) => {
  const backend = await installMockBackend(page, { events: [makeEvent({ title: "Unverändert" })] });
  await page.goto("/management-ui/episodes");
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

  expect(backend.callsTo("MuiUpdateEvent")).toHaveLength(0);
  expect(backend.events[0]?.title).toBe("Unverändert");
});

test("[VID-23] the X closes the panel without saving", async ({ page }) => {
  const backend = await installMockBackend(page, { events: [makeEvent({ title: "Unverändert" })] });
  await page.goto("/management-ui/episodes");
  await expect(page.getByRole("cell", { name: "Unverändert" })).toBeVisible({ timeout: 15_000 });

  await page.getByRole("cell", { name: "Unverändert" }).click();
  const panel = page.locator('[role="dialog"], aside').first();
  await expect(panel).toBeVisible();

  await page.getByRole("button", { name: /^close$/i }).click();

  await expect(panel).toBeHidden();
  expect(backend.callsTo("MuiUpdateEvent")).toHaveLength(0);
});

test("[VID-25] a video being processed cannot be edited", async ({ page }) => {
  // "Bearbeitung der Metadaten nicht möglich, solange diese Episode gerade
  // verarbeitet wird" — finding 030 confirmed this is intended behaviour.
  await installMockBackend(page, {
    events: [
      makeEvent({
        title: "In Verarbeitung",
        eventStatus: "PROCESSING",
        displayableStatus: "PROCESSING",
      }),
    ],
  });
  await page.goto("/management-ui/episodes");
  await expect(page.getByRole("cell", { name: "In Verarbeitung" })).toBeVisible({
    timeout: 15_000,
  });

  await expect(
    page.getByRole("row").nth(1).getByRole("button", { name: "Edit Data", exact: true }),
    "a processing video must not offer the edit action",
  ).toHaveCount(0);
});

test("[VID-26] a long episode title is truncated in the table", async ({ page }) => {
  const longTitle = `Sehr lange Videobezeichnung ${"zur Ueberlaenge ".repeat(30)}Ende`;
  await installMockBackend(page, { events: [makeEvent({ title: longTitle })] });
  await page.goto("/management-ui/episodes");

  const cell = page.getByRole("cell", { name: longTitle });
  await expect(cell).toBeVisible({ timeout: 15_000 });

  const clipped = await cell.evaluate((el) =>
    [el, ...el.querySelectorAll("*")].some((node) => {
      const style = getComputedStyle(node);
      return (
        node.scrollWidth > node.clientWidth + 1 &&
        (style.overflow !== "visible" || style.textOverflow === "ellipsis")
      );
    }),
  );
  expect(clipped, "the long title was not clipped").toBe(true);
});

test("[VID-08] [VID-15] the layout toggle switches to gallery and back", async ({ page }) => {
  await installMockBackend(page, { events: [makeEvent({ title: "Umschalten" })] });
  await page.goto("/management-ui/episodes");
  await expect(page.getByRole("columnheader", { name: /^title$/i })).toBeVisible({
    timeout: 15_000,
  });

  await layoutToggle(page).click();
  await expect(page.locator('img[src*="thumb"]').first()).toBeVisible({ timeout: 10_000 });

  // Back to the table view — the toggle's name now announces the list target.
  await page.getByRole("button", { name: /switch to list view/i }).click();
  await expect(page.getByRole("columnheader", { name: /^title$/i })).toBeVisible({
    timeout: 10_000,
  });
});

test("[VID-10] [VID-12] the gallery keeps the data and links the preview", async ({ page }) => {
  await installMockBackend(page, {
    events: [
      makeEvent({ title: "Galerievideo", seriesName: "Physik I", presenters: ["Alex Roe"] }),
    ],
  });
  await page.goto("/management-ui/episodes");
  await expect(page.getByRole("cell", { name: "Galerievideo" })).toBeVisible({ timeout: 15_000 });

  await layoutToggle(page).click();
  await expect(page.locator('img[src*="thumb"]').first()).toBeVisible({ timeout: 10_000 });

  // Columns are still populated (VID-10) …
  await expect(page.getByText("Galerievideo", { exact: true })).toBeVisible();
  await expect(page.getByText("Physik I", { exact: true })).toBeVisible();
  // … and the preview is a link to the player (VID-12).
  await expect(page.locator('a[href*="/play/"]').first()).toBeVisible();
});

test("[VID-33] [VID-34] [VID-36] the actions menu and the direct actions work", async ({
  page,
}) => {
  await installMockBackend(page, { events: [makeEvent({ title: "Aktionen" })] });
  await page.goto("/management-ui/episodes");
  await expect(page.getByRole("cell", { name: "Aktionen" })).toBeVisible({ timeout: 15_000 });

  const row = page.getByRole("row").nth(1);

  // VID-36: Play is a link that opens in a new tab.
  await expect(row.locator('a[href*="/play/"]')).toHaveAttribute("target", "_blank");

  // VID-33: the overflow menu lists what didn't fit — download and the trash
  // action (#42 unified both views on three direct actions). Whether "Delete
  // permanently" joins it is role-dependent; that is asserted in the VID-38
  // tests rather than mixed in here.
  await row.getByRole("button", { name: "More actions", exact: true }).click();
  await expect(page.getByRole("menuitem", { name: /download/i })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: /move to trash/i })).toBeVisible();
  await page.keyboard.press("Escape");

  // VID-34: Edit Data opens the metadata mask.
  await row.getByRole("button", { name: "Edit Data", exact: true }).click();
  await expect(page.getByRole("button", { name: /^save$/i })).toBeVisible({ timeout: 10_000 });
});

test("[VID-39] Reset clears the search and brings the full list back", async ({ page }) => {
  await installMockBackend(page, {
    events: [makeEvent({ title: "Treffer" }), makeEvent({ title: "Anderes" })],
  });
  await page.goto("/management-ui/episodes");
  await expect(page.getByRole("cell", { name: "Anderes" })).toBeVisible({ timeout: 15_000 });

  await page.getByPlaceholder(/search|suche/i).fill("Treffer");
  await expect(page.getByRole("cell", { name: "Anderes" })).toHaveCount(0, { timeout: 10_000 });

  await page.getByRole("button", { name: /^reset$/i }).click();

  await expect(page.getByRole("cell", { name: "Anderes" })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("cell", { name: "Treffer" })).toBeVisible();
});
