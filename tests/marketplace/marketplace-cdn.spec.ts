import { expect, test, type Page } from "@playwright/test";

import { defaultConfig } from "../../packages/ui-config/src";

/**
 * test-protocol.md §11 — Marketplace CDN-distributed plugin (Developer Tools).
 * The demo plugin was scaffolded + built by global-setup.ts and is served by
 * the dev shell at the URL below. We drive Try / Install / Uninstall and assert
 * the persistence contract via localStorage (`installed_remote_plugins`):
 *   - Try   → loads temporarily, NOT persisted.
 *   - Install → persisted (survives reload).
 *   - Uninstall → removed.
 */

const NAME = "demo-mp";
const PLUGIN_URL = `http://127.0.0.1:3000/management-ui/local-plugins/${NAME}/${NAME}.mjs`;
const LS_KEY = "installed_remote_plugins";

const ADMIN = {
  __typename: "User",
  username: "admin",
  name: "Administrator",
  email: "admin@example.org",
  userRole: "ROLE_ADMIN",
};

// Mock boot endpoints with an ADMIN user so the marketplace route renders.
async function stubAdmin(page: Page): Promise<void> {
  await page.route("**/ui/config/management-ui/config.json", (r) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(defaultConfig),
    }),
  );
  await page.route("**/management-tool/ui/config/plugins.json", (r) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ plugins: [] }),
    }),
  );
  await page.route("**/info/me.json", (r) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        org: { adminRole: "ROLE_ADMIN", anonymousRole: "ROLE_ANONYMOUS", id: "mh_default_org" },
        roles: ["ROLE_ADMIN", "ROLE_USER"],
        userRole: "ROLE_USER_ADMIN",
        user: { username: "admin", name: "Administrator", email: "admin@example.org" },
      }),
    }),
  );
  await page.route("**/graphql", (r) => {
    const isCurrentUser = (r.request().postData() ?? "").includes("MuiGetCurrentUser");
    return r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: isCurrentUser ? { currentUser: ADMIN } : null }),
    });
  });
  await page.route("https://api.github.com/**", (r) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ tag_name: "v0.0.0" }),
    }),
  );
  await page.route("https://www.gravatar.com/**", (r) =>
    r.fulfill({ status: 200, contentType: "image/png", body: Buffer.from([]) }),
  );
}

const lsHasPlugin = (page: Page): Promise<boolean> =>
  page.evaluate(({ k, n }) => (localStorage.getItem(k) ?? "").includes(n), { k: LS_KEY, n: NAME });

// The dev-tools card (Try/Install live next to #dev-url; other "Install"
// buttons exist elsewhere on the page, so scope to this card).
const devCard = (page: Page) => page.locator("div.space-y-4", { has: page.locator("#dev-url") });

async function openDevTools(page: Page) {
  await stubAdmin(page);
  await page.goto("/management-ui/admin/marketplace/plugins");
  const input = page.locator("#dev-url");
  await expect(input).toBeVisible({ timeout: 20_000 });
  return input;
}

test("§11.3–11.4 Try loads temporarily and does NOT persist", async ({ page }) => {
  const input = await openDevTools(page);
  await input.fill(PLUGIN_URL);
  await devCard(page).getByRole("button", { name: "Try", exact: true }).click();
  await page.waitForTimeout(2_000);
  expect(await lsHasPlugin(page), "Try should not persist the plugin").toBe(false);
});

test("§11.5–11.7 Install persists across reload; Uninstall removes it", async ({ page }) => {
  const input = await openDevTools(page);
  await input.fill(PLUGIN_URL);
  await devCard(page).getByRole("button", { name: "Install", exact: true }).click();

  // Persisted to localStorage…
  await expect.poll(() => lsHasPlugin(page), { timeout: 20_000 }).toBe(true);

  // …survives a reload, and shows in the "Installed remote plugins" list (routes
  // registered on the page persist across reloads).
  await page.reload();
  await expect(page.getByText(PLUGIN_URL, { exact: false })).toBeVisible({ timeout: 20_000 });
  expect(await lsHasPlugin(page)).toBe(true);

  // Uninstall (the "Remove" button in the installed list) clears it.
  await page.getByRole("button", { name: "Remove", exact: true }).first().click();
  await expect.poll(() => lsHasPlugin(page), { timeout: 10_000 }).toBe(false);
});
