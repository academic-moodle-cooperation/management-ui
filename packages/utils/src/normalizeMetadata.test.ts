import { describe, it, expect } from "vitest";

import { normalizeMetadataValue, normalizeMetadataObject } from "./normalizeMetadata";

describe("normalizeMetadataValue", () => {
  it("should return empty string for null", () => {
    expect(normalizeMetadataValue(null)).toBe("");
  });

  it("should return empty string for undefined", () => {
    expect(normalizeMetadataValue(undefined)).toBe("");
  });

  it("should return empty string for 'null' string", () => {
    expect(normalizeMetadataValue("null")).toBe("");
  });

  it("should convert number to string", () => {
    expect(normalizeMetadataValue(123)).toBe("123");
  });

  it("should convert boolean to string", () => {
    expect(normalizeMetadataValue(true)).toBe("true");
    expect(normalizeMetadataValue(false)).toBe("false");
  });

  it("should handle arrays with valid values", () => {
    const result = normalizeMetadataValue(["value1", "value2", "value3"]);
    expect(result).toEqual(["value1", "value2", "value3"]);
  });

  it("should filter out null/undefined/'null' from arrays", () => {
    const result = normalizeMetadataValue(["value1", null, "value2", undefined, "null", "value3"]);
    expect(result).toEqual(["value1", "value2", "value3"]);
  });

  it("should return empty array for array with only null/undefined values", () => {
    expect(normalizeMetadataValue([null, undefined, "null"])).toEqual([]);
  });
});

describe("normalizeMetadataObject", () => {
  it("should normalize all values in metadata object", () => {
    const metadata = {
      title: "Test Title",
      description: null,
      tags: ["tag1", "tag2"],
      empty: "",
    };

    const result = normalizeMetadataObject(metadata);
    expect(result).toEqual({
      title: "Test Title",
      tags: ["tag1", "tag2"],
    });
  });

  it("should remove null and undefined values", () => {
    const metadata = {
      title: "Test",
      description: null,
      author: undefined,
      year: 2024,
    };

    const result = normalizeMetadataObject(metadata);
    expect(result).toEqual({
      title: "Test",
      year: "2024",
    });
  });

  it("should remove empty arrays", () => {
    const metadata = {
      title: "Test",
      tags: [],
      categories: ["cat1"],
    };

    const result = normalizeMetadataObject(metadata);
    expect(result).toEqual({
      title: "Test",
      categories: ["cat1"],
    });
  });

  it("should handle empty object", () => {
    expect(normalizeMetadataObject({})).toEqual({});
  });

  it("should filter null/undefined from arrays in metadata", () => {
    const metadata = {
      title: "Test",
      tags: ["tag1", null, "tag2", undefined, "tag3"],
    };

    const result = normalizeMetadataObject(metadata);
    expect(result).toEqual({
      title: "Test",
      tags: ["tag1", "tag2", "tag3"],
    });
  });
});
