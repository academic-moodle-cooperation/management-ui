import { readFileSync } from "node:fs";
import { basename } from "node:path";

import { expect, test } from "@playwright/test";

import {
  configWithOrgPlugin,
  discoverLocaleNamespaces,
  distBundles,
  flattenKeys,
  isConfigured,
  ORG_PLUGIN,
  readManifest,
  SKIP_REASON,
  stubBackend,
  themeFiles,
} from "./_org-plugin";

/**
 * The contract test an org plugin can't have.
 *
 * In-tree plugins ship `src/plugin.contract.test.ts` and run under
 * `pnpm test:contract`. Org plugins under `.local-plugins/` can't: they're
 * gitignored, `pnpm verify` filters them out (`--filter='!./.local-plugins/*'`),
 * and a prebuilt one may have no `package.json` to hang a vitest run on. So the
 * same guarantees are asserted here, from the outside — through the dev server
 * that actually serves the plugin.
 *
 * Covers, for the org plugin: manifest ↔ built bundles agree (protocol §9),
 * every declared i18n namespace is discoverable and key-complete (§5), the theme
 * obeys the token-only + no-external-fonts rule (§7.7), and the shell boots with
 * the plugin active and no console errors (§2).
 */

test.describe("org plugin contract", () => {
  test.skip(!isConfigured(), SKIP_REASON);

  test("§9 every module declared in plugin.json has a built bundle", () => {
    const manifest = readManifest();
    const built = distBundles();
    expect(
      built.length,
      `no dist/*.mjs in .local-plugins/${ORG_PLUGIN} — run its build`,
    ).toBeGreaterThan(0);

    const missing = (manifest.modules ?? [])
      .map((module) => basename(module.entry))
      .filter((file) => !built.includes(file));
    expect(missing, "plugin.json declares modules with no matching dist bundle").toEqual([]);
  });

  test("§9.5 the dev manifest exposes every bundle, and each one is served", async ({
    request,
  }) => {
    const res = await request.get("local-plugins/manifest.json");
    expect(res.ok(), `manifest returned ${res.status()}`).toBeTruthy();
    const body = (await res.json()) as {
      plugins?: Array<{ namespace?: string; url?: string; cssUrl?: string }>;
    };
    const entries = (body.plugins ?? []).filter((p) => p.namespace === ORG_PLUGIN);
    expect(
      entries.length,
      `${ORG_PLUGIN} missing from the dev local-plugins manifest`,
    ).toBeGreaterThan(0);

    const served = new Set(entries.map((e) => basename(e.url ?? "")));
    expect([...distBundles()].filter((f) => !served.has(f))).toEqual([]);

    // …and each URL actually resolves with a script content type, so a bad
    // path fails here instead of as an opaque console error in the browser.
    for (const entry of entries) {
      const asset = await request.get(entry.url ?? "");
      expect(asset.status(), `${entry.url} not served`).toBe(200);
      expect(asset.headers()["content-type"]).toContain("javascript");
    }

    const cssUrl = entries.find((e) => e.cssUrl)?.cssUrl;
    if (cssUrl) {
      const css = await request.get(cssUrl);
      expect(css.status(), `${cssUrl} not served`).toBe(200);
      expect(css.headers()["content-type"]).toContain("css");
    }
  });

  test("§5 every declared i18n namespace is discoverable by the loader", () => {
    const manifest = readManifest();
    const declared = manifest.i18nNamespaces ?? [];
    test.skip(declared.length === 0, "plugin declares no i18nNamespaces");

    const discovered = new Set(discoverLocaleNamespaces().map((ns) => ns.namespace));
    const invisible = declared.filter((ns) => !discovered.has(ns));
    expect(
      invisible,
      "declared in plugin.json but not found as modules/<type>/locales/<namespace>/ — " +
        "the dev server only discovers namespace *directories*, so flat locale files never load",
    ).toEqual([]);
  });

  test("§5 i18n key parity across locales", () => {
    const namespaces = discoverLocaleNamespaces();
    test.skip(namespaces.length === 0, "plugin ships no locale files");

    const mismatches: string[] = [];
    for (const ns of namespaces) {
      const locales = Object.entries(ns.files);
      if (locales.length < 2) continue;
      const keySets = locales.map(
        ([locale, file]) =>
          [locale, new Set(flattenKeys(JSON.parse(readFileSync(file, "utf-8"))))] as const,
      );
      const [, reference] = keySets[0]!;
      for (const [locale, keys] of keySets.slice(1)) {
        const missing = [...reference].filter((k) => !keys.has(k));
        const extra = [...keys].filter((k) => !reference.has(k));
        if (missing.length)
          mismatches.push(`${ns.namespace}/${locale} missing: ${missing.join(", ")}`);
        if (extra.length) mismatches.push(`${ns.namespace}/${locale} extra: ${extra.join(", ")}`);
      }
    }
    expect(mismatches).toEqual([]);
  });

  test("§7.7 theme CSS loads no external resources", () => {
    const files = themeFiles();
    test.skip(files.length === 0, "plugin ships no theme");

    const violations: string[] = [];
    const nonTokenSelectors: string[] = [];
    for (const file of files) {
      const css = readFileSync(file, "utf-8");
      // GDPR/offline: fonts and any other asset must be self-hosted.
      for (const match of css.matchAll(/url\(\s*['"]?(https?:)?\/\/[^)'"]+/g)) {
        violations.push(`${basename(file)}: external url(${match[0].slice(4, 60)}…)`);
      }
      const externalImports = [...css.matchAll(/@import\s+(url\()?['"]?(https?:)?\/\//g)].length;
      if (externalImports > 0) {
        violations.push(`${basename(file)}: ${externalImports} external @import`);
      }
      // Soft signal: a theme should set tokens, not restyle components.
      for (const match of css.matchAll(/^\s*([.#][\w-]+[^{}]*)\{/gm)) {
        const selector = (match[1] ?? "").trim();
        if (!/^(\.dark|\.light)\b/.test(selector))
          nonTokenSelectors.push(`${basename(file)}: ${selector}`);
      }
    }

    if (nonTokenSelectors.length > 0) {
      test.info().annotations.push({
        type: "theme-selectors",
        description:
          "Theme restyles components instead of only setting tokens (§7.7):\n" +
          nonTokenSelectors.slice(0, 20).join("\n"),
      });
    }
    expect(violations, "theme must not load external resources at runtime").toEqual([]);
  });

  test("§2 shell boots with the org plugin active, without console errors", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    await stubBackend(page, configWithOrgPlugin());
    await page.goto("/management-ui/");

    await expect(page.getByRole("link").first()).toBeVisible({ timeout: 15_000 });
    expect(consoleErrors, consoleErrors.join("\n")).toHaveLength(0);
  });

  test("the org plugin actually renders — one of its own strings is on the page", async ({
    page,
  }) => {
    const namespaces = discoverLocaleNamespaces();
    test.skip(namespaces.length === 0, "plugin ships no locale files to look for");

    await stubBackend(page, configWithOrgPlugin());
    await page.goto("/management-ui/");
    await expect(page.getByRole("link").first()).toBeVisible({ timeout: 15_000 });

    // Candidate strings: plain English leaves, long enough to be distinctive and
    // free of interpolation so they render verbatim.
    const candidates: string[] = [];
    for (const ns of namespaces) {
      const enFile = ns.files["en"];
      if (!enFile) continue;
      const collect = (value: unknown): void => {
        if (typeof value === "string") {
          if (value.length >= 5 && !value.includes("{{")) candidates.push(value);
        } else if (value && typeof value === "object") {
          Object.values(value as Record<string, unknown>).forEach(collect);
        }
      };
      collect(JSON.parse(readFileSync(enFile, "utf-8")));
    }
    test.skip(candidates.length === 0, "no interpolation-free strings to match on");

    const bodyText = (await page.locator("body").innerText()).toLowerCase();
    const rendered = candidates.filter((c) => bodyText.includes(c.toLowerCase()));
    expect(
      rendered.length,
      `none of the plugin's ${candidates.length} translated strings appear on the landing page — ` +
        "the plugin loaded but may not have registered its extension points",
    ).toBeGreaterThan(0);
  });
});
