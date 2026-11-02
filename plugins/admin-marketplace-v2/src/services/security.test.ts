import { describe, expect, it } from "vitest";

import { validateTryPlugin, validateTryUrl } from "./security";

import type { TryConfig } from "../config";

const cfg = (overrides: Partial<TryConfig> = {}): TryConfig => ({
  enabled: true,
  allowedDomains: ["cdn.jsdelivr.net", "raw.githubusercontent.com"],
  allowInsecureHttp: false,
  requireIntegrity: false,
  ...overrides,
});

const entry = (overrides: Partial<Parameters<typeof validateTryPlugin>[0]> = {}) => ({
  id: "demo",
  url: "https://cdn.jsdelivr.net/gh/org/repo@v1/dist/plugin.mjs",
  ...overrides,
});

describe("validateTryUrl", () => {
  it("accepts an allowlisted https URL", () => {
    expect(validateTryUrl("https://cdn.jsdelivr.net/x.mjs", cfg()).valid).toBe(true);
  });

  it("accepts subdomains of allowlisted domains", () => {
    expect(validateTryUrl("https://sub.cdn.jsdelivr.net/x.mjs", cfg()).valid).toBe(true);
  });

  it("rejects hosts that merely contain an allowed domain as a substring", () => {
    const result = validateTryUrl("https://evilcdn.jsdelivr.net.attacker.example/x.mjs", cfg());
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/not in the allowed list/);
  });

  it("rejects unlisted domains", () => {
    const result = validateTryUrl("https://example.org/x.mjs", cfg());
    expect(result.valid).toBe(false);
  });

  it("rejects non-http(s) protocols", () => {
    for (const url of ["ftp://cdn.jsdelivr.net/x.mjs", "javascript:alert(1)", "data:text/javascript,1"]) {
      expect(validateTryUrl(url, cfg()).valid, url).toBe(false);
    }
  });

  it("rejects malformed URLs", () => {
    expect(validateTryUrl("not a url", cfg()).valid).toBe(false);
  });
});

describe("validateTryPlugin", () => {
  it("fails closed when the gesture is disabled", () => {
    const result = validateTryPlugin(entry(), cfg({ enabled: false }));
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/disabled/);
  });

  it("accepts a plain allowlisted entry", () => {
    expect(validateTryPlugin(entry(), cfg()).valid).toBe(true);
  });

  it("warns (but allows) unpinned entries by default", () => {
    const result = validateTryPlugin(entry(), cfg());
    expect(result.valid).toBe(true);
    expect(result.warnings.join(" ")).toMatch(/not integrity-pinned/);
  });

  it("blocks unpinned entries when requireIntegrity is on", () => {
    const result = validateTryPlugin(entry(), cfg({ requireIntegrity: true }));
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/integrity/);
  });

  it("accepts pinned entries when requireIntegrity is on", () => {
    const result = validateTryPlugin(
      entry({ integrity: "sha384-QUJD" }),
      cfg({ requireIntegrity: true }),
    );
    expect(result.valid).toBe(true);
  });

  it("propagates URL failures", () => {
    const result = validateTryPlugin(entry({ url: "https://example.org/x.mjs" }), cfg());
    expect(result.valid).toBe(false);
  });
});
