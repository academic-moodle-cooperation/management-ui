import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { expect, test } from "@playwright/test";

import { installMockBackend, makeSeries, resetSeeds } from "./_fixtures/mock-backend";

import type { Page } from "@playwright/test";

/**
 * Upload steps from the manual protocol (`tests/protocol/README.md`).
 * Each test claims a step with `[UPL-nn]`; `pnpm protocol:coverage` reconciles.
 *
 * Every Upload row was OK in the recorded manual runs, so unlike the Series and
 * Videos specs these are pure regression protection rather than pinned fixes.
 *
 * UPL-13 (Zugriffsrichtlinie + Zugriffsliste) is deliberately not automated —
 * the protocol itself marks it "WIRD AKTUELL NICHT VERWENDET".
 */

test.beforeEach(() => resetSeeds());

/**
 * The upload list shows `uploadName`, which `fileHandler.ts` derives by stripping
 * the extension — a file dropped as `vorlesung-1.mp4` is listed as `vorlesung-1`.
 */
const listedAs = (fileName: string) => fileName.replace(/\.[^.]+$/, "");

/**
 * A real (if tiny) H.264 clip, not a byte blob.
 *
 * The ingest chain does not just POST the file: after addDCCatalog it derives an
 * attachment from the media, which means the browser has to actually decode it.
 * With a fake buffer the chain silently stalls after addDCCatalog — no error, no
 * progress — so anything past that point can only be tested with a decodable
 * file. `media/tiny.mp4` is 2.3 KB, generated once with:
 *
 *   ffmpeg -f lavfi -i color=c=blue:s=160x120:d=1 -c:v libx264 -pix_fmt yuv420p \
 *          -movflags +faststart tests/e2e/_fixtures/media/tiny.mp4
 */
const TINY_MP4 = resolve(__dirname, "_fixtures/media/tiny.mp4");

const videoFile = (name: string) => ({
  name,
  mimeType: "video/mp4",
  buffer: readFileSync(TINY_MP4),
});

async function gotoUpload(page: Page): Promise<void> {
  await page.goto("/management-ui/upload");
  await expect(page.getByRole("button", { name: /select files/i })).toBeVisible({
    timeout: 15_000,
  });
}

/** Both the drop area and the "Select Files" button own a hidden file input. */
const fileInput = (page: Page) => page.locator('input[type="file"]').first();

test("[UPL-01] the Upload nav item opens the upload mask", async ({ page }) => {
  await installMockBackend(page, { series: [makeSeries()] });
  await page.goto("/management-ui/");

  await page.getByRole("link", { name: /^upload$/i }).click();

  await expect(page).toHaveURL(/\/upload/);
  await expect(page.getByRole("button", { name: /select files/i })).toBeVisible({
    timeout: 15_000,
  });
});

test("[UPL-05] several files can be added at once", async ({ page }) => {
  await installMockBackend(page, { series: [makeSeries()] });
  await gotoUpload(page);

  await fileInput(page).setInputFiles([
    videoFile("vorlesung-1.mp4"),
    videoFile("vorlesung-2.mp4"),
    videoFile("vorlesung-3.mp4"),
  ]);

  for (const name of ["vorlesung-1.mp4", "vorlesung-2.mp4", "vorlesung-3.mp4"]) {
    await expect(page.getByText(listedAs(name), { exact: true })).toBeVisible({ timeout: 10_000 });
  }
});

test("[UPL-06] more files can be added one after another", async ({ page }) => {
  await installMockBackend(page, { series: [makeSeries()] });
  await gotoUpload(page);

  await fileInput(page).setInputFiles([videoFile("erste.mp4")]);
  await expect(page.getByText(listedAs("erste.mp4"), { exact: true })).toBeVisible({
    timeout: 10_000,
  });

  // The second selection must extend the list, not replace it.
  await fileInput(page).setInputFiles([videoFile("zweite.mp4")]);
  await expect(page.getByText(listedAs("zweite.mp4"), { exact: true })).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByText(listedAs("erste.mp4"), { exact: true })).toBeVisible();
});

