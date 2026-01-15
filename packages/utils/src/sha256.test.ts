import { describe, it, expect } from "vitest";

import { sha256 } from "./index";

describe("sha256", () => {
  it("should hash a string", () => {
    const input = "test string";
    const hash = sha256(input);
    expect(hash).toBeDefined();
    expect(typeof hash).toBe("object");
    expect(hash.toString()).toMatch(/^[a-f0-9]{64}$/i);
  });

  it("should produce consistent hashes for the same input", () => {
    const input = "consistent input";
    const hash1 = sha256(input);
    const hash2 = sha256(input);
    expect(hash1.toString()).toBe(hash2.toString());
  });

  it("should produce different hashes for different inputs", () => {
    const hash1 = sha256("input 1");
    const hash2 = sha256("input 2");
    expect(hash1.toString()).not.toBe(hash2.toString());
  });

  it("should handle empty string", () => {
    const hash = sha256("");
    expect(hash).toBeDefined();
    expect(hash.toString()).toMatch(/^[a-f0-9]{64}$/i);
  });

  it("should handle special characters", () => {
    const input = "test@#$%^&*()_+-=[]{}|;':\",./<>?";
    const hash = sha256(input);
    expect(hash).toBeDefined();
    expect(hash.toString()).toMatch(/^[a-f0-9]{64}$/i);
  });
});
