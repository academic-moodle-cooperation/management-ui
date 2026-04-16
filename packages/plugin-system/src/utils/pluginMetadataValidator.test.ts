import { describe, it, expect } from "vitest";
import { validatePluginMetadata } from "./pluginMetadataValidator";

const validMinimalManifest = {
  id: "my-plugin",
  name: "My Plugin",
  description: "Does something useful.",
  version: "1.0.0",
  author: { name: "Someone" },
  namespace: "my-plugin",
  type: "app",
};

describe("validatePluginMetadata", () => {
  it("accepts a minimal valid manifest", () => {
    const result = validatePluginMetadata(validMinimalManifest);
    expect(result).toEqual({ valid: true, errors: [] });
  });

  it("rejects null or non-object input", () => {
    expect(validatePluginMetadata(null).valid).toBe(false);
    expect(validatePluginMetadata(undefined).valid).toBe(false);
    expect(validatePluginMetadata("not-an-object").valid).toBe(false);
  });

  it("reports missing required fields", () => {
    const result = validatePluginMetadata({});
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("id"),
        expect.stringContaining("name"),
        expect.stringContaining("version"),
        expect.stringContaining("description"),
        expect.stringContaining("author"),
        expect.stringContaining("namespace"),
      ]),
    );
  });

  it("validates id pattern", () => {
    const result = validatePluginMetadata({ ...validMinimalManifest, id: "Invalid ID" });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("id"))).toBe(true);
  });

  it("validates version is strict semver", () => {
    const result = validatePluginMetadata({ ...validMinimalManifest, version: "1.0" });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("semantic versioning"))).toBe(true);
  });

  it("validates namespace pattern", () => {
    const result = validatePluginMetadata({ ...validMinimalManifest, namespace: "Not Valid" });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("namespace"))).toBe(true);
  });

  it("validates category enum when present", () => {
    const result = validatePluginMetadata({ ...validMinimalManifest, category: "bogus" });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("category"))).toBe(true);
  });

  it("accepts a valid apiVersion", () => {
    const result = validatePluginMetadata({ ...validMinimalManifest, apiVersion: "1.2.0" });
    expect(result.valid).toBe(true);
  });

  it("rejects a malformed apiVersion", () => {
    const result = validatePluginMetadata({
      ...validMinimalManifest,
      apiVersion: ">=1.0.0",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("apiVersion"))).toBe(true);
  });

  it("rejects a non-string apiVersion", () => {
    const result = validatePluginMetadata({ ...validMinimalManifest, apiVersion: 1 });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("apiVersion"))).toBe(true);
  });

  it("validates modules array structure", () => {
    const result = validatePluginMetadata({
      ...validMinimalManifest,
      type: undefined,
      modules: [
        { id: "one", type: "app", entry: "dist/one.mjs" },
        { id: "two" },
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("modules[1].type"))).toBe(true);
    expect(result.errors.some((e) => e.includes("modules[1].entry"))).toBe(true);
  });

  it("accepts a valid multi-module manifest", () => {
    const result = validatePluginMetadata({
      id: "multi",
      name: "Multi",
      description: "multi-module plugin",
      version: "2.3.4",
      author: { name: "Dev" },
      namespace: "multi",
      modules: [
        { id: "sidebar", type: "sidebar", entry: "dist/sidebar.mjs" },
        { id: "app", type: "app", entry: "dist/app.mjs" },
      ],
    });
    expect(result).toEqual({ valid: true, errors: [] });
  });
});
