import { expect, test, type Page } from "@playwright/test";

import { stubShellBoot } from "./_mock-backend";

/**
 * test-protocol.md §7 — Theming, at the token level. The pixel side lives in the
 * visual tier (tests/visual/); here we assert the semantic CSS variables are
 * real OKLCH tokens and that dark mode actually flips them — i.e. the UI is
 * token-driven, not hardcoded.
 */

const cssVar = (page: Page, name: string): Promise<string> =>
  page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);

test("§7.1 light theme exposes OKLCH semantic tokens", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await stubShellBoot(page);
  await page.goto("/management-ui/");
  await expect(page.getByRole("link", { name: /home/i })).toBeVisible({ timeout: 15_000 });

  for (const token of ["--background", "--foreground", "--primary"]) {
    const value = await cssVar(page, token);
    expect(value, `${token} should be a non-empty token`).not.toBe("");
    expect(value.toLowerCase(), `${token} should be an OKLCH value`).toContain("oklch");
  }
});

test("§7.2 dark mode flips the tokens (adds .dark, changes --background)", async ({ page }) => {
  await stubShellBoot(page);
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/management-ui/");
  await expect(page.getByRole("link", { name: /home/i })).toBeVisible({ timeout: 15_000 });
  const lightBg = await cssVar(page, "--background");

  await page.emulateMedia({ colorScheme: "dark" });
  // The shell's "System" appearance follows prefers-color-scheme reactively.
  await expect.poll(() => cssVar(page, "--background"), { timeout: 10_000 }).not.toBe(lightBg);
  expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(true);
});
