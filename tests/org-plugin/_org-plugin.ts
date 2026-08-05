import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { defaultConfig } from "../../packages/ui-config/src";

import type { Page } from "@playwright/test";

/**
 * Shared plumbing for the org-plugin tier.
 *
 * The plugin under test lives in `.local-plugins/<name>/`, which is gitignored —
 * org plugins are not part of the OSS repo. So the machinery here is generic and
 * tracked; the plugin it points at is supplied per machine via `ORG_PLUGIN`.
 */

/** Folder name under `.local-plugins/`, e.g. `ORG_PLUGIN=univie`. */
export const ORG_PLUGIN = process.env["ORG_PLUGIN"] ?? "";

export const PLUGIN_DIR = ORG_PLUGIN ? resolve(".local-plugins", ORG_PLUGIN) : "";

export const SKIP_REASON =
  "Set ORG_PLUGIN=<folder under .local-plugins/> to run the org-plugin tier " +
  "(see tests/org-plugin/README.md)";

export function isConfigured(): boolean {
  return ORG_PLUGIN.length > 0 && existsSync(PLUGIN_DIR);
}

export interface PluginManifest {
  id?: string;
  name?: string;
  namespace?: string;
  version?: string;
  i18nNamespaces?: string[];
  modules?: Array<{ id: string; type: string; entry: string; css?: string }>;
}

export function readManifest(): PluginManifest {
  return JSON.parse(readFileSync(join(PLUGIN_DIR, "plugin.json"), "utf-8")) as PluginManifest;
}

/** Built bundles the dev server will expose, by file name. */
export function distBundles(): string[] {
  const dist = join(PLUGIN_DIR, "dist");
  if (!existsSync(dist)) return [];
  return readdirSync(dist).filter((f) => f.endsWith(".mjs"));
}

export interface LocaleNamespace {
  namespace: string;
  /** locale code → absolute file path */
  files: Record<string, string>;
}

/**
 * Discover locale namespaces the same way the dev server does
 * (packages/vite-config/src/plugins/local-plugins-dev.ts): a namespace is a
 * *directory* under `modules/<type>/locales/`. Locale files placed directly in
 * `locales/` are invisible to the loader — which is precisely the drift this
 * tier is here to catch.
 */
export function discoverLocaleNamespaces(): LocaleNamespace[] {
  const modulesDir = join(PLUGIN_DIR, "modules");
  const found: LocaleNamespace[] = [];
  if (!existsSync(modulesDir) || !statSync(modulesDir).isDirectory()) return found;

  for (const moduleEnt of readdirSync(modulesDir, { withFileTypes: true })) {
    if (!moduleEnt.isDirectory()) continue;
    const localesDir = join(modulesDir, moduleEnt.name, "locales");
    if (!existsSync(localesDir) || !statSync(localesDir).isDirectory()) continue;

    for (const nsEnt of readdirSync(localesDir, { withFileTypes: true })) {
      if (!nsEnt.isDirectory()) continue;
      const nsDir = join(localesDir, nsEnt.name);
      const files: Record<string, string> = {};
      for (const file of readdirSync(nsDir)) {
        if (file.endsWith(".json")) files[file.replace(/\.json$/, "")] = join(nsDir, file);
      }
      found.push({ namespace: nsEnt.name, files });
    }
  }
  return found;
}

/** Flatten a translation file to dotted key paths, so parity compares leaves. */
export function flattenKeys(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, val]) =>
    flattenKeys(val, prefix ? `${prefix}.${key}` : key),
  );
}

export function themeFiles(): string[] {
  const themesDir = join(PLUGIN_DIR, "themes");
  if (!existsSync(themesDir)) return [];
  return readdirSync(themesDir)
    .filter((f) => f.endsWith(".css"))
    .map((f) => join(themesDir, f));
}

type AppConfig = typeof defaultConfig;

/** The default config plus the org plugin's namespace in `enabledPlugins`. */
export function configWithOrgPlugin(extra: Partial<AppConfig["app"]> = {}): AppConfig {
  return {
    ...defaultConfig,
    app: {
      ...defaultConfig.app,
      enabledPlugins: [...defaultConfig.app.enabledPlugins, ORG_PLUGIN],
      ...extra,
    },
  };
}

/**
 * Stub the backend boot endpoints, but leave `/local-plugins/**` alone — those
 * are served for real from disk by the dev server, which is the whole point:
 * mocked backend, real org plugin.
 */
export async function stubBackend(page: Page, config: AppConfig): Promise<void> {
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

/**
 * Kill anything that moves, hide the dev-only devtools widgets, and wait for
 * fonts. This tier has to run in dev mode (local plugins only load there), so
 * the TanStack Router/Query floating badges are always present — and the Query
 * badge sits right on top of the footer, which for an org plugin is exactly the
 * chrome we're trying to snapshot.
 */
export async function settle(page: Page): Promise<void> {
  await page.addStyleTag({
    content: [
      "*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important;}",
      ".TanStackRouterDevtoolsPanel,",
      'button[aria-label="Open TanStack Router Devtools"],',
      ".tsqd-open-btn-container{display:none!important;}",
    ].join(""),
  });
  await page.evaluate(() => document.fonts.ready);
}
