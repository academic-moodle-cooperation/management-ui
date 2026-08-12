import { expect, test } from "@playwright/test";

import { installMockBackend, makeEvent, resetSeeds } from "./_fixtures/mock-backend";

/**
 * #279 — editing a metadata textfield in dark mode must be readable.
 *
 * The edit inputs carried hardcoded `text-gray-900` (plus gray/indigo rings),
 * so in dark mode the value rendered near-black on a dark background. The
 * fields now inherit the base Input/Textarea token styling; this spec measures
 * the ACTUAL computed text color of the edit input in dark mode and asserts
 * it is light — i.e. readable on the dark background — rather than trusting
 * class names.
 */

test.beforeEach(() => resetSeeds());

/**
 * Lightness (0 = black, 1 = white) of a computed color. Chromium may return
 * either legacy `rgb(...)` or `oklch(L C H)` — in OKLCH the first component
 * already IS perceptual lightness.
 */
const luminanceOf = (color: string): number => {
  const oklch = color.match(/oklch\(\s*([\d.]+)/);
  if (oklch?.[1]) return Number(oklch[1]);
  const rgb = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!rgb) return -1;
  const [r, g, b] = [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])].map((v) => v / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

test("the edit input's text is light in dark mode", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await installMockBackend(page, { events: [makeEvent({ title: "Dunkelmodus-Test" })] });
  await page.goto("/management-ui/episodes");

  await expect(page.getByRole("cell", { name: "Dunkelmodus-Test" })).toBeVisible({
    timeout: 15_000,
  });
  expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(true);

  // Open the row, enter edit mode, open the title field's input.
  await page.getByRole("cell", { name: "Dunkelmodus-Test" }).click();
  await page.getByRole("button", { name: /^edit$/i }).click();
  await page
    .getByRole("button", { name: /^edit$/i })
    .first()
    .click();

  const input = page.locator('[role="dialog"], aside').first().getByRole("textbox").last();
  await expect(input).toBeVisible();
  await expect(input).toHaveValue("Dunkelmodus-Test");

  const color = await input.evaluate((el) => getComputedStyle(el).color);
  const luminance = luminanceOf(color);
  expect(
    luminance,
    `edit input text color ${color} must be light on the dark background (was text-gray-900 ≈ luminance 0.08)`,
  ).toBeGreaterThan(0.5);
});
