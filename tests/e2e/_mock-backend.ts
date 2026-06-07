import { defaultConfig } from "../../packages/ui-config/src";

import type { Page } from "@playwright/test";

type AppConfig = typeof defaultConfig;

/**
 * Stub the endpoints the shell hits during boot (config, plugins, auth, the
 * graphql resolver) + the landing page's GitHub release check + gravatar, so
 * mocked E2E specs are self-contained and offline. Same set as smoke.spec.ts;
 * `config` lets a spec serve an edited config.json to assert §6 behavior.
 */
export async function stubShellBoot(page: Page, config: AppConfig = defaultConfig): Promise<void> {
  await page.route("**/ui/config/management-ui/config.json", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(config) }),
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
  await page.route("https://api.github.com/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ tag_name: "v0.0.0" }),
    }),
  );
  await page.route("https://www.gravatar.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "image/png", body: Buffer.from([]) }),
  );
}