test("[UPL-08] a file can be renamed and the new name sticks", async ({ page }) => {
  await installMockBackend(page, { series: [makeSeries()] });
  await gotoUpload(page);

  await fileInput(page).setInputFiles([videoFile("kryptischer-name.mp4")]);
  await expect(page.getByText(listedAs("kryptischer-name.mp4"), { exact: true })).toBeVisible({
    timeout: 10_000,
  });

  await page.locator('[aria-label="edit"]').first().click();
  const nameInput = page.locator("#editfilename");
  await expect(nameInput).toBeVisible();
  await nameInput.fill("Vorlesung 1 — Einführung");
  await nameInput.press("Enter");

  await expect(page.getByText("Vorlesung 1 — Einführung", { exact: true })).toBeVisible();
  await expect(page.getByText(listedAs("kryptischer-name.mp4"), { exact: true })).toHaveCount(0);
});

test("[UPL-09] the x removes one file and leaves the rest", async ({ page }) => {
  await installMockBackend(page, { series: [makeSeries()] });
  await gotoUpload(page);

  await fileInput(page).setInputFiles([videoFile("bleibt.mp4"), videoFile("fliegt-raus.mp4")]);
  await expect(page.getByText(listedAs("fliegt-raus.mp4"), { exact: true })).toBeVisible({
    timeout: 10_000,
  });

  // The remove buttons follow list order; the second entry is the one to drop.
  await page
    .getByRole("button", { name: /remove from list/i })
    .nth(1)
    .click();

  await expect(page.getByText(listedAs("fliegt-raus.mp4"), { exact: true })).toHaveCount(0);
  await expect(page.getByText(listedAs("bleibt.mp4"), { exact: true })).toBeVisible();
});

test("[UPL-11] Delete list empties the whole list", async ({ page }) => {
  await installMockBackend(page, { series: [makeSeries()] });
  await gotoUpload(page);

  await fileInput(page).setInputFiles([videoFile("eins.mp4"), videoFile("zwei.mp4")]);
  await expect(page.getByText(listedAs("zwei.mp4"), { exact: true })).toBeVisible({
    timeout: 10_000,
  });

  await page.getByRole("button", { name: /delete list/i }).click();

  await expect(page.getByText(listedAs("eins.mp4"), { exact: true })).toHaveCount(0);
  await expect(page.getByText(listedAs("zwei.mp4"), { exact: true })).toHaveCount(0);
});

test("[UPL-07] uploading is blocked until a series is chosen", async ({ page }) => {
  // "Man muss auswählen, in welche Serie man hochladen möchte" — enforced by
  // `disabled={… || !selectedSeriesId}` on the Upload button.
  await installMockBackend(page, {
    series: [makeSeries({ title: "Physik I" }), makeSeries({ title: "Chemie II" })],
  });
  await gotoUpload(page);

  await fileInput(page).setInputFiles([videoFile("ohne-serie.mp4")]);
  await expect(page.getByText(listedAs("ohne-serie.mp4"), { exact: true })).toBeVisible({
    timeout: 10_000,
  });

  // Scoped to the content area: "Upload" is also the sidebar nav entry.
  const uploadButton = page
    .locator("#sidebar-inset")
    .getByRole("button", { name: "Upload", exact: true });
  await expect(uploadButton, "files but no series — upload must stay blocked").toBeDisabled();

  await page.getByRole("combobox").first().click();
  await page.getByRole("option", { name: /physik i/i }).click();

  await expect(uploadButton, "series chosen — upload must become available").toBeEnabled();
});

/** Pick a series in the combobox and start the upload. */
async function chooseSeriesAndUpload(page: Page, seriesTitle: RegExp): Promise<void> {
  await page.getByRole("combobox").first().click();
  await page.getByRole("option", { name: seriesTitle }).click();
  await page.locator("#sidebar-inset").getByRole("button", { name: "Upload", exact: true }).click();
}

