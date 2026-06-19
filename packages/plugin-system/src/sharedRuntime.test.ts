import { describe, expect, it } from "vitest";

import {
  SHARED_RUNTIME_MAJORS,
  checkSharedDependencyCompatibility,
  parseRangeMajor,
} from "./sharedRuntime";

describe("SHARED_RUNTIME_MAJORS", () => {
  it("declares the host's current shared dep majors", () => {
    // Pin the current majors so a silent drift surfaces in the diff.
    // Updating any of these is a deliberate contract change — bump the
    // package accordingly (minor for additions, major for changes).
    expect(SHARED_RUNTIME_MAJORS).toEqual({
      react: 19,
      "react-dom": 19,
      "react/jsx-runtime": 19,
      "lucide-react": 0,
      "@oc-mui/plugin-system": 1,
      "@oc-mui/app-runtime": 1,
      "@oc-mui/ui": 1,
      "@oc-mui/query": 1,
      "@oc-mui/router": 1,
      "@oc-mui/i18n": 1,
      "@oc-mui/utils": 1,
      "@oc-mui/store": 1,
      "@oc-mui/ui-config": 1,
    });
  });

  it("is frozen so accidental writes throw in strict mode", () => {
    expect(Object.isFrozen(SHARED_RUNTIME_MAJORS)).toBe(true);
  });
});

describe("parseRangeMajor", () => {
  it("parses bare majors", () => {
    expect(parseRangeMajor("1")).toBe(1);
    expect(parseRangeMajor("19")).toBe(19);
  });

  it("parses x-ranges", () => {
    expect(parseRangeMajor("1.x")).toBe(1);
    expect(parseRangeMajor("19.x")).toBe(19);
  });

  it("parses pinned semver", () => {
    expect(parseRangeMajor("1.0.0")).toBe(1);
    expect(parseRangeMajor("19.4.7")).toBe(19);
  });

  it("parses prerelease majors", () => {
    expect(parseRangeMajor("1.0.0-alpha")).toBe(1);
    expect(parseRangeMajor("2.0.0-rc.1")).toBe(2);
  });

  it.each([["^"], ["~"], [">="], [">"], ["<="], ["<"]])(
    "strips leading %s operator",
    (op) => {
      expect(parseRangeMajor(`${op}1.0.0`)).toBe(1);
    },
  );

  it("strips leading 'v' prefix", () => {
    expect(parseRangeMajor("v1.0.0")).toBe(1);
  });

  it("handles 0-major (semver-zero)", () => {
    expect(parseRangeMajor("^0.417.0")).toBe(0);
    expect(parseRangeMajor("0.417.0")).toBe(0);
  });

  it("returns null for 'any version' wildcards", () => {
    expect(parseRangeMajor("*")).toBeNull();
    expect(parseRangeMajor("x")).toBeNull();
    expect(parseRangeMajor("")).toBeNull();
    expect(parseRangeMajor("   ")).toBeNull();
  });

  it("returns null for compound OR ranges (not part of the contract)", () => {
    expect(parseRangeMajor("^1.0.0 || ^2.0.0")).toBeNull();
  });

  it("returns null for garbage", () => {
    expect(parseRangeMajor("not-a-version")).toBeNull();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(parseRangeMajor(undefined as any)).toBeNull();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(parseRangeMajor(null as any)).toBeNull();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(parseRangeMajor(19 as any)).toBeNull();
  });
});

describe("checkSharedDependencyCompatibility", () => {
  it("returns compatible for null/undefined/non-object input", () => {
    expect(checkSharedDependencyCompatibility(undefined).compatible).toBe(true);
    expect(checkSharedDependencyCompatibility(null).compatible).toBe(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(checkSharedDependencyCompatibility("nope" as any).compatible).toBe(true);
  });

  it("returns compatible for an empty deps object", () => {
    expect(checkSharedDependencyCompatibility({}).compatible).toBe(true);
  });

  it("accepts a plugin pinned to the same major", () => {
    const result = checkSharedDependencyCompatibility({
      react: "^19.0.0",
      "@oc-mui/plugin-system": ">=1.0.0",
    });
    expect(result.compatible).toBe(true);
    expect(result.incompatibilities).toBeUndefined();
  });

  it("rejects a plugin pinned to a different major", () => {
    const result = checkSharedDependencyCompatibility({
      react: "^18.0.0",
    });
    expect(result.compatible).toBe(false);
    expect(result.incompatibilities).toHaveLength(1);
    expect(result.incompatibilities?.[0]).toMatchObject({
      name: "react",
      required: "^18.0.0",
      hostMajor: 19,
    });
    expect(result.incompatibilities?.[0]?.reason).toContain("major 18");
    expect(result.incompatibilities?.[0]?.reason).toContain("19");
  });

  it("collects multiple incompatibilities", () => {
    const result = checkSharedDependencyCompatibility({
      react: "^18.0.0",
      "@oc-mui/plugin-system": "^2.0.0",
    });
    expect(result.compatible).toBe(false);
    expect(result.incompatibilities).toHaveLength(2);
  });

  it("reports unknown deps without blocking", () => {
    const result = checkSharedDependencyCompatibility({
      "react": "^19.0.0",
      "some-other-lib": "^3.0.0",
    });
    expect(result.compatible).toBe(true);
    expect(result.unknown).toEqual(["some-other-lib"]);
  });

  it("rejects a wrong-scope reference to a host package (e.g. pre-rename @workspace/*)", () => {
    const result = checkSharedDependencyCompatibility({
      "@workspace/plugin-system": ">=1.0.0",
      "@workspace/ui": "^1.0.0",
    });
    expect(result.compatible).toBe(false);
    const names = (result.incompatibilities ?? []).map((i) => i.name);
    expect(names).toContain("@workspace/plugin-system");
    expect(names).toContain("@workspace/ui");
    const reasons = (result.incompatibilities ?? []).map((i) => i.reason).join(" ");
    expect(reasons).toContain("@oc-mui/plugin-system");
  });

  it("still treats a genuinely unknown scoped dep as non-blocking", () => {
    const result = checkSharedDependencyCompatibility({ "@other/thing": "^1.0.0" });
    expect(result.compatible).toBe(true);
    expect(result.unknown).toEqual(["@other/thing"]);
  });

  it("treats an unparseable range as an incompatibility", () => {
    const result = checkSharedDependencyCompatibility({
      "react": "not-a-version",
    });
    expect(result.compatible).toBe(false);
    expect(result.incompatibilities?.[0]?.reason).toContain("unparseable");
  });

  it("treats a compound OR range as unparseable (contract is one major)", () => {
    const result = checkSharedDependencyCompatibility({
      "react": "^18.0.0 || ^19.0.0",
    });
    expect(result.compatible).toBe(false);
    expect(result.incompatibilities?.[0]?.reason).toContain("unparseable");
  });

  it("treats a wildcard range as unparseable (caller must be explicit)", () => {
    const result = checkSharedDependencyCompatibility({ react: "*" });
    expect(result.compatible).toBe(false);
    expect(result.incompatibilities?.[0]?.reason).toContain("unparseable");
  });

  it("accepts injected host majors (for tests / future host versions)", () => {
    const result = checkSharedDependencyCompatibility(
      { react: "^20.0.0" },
      { react: 20 },
    );
    expect(result.compatible).toBe(true);
  });
});
