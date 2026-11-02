import { describe, expect, it } from "vitest";

import { canPreviewTheme, collectThemes, orgThemeUrl } from "./themes";

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
