import { describe, it, expect } from "vitest";

import {
  PLUGIN_API_VERSION,
  parseSemver,
  checkApiVersionCompatibility,
} from "./apiVersion";

describe("PLUGIN_API_VERSION", () => {
  it("is a valid strict semver", () => {
    expect(parseSemver(PLUGIN_API_VERSION)).not.toBeNull();
  });

  it("is currently 1.0.0 (frozen baseline for 1.x)", () => {
    expect(PLUGIN_API_VERSION).toBe("1.0.0");
  });
});

describe("parseSemver", () => {
  it("parses plain versions", () => {
    expect(parseSemver("1.2.3")).toEqual({ major: 1, minor: 2, patch: 3 });
  });

  it("parses prerelease versions", () => {
    expect(parseSemver("2.0.0-beta.1")).toEqual({
      major: 2,
      minor: 0,
      patch: 0,
      prerelease: "beta.1",
    });
  });

  it.each([
    "",
    "1",
    "1.2",
    "v1.2.3",
    "1.2.3.4",
    "abc",
    null,
    undefined,
  ])("returns null for invalid input %s", (input) => {
    expect(parseSemver(input as string | null | undefined)).toBeNull();
  });

  it("trims whitespace", () => {
    expect(parseSemver("  1.0.0  ")).toEqual({ major: 1, minor: 0, patch: 0 });
  });
});

describe("checkApiVersionCompatibility", () => {
  it("treats an absent requiredApiVersion as 1.0.0", () => {
    expect(checkApiVersionCompatibility(undefined, "1.5.0").compatible).toBe(true);
    expect(checkApiVersionCompatibility("", "1.5.0").compatible).toBe(true);
  });

  it("accepts a plugin asking for the same minor or lower", () => {
    expect(checkApiVersionCompatibility("1.0.0", "1.5.0").compatible).toBe(true);
    expect(checkApiVersionCompatibility("1.5.0", "1.5.0").compatible).toBe(true);
    expect(checkApiVersionCompatibility("1.4.9", "1.5.0").compatible).toBe(true);
  });

  it("rejects a plugin asking for a higher minor than the host", () => {
    const result = checkApiVersionCompatibility("1.6.0", "1.5.0");
    expect(result.compatible).toBe(false);
    expect(result.reason).toMatch(/minor/i);
  });

  it("rejects a plugin asking for a different major", () => {
    const result = checkApiVersionCompatibility("2.0.0", "1.5.0");
    expect(result.compatible).toBe(false);
    expect(result.reason).toMatch(/major/i);
  });

  it("rejects a plugin with an invalid apiVersion string", () => {
    const result = checkApiVersionCompatibility("not-a-version", "1.0.0");
    expect(result.compatible).toBe(false);
    expect(result.reason).toMatch(/not a valid semver/i);
  });

  it("rejects an invalid host version", () => {
    const result = checkApiVersionCompatibility("1.0.0", "garbage");
    expect(result.compatible).toBe(false);
    expect(result.reason).toMatch(/Host API version/i);
  });

  it("ignores patch differences", () => {
    expect(checkApiVersionCompatibility("1.2.99", "1.2.0").compatible).toBe(true);
    expect(checkApiVersionCompatibility("1.2.0", "1.2.99").compatible).toBe(true);
  });
});
