import { describe, it, expect } from "vitest";
import { deepMerge } from "./deepMerge";

describe("deepMerge", () => {
  it("should merge two simple objects", () => {
    const target = { a: 1, b: 2 };
    const source = { b: 3, c: 4 };
    const result = deepMerge(target, source);

    expect(result).toEqual({ a: 1, b: 3, c: 4 });
  });

  it("should merge nested objects", () => {
    const target = { a: { b: 1, c: 2 } };
    const source = { a: { c: 3, d: 4 } };
    const result = deepMerge(target, source);

    expect(result).toEqual({ a: { b: 1, c: 3, d: 4 } });
  });

  it("should not mutate the target object", () => {
    const target = { a: 1 };
    const source = { b: 2 };
    const result = deepMerge(target, source);

    expect(target).toEqual({ a: 1 });
    expect(result).not.toBe(target);
  });

  it("should handle arrays by replacing them", () => {
    const target = { items: [1, 2] };
    const source = { items: [3, 4] };
    const result = deepMerge(target, source);

    expect(result).toEqual({ items: [3, 4] });
  });

  it("should handle null and undefined values", () => {
    const target = { a: 1, b: null };
    const source = { b: undefined, c: 2 };
    const result = deepMerge(target, source);

    // undefined values are skipped, so b remains null
    expect(result).toEqual({ a: 1, b: null, c: 2 });
  });

  it("should skip undefined values", () => {
    const target = { a: 1 };
    const source = { a: undefined, b: 2 };
    const result = deepMerge(target, source);

    // undefined values are skipped, so a remains 1
    expect(result).toEqual({ a: 1, b: 2 });
  });
});
