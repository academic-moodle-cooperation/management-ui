import { afterEach, describe, expect, it, vi } from "vitest";

import {
  canPreviewTheme,
  collectThemes,
  discoverOrgThemes,
  isThemeCss,
  orgThemeUrl,
  parseThemeSwatches,
} from "./themes";

import type { TryConfig } from "../config";
import type { RegistryPlugin } from "./registry";

const cfg = (over: Partial<TryConfig> = {}): TryConfig => ({
  enabled: true,
  allowedDomains: ["cdn.jsdelivr.net"],
  allowInsecureHttp: false,
  requireIntegrity: false,
  ...over,
});

const registryTheme = (id: string, url: string): RegistryPlugin => ({
  id,
  name: id,
  description: "",
  version: "1.0.0",
  author: { name: "Someone" },
  url,
  category: "theme",
});

describe("collectThemes", () => {
  it("assembles all three sources with the right config values", () => {
    const themes = collectThemes({
      shipped: [{ id: "ember", name: "Ember", tagline: "Warm" }],
      orgThemes: [{ namespace: "my-org", name: "My Org", source: "jar", url: "/static/plugins/my-org/my-org.css" }],
      catalog: [registryTheme("midnight", "https://cdn.jsdelivr.net/midnight.css"), { ...registryTheme("x", "https://x/x.mjs"), category: "feature" }],
    });
    expect(themes.map((t) => [t.source, t.configValue])).toEqual([
      ["shipped", "ember"],
      ["jar", "my-org"],
      ["registry", undefined],
    ]);
    expect(themes[0]?.url).toMatch(/\/plugins\/themes\/ember\.css$/);
  });
});

describe("orgThemeUrl", () => {
  it("follows the conventional paths the shell probes", () => {
    expect(orgThemeUrl({ namespace: "org", source: "jar" })).toMatch(/\/static\/plugins\/org\/org\.css$/);
    expect(orgThemeUrl({ namespace: "org", source: "local" })).toMatch(/\/local-plugins\/org\/themes\/org\.css$/);
  });
});

describe("canPreviewTheme", () => {
  it("trusts same-origin sources without gates", () => {
    expect(canPreviewTheme({ source: "shipped", url: "/plugins/themes/a.css" }, cfg({ enabled: false })).ok).toBe(true);
    expect(canPreviewTheme({ source: "jar", url: "/static/plugins/o/o.css" }, cfg({ enabled: false })).ok).toBe(true);
  });

  it("gates registry CSS like plugin code", () => {
    expect(canPreviewTheme({ source: "registry", url: "https://cdn.jsdelivr.net/t.css" }, cfg({ enabled: false })).ok).toBe(false);
    expect(canPreviewTheme({ source: "registry", url: "https://evil.example/t.css" }, cfg()).ok).toBe(false);
    expect(canPreviewTheme({ source: "registry", url: "https://cdn.jsdelivr.net/t.css" }, cfg()).ok).toBe(true);
  });
});

describe("parseThemeSwatches", () => {
  it("reads the swatch tokens from :root and overlays .dark", () => {
    const css = `
      /* a comment with --primary: red; inside */
      :root { --background: oklch(0.96 0.01 85); --primary: oklch(0.58 0.13 40); --ring: var(--primary); --sidebar: var(--background); }
      .dark { --background: oklch(0.22 0.006 80); }
    `;
    const sw = parseThemeSwatches(css);
    expect(sw.light).toEqual({
      background: "oklch(0.96 0.01 85)",
      primary: "oklch(0.58 0.13 40)",
      sidebar: "oklch(0.96 0.01 85)",
    });
    expect(sw.dark.background).toBe("oklch(0.22 0.006 80)");
    expect(sw.dark.primary).toBe("oklch(0.58 0.13 40)");
  });

  it("returns empty sets for CSS without the blocks", () => {
    expect(parseThemeSwatches(".foo { color: red; }")).toEqual({ light: {}, dark: {} });
  });
});

// What a feature plugin's own Tailwind build looks like: theme variables in
// `:root, :host`, utilities that *read* host tokens, none that set them.
const pluginCss =
  "@layer theme{:root,:host{--color-red-500:oklch(63.7% .237 25.331);--spacing:.25rem}}" +
  "@layer utilities{.bg-background{background-color:var(--background)}.dark\\:bg-card:is(.dark *){background-color:var(--card)}}";

const themeCss = ":root { --primary: oklch(0.45 0.15 250); } .dark { --primary: oklch(0.7 0.12 250); }";

describe("isThemeCss", () => {
  it("rejects a plugin stylesheet that sets no theme tokens", () => {
    expect(isThemeCss(pluginCss)).toBe(false);
    expect(isThemeCss(".foo { color: red; }")).toBe(false);
  });

  it("accepts a stylesheet that sets a swatch token in :root or .dark", () => {
    expect(isThemeCss(themeCss)).toBe(true);
    expect(isThemeCss(".dark { --sidebar: oklch(0.2 0 0); }")).toBe(true);
  });
});

describe("discoverOrgThemes", () => {
  afterEach(() => vi.unstubAllGlobals());

  const serve = (sheets: Record<string, string>) =>
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        const name = Object.keys(sheets).find((n) => url.endsWith(`/${n}.css`));
        return name === undefined
          ? new Response("<!doctype html>", { headers: { "content-type": "text/html" } })
          : new Response(sheets[name], { headers: { "content-type": "text/css" } });
      }),
    );

  it("lists a deployed plugin only when its conventional CSS is a theme", async () => {
    serve({ "feature-jar": pluginCss, "theme-jar": themeCss, "theme-local": themeCss, "feature-local": pluginCss });
    const found = await discoverOrgThemes(
      [
        { name: "Feature", namespace: "feature-jar", url: "/static/plugins/feature-jar/feature-jar.mjs" },
        { name: "Theme", namespace: "theme-jar", url: "/static/plugins/theme-jar/theme-jar.mjs" },
        { name: "No CSS", namespace: "no-css-jar", url: "/static/plugins/no-css-jar/no-css-jar.mjs" },
      ],
      [
        { name: "Local theme", id: "theme-local", url: "/local-plugins/theme-local/src/index.ts" },
        { name: "Local feature", id: "feature-local", url: "/local-plugins/feature-local/src/index.ts" },
      ],
    );
    expect(found.map((t) => `${t.source}:${t.namespace}`)).toEqual(["jar:theme-jar", "local:theme-local"]);
    expect(found[0]?.url).toMatch(/\/static\/plugins\/theme-jar\/theme-jar\.css$/);
  });
});
