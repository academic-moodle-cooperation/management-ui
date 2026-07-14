import { describe, it, expect } from "vitest";

import { sha256 } from "./index";

describe("sha256", () => {
  it("matches the known SHA-256 vector for the empty string", async () => {
    expect(await sha256("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });

  it("matches the known SHA-256 vector for 'abc'", async () => {
    expect(await sha256("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("returns lowercase hex of the right length", async () => {
    const hash = await sha256("test string");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("is deterministic for the same input", async () => {
    expect(await sha256("consistent input")).toBe(await sha256("consistent input"));
  });

  it("produces different hashes for different inputs", async () => {
    expect(await sha256("input 1")).not.toBe(await sha256("input 2"));
  });

  it("handles special characters", async () => {
    const hash = await sha256("test@#$%^&*()_+-=[]{}|;':\",./<>?");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});
