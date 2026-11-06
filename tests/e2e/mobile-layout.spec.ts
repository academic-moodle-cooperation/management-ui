import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { expect, test } from "@playwright/test";

import { installMockBackend, makeEvent, makeSeries, resetSeeds } from "./_fixtures/mock-backend";

import type { Locator, Page } from "@playwright/test";

/**
 * Phone-width layout. Everything else in this suite runs on a desktop viewport,
 * so nothing here would be caught by it: content pushed past the right edge
 * still counts as "visible" to Playwright, it just cannot be reached on a phone.
 */

const PHONE = { width: 375, height: 812 };

test.use({ viewport: PHONE });

test.beforeEach(() => resetSeeds());

const TINY_MP4 = resolve(__dirname, "_fixtures/media/tiny.mp4");

/**
 * Elements sticking out past the right edge of the viewport.
 *
 * `scrollWidth` on the document misses this: the shell scrolls inside its own
 * content pane, so the document never grows. Tables are the one thing allowed to
 * be wider than the screen, they scroll inside their own container.
 */
async function overflowingElements(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const viewport = document.documentElement.clientWidth;
    return [...document.body.querySelectorAll("*")]
      .filter((el) => {
        if (el.closest('[data-slot="table-container"]')) return false;
        const style = getComputedStyle(el);
        if (style.visibility === "hidden" || style.display === "none") return false;
        const box = el.getBoundingClientRect();
        return box.width > 1 && box.height > 0 && box.right > viewport + 1;
      })
      .map((el) => `${el.tagName.toLowerCase()} "${(el.textContent ?? "").trim().slice(0, 40)}"`);
  });
}

async function expectNoOverflow(page: Page): Promise<void> {
  expect(await overflowingElements(page)).toEqual([]);
}

async function expectInsideViewport(locator: Locator): Promise<void> {
  // Polled: the detail panels slide in from the right.
  await expect
    .poll(async () => {
      const box = await locator.boundingBox();
      return box && box.x >= 0 && box.x + box.width <= PHONE.width;
    })
    .toBe(true);
}

test("the landing page fits on a phone, on every tab", async ({ page }) => {
  await installMockBackend(page);
  await page.goto("/management-ui/");
  await expect(page.getByRole("tab", { name: /about/i })).toBeVisible({ timeout: 15_000 });

  await expectNoOverflow(page);
  for (const name of [/operations/i, /developers/i]) {
    await page.getByRole("tab", { name }).click();
    await expectNoOverflow(page);
  }
});

test("the landing page starts right below its tabs", async ({ page }) => {
  // Every panel renders as an invisible sizer, so on a phone the short About
  // panel used to float in the height of the much taller Developers panel.
  await installMockBackend(page);
  await page.goto("/management-ui/");
  const tabs = page.getByRole("tablist");
  await expect(tabs).toBeVisible({ timeout: 15_000 });

  const heading = page.getByRole("heading", { level: 1 }).first();
  const gap = (await heading.boundingBox())!.y - (await tabs.boundingBox())!.y;
  expect(gap).toBeLessThan(160);
});

test("an empty series table keeps its message and pager on screen", async ({ page }) => {
  await installMockBackend(page);
  await page.goto("/management-ui/series");
  const title = page.getByRole("heading", { name: /no series available/i });
  await expect(title).toBeVisible({ timeout: 15_000 });

  await expectInsideViewport(title);
  await expectInsideViewport(page.getByRole("button", { name: /go to next page/i }));
  await expect(page.getByText(/page 1 of 1/i)).toBeVisible();
  await expectNoOverflow(page);
});

test("an empty videos table keeps its message and pager on screen", async ({ page }) => {
  await installMockBackend(page);
  await page.goto("/management-ui/episodes");
  const pager = page.getByRole("button", { name: /go to next page/i });
  await expect(pager).toBeVisible({ timeout: 15_000 });

  await expectInsideViewport(pager);
  await expect(page.getByText(/page 1 of 1/i)).toBeVisible();
  await expectNoOverflow(page);
});