test("[UPL-10] each file uploads individually with a visible progress bar", async ({ page }) => {
  // "Episoden die zur Zeit hochgeladen werden, werden einzeln angezeigt und ein
  // Balken mit dem Upload-Fortschritt ist sichtbar." The ingest mock holds
  // addTrack open so the in-flight state is observable at all.
  const backend = await installMockBackend(page, {
    series: [makeSeries({ title: "Physik I" })],
    trackUploadDelayMs: 2_000,
  });
  await gotoUpload(page);

  await fileInput(page).setInputFiles([videoFile("eins.mp4"), videoFile("zwei.mp4")]);
  await expect(page.getByText(listedAs("zwei.mp4"), { exact: true })).toBeVisible({
    timeout: 10_000,
  });

  await chooseSeriesAndUpload(page, /physik i/i);

  // Percentage readouts are rendered per file while the transfer runs.
  await expect(page.getByText(/^\d{1,3}%$/).first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(listedAs("eins.mp4"), { exact: true })).toBeVisible();
  await expect(page.getByText(listedAs("zwei.mp4"), { exact: true })).toBeVisible();

  // Both files go through their own ingest cycle rather than one shared request.
  await expect
    .poll(() => backend.ingestCalls.filter((c) => c.endpoint === "createMediaPackage").length, {
      message: "each file should get its own ingest cycle",
      timeout: 30_000,
    })
    .toBeGreaterThanOrEqual(2);
});

test("[UPL-14] the chosen series is sent with the ingest", async ({ page }) => {
  // "Die Episoden werden direkt in die Serie hochgeladen, über welche der Upload
  // angestoßen wurde." The series id travels in the Dublin Core catalogue as
  // dcterms:isPartOf (see the template in opencastUpload.ts).
  const backend = await installMockBackend(page, {
    series: [makeSeries({ title: "Physik I" }), makeSeries({ title: "Chemie II" })],
  });
  await gotoUpload(page);

  await fileInput(page).setInputFiles([videoFile("vorlesung.mp4")]);
  await expect(page.getByText(listedAs("vorlesung.mp4"), { exact: true })).toBeVisible({
    timeout: 10_000,
  });

  await chooseSeriesAndUpload(page, /chemie ii/i);

  await expect
    .poll(() => backend.ingestCalls.find((c) => c.endpoint === "addDCCatalog")?.body ?? "", {
      message: "no Dublin Core catalogue was ingested",
      timeout: 20_000,
    })
    .toContain("series-2");
});

test("[UPL-15] after a successful upload another series can be picked in place", async ({
  page,
}) => {
  // "…ohne dass die Seite zwischendurch gewechselt werden muss" — the mask has
  // to return to a usable state on its own, with no navigation or reload.
  const backend = await installMockBackend(page, {
    series: [makeSeries({ title: "Physik I" }), makeSeries({ title: "Chemie II" })],
  });
  await gotoUpload(page);

  await fileInput(page).setInputFiles([videoFile("erster-lauf.mp4")]);
  await expect(page.getByText(listedAs("erster-lauf.mp4"), { exact: true })).toBeVisible({
    timeout: 10_000,
  });
  await chooseSeriesAndUpload(page, /physik i/i);

  await expect
    .poll(() => backend.ingestCalls.filter((c) => c.endpoint === "ingest").length, {
      timeout: 20_000,
    })
    .toBe(1);

  // Acknowledge the completion dialog if the build shows one, then start over
  // on the same page.
  const closeButton = page.getByRole("button", { name: /^close$/i });
  if (await closeButton.count()) await closeButton.first().click();
  await page.getByRole("button", { name: /delete list/i }).click();

  await fileInput(page).setInputFiles([videoFile("zweiter-lauf.mp4")]);
  await expect(page.getByText(listedAs("zweiter-lauf.mp4"), { exact: true })).toBeVisible({
    timeout: 10_000,
  });
  await chooseSeriesAndUpload(page, /chemie ii/i);

  await expect
    .poll(
      () =>
        backend.ingestCalls
          .filter((c) => c.endpoint === "addDCCatalog")
          .at(-1)
          ?.body.includes("series-2"),
      { message: "the second upload did not go to the newly chosen series", timeout: 20_000 },
    )
    .toBe(true);
});
