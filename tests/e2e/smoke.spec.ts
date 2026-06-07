import { expect, test } from "@playwright/test";

import { defaultConfig } from "../../packages/ui-config/src";

// In real deployments the shell talks to a backend (proxied through vite in
// dev). The OSS repo ships no backend, so the smoke test stubs the small
// set of endpoints the shell hits during boot — config, plugins, auth, the
// graphql resolver — keeping the test self-contained.
test("shell boots and renders without console errors", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => {
    consoleErrors.push(err.message);
  });

  await page.route("**/ui/config/management-ui/config.json", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(defaultConfig),
    }),
  );
  await page.route("**/management-tool/ui/config/plugins.json", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ plugins: [] }),
    }),
  );
  await page.route("**/info/me.json", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ user: null }),
    }),
  );
  await page.route("**/graphql", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: null }),
    }),
  );
  // The landing page checks GitHub Releases for a newer version. Stub it so the
  // test stays self-contained and offline — and so an unstubbed 404/network
  // failure doesn't surface a "failed to load resource" console error. A tag
  // equal to the running build means no update badge is shown.
  await page.route("https://api.github.com/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ tag_name: "v0.0.0" }),
    }),
  );
  // The user-avatar resolves through Gravatar with `d=404`, so Gravatar returns
  // 404 when no avatar exists — which surfaces as a "failed to load resource"
  // console error. Stub it to a 1x1 PNG to keep the smoke self-contained and
  // offline, exactly like the GitHub stub above.
  await page.route("https://www.gravatar.com/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "image/png",
      body: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        "base64",
      ),
    }),
  );

  await page.goto("/management-ui/");

  await expect(page).toHaveTitle(/Management UI/i);
  await expect(page.getByRole("link", { name: /home/i })).toBeVisible({
    timeout: 15_000,
  });

  expect(consoleErrors, consoleErrors.join("\n")).toHaveLength(0);
});