test("filled tables scroll inside themselves, not the page", async ({ page }) => {
  const series = makeSeries();
  await installMockBackend(page, {
    series: [series],
    events: [makeEvent({ seriesId: series.id, seriesName: series.title })],
  });

  await page.goto("/management-ui/series");
  await expect(page.getByRole("cell", { name: series.title })).toBeVisible({ timeout: 15_000 });
  await expectNoOverflow(page);

  await page.goto("/management-ui/episodes");
  await expect(page.getByRole("button", { name: /go to next page/i })).toBeVisible({
    timeout: 15_000,
  });
  await expectNoOverflow(page);
});

test("the videos table can switch to the gallery on a phone", async ({ page }) => {
  await installMockBackend(page, { events: [makeEvent({ title: "Lecture 1" })] });
  await page.goto("/management-ui/episodes");
  const toggle = page.getByRole("button", { name: /switch to gallery view/i });
  await expect(toggle).toBeVisible({ timeout: 15_000 });
  await expectInsideViewport(toggle);

  await toggle.click();

  await expect(page.getByRole("button", { name: /switch to list view/i })).toBeVisible();
  await expectInsideViewport(page.locator("main img").first());
  await expectNoOverflow(page);
});

test("the detail panels fit on the screen", async ({ page }) => {
  const series = makeSeries();
  await installMockBackend(page, {
    series: [series],
    events: [makeEvent({ seriesId: series.id, seriesName: series.title, title: "Lecture 1" })],
  });

  await page.goto("/management-ui/series");
  await page.getByRole("cell", { name: series.title }).click({ timeout: 15_000 });
  await expectInsideViewport(page.getByRole("dialog"));
  await expectNoOverflow(page);

  await page.goto("/management-ui/episodes");
  await page.getByRole("cell", { name: "Lecture 1" }).first().click({ timeout: 15_000 });
  await expectInsideViewport(page.getByRole("dialog"));
  await expectNoOverflow(page);
});

test("the create series dialog keeps its fields inside", async ({ page }) => {
  await installMockBackend(page);
  await page.goto("/management-ui/series");
  await page.getByRole("button", { name: /create series/i }).first().click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  const frame = (await dialog.boundingBox())!;

  for (const field of await dialog.getByRole("combobox").all()) {
    const box = (await field.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(frame.x);
    expect(box.x + box.width).toBeLessThanOrEqual(frame.x + frame.width);
  }
  await expectNoOverflow(page);
});

const addFile = (page: Page) =>
  page
    .locator('input[type="file"]')
    .first()
    .setInputFiles([
      {
        name: "a-recording-with-a-rather-long-name-and-no-spaces-at-all.mp4",
        mimeType: "video/mp4",
        buffer: readFileSync(TINY_MP4),
      },
    ]);

test("the upload page stacks once a file is added", async ({ page }) => {
  await installMockBackend(page, { series: [makeSeries()] });
  await page.goto("/management-ui/upload");
  const selectFiles = page.getByRole("button", { name: /select files/i });
  await expect(selectFiles).toBeVisible({ timeout: 15_000 });
  await expectNoOverflow(page);

  await addFile(page);
  const list = page.getByRole("heading", { name: /uploadlist/i });
  await expect(list).toBeVisible();

  expect((await list.boundingBox())!.y).toBeGreaterThan((await selectFiles.boundingBox())!.y);
  await expectInsideViewport(page.getByRole("button", { name: /^upload$/i }));
  await expectNoOverflow(page);
});

test("the upload page keeps two columns on a desktop", async ({ page }) => {
  // The responsive variant has to win over the stacked default, which is not a
  // given with several Tailwind builds on the page.
  await page.setViewportSize({ width: 1280, height: 800 });
  await installMockBackend(page, { series: [makeSeries()] });
  await page.goto("/management-ui/upload");
  const selectFiles = page.getByRole("button", { name: /select files/i });
  await expect(selectFiles).toBeVisible({ timeout: 15_000 });

  await addFile(page);
  const list = page.getByRole("heading", { name: /uploadlist/i });
  await expect(list).toBeVisible();

  expect((await list.boundingBox())!.x).toBeGreaterThan((await selectFiles.boundingBox())!.x);
});
