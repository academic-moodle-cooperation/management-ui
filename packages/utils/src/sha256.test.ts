import { describe, it, expect, vi, afterEach } from "vitest";

import { sha256 } from "./index";

afterEach(() => {
  vi.unstubAllGlobals();
});

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

  describe("insecure context (crypto.subtle unavailable)", () => {
    // On plain-HTTP deployments `crypto` exists but `crypto.subtle` is
    // undefined (issue #309) — the exact shape the stub reproduces.
    const stubInsecureCrypto = () => vi.stubGlobal("crypto", {});

    it("does not throw and returns stable lowercase hex", async () => {
      stubInsecureCrypto();
      const hash = await sha256("some-key");
      expect(hash).toMatch(/^[a-f0-9]{28}$/);
      expect(hash).toBe(await sha256("some-key"));
    });

    it("produces different hashes for different inputs", async () => {
      stubInsecureCrypto();
      expect(await sha256("input 1")).not.toBe(await sha256("input 2"));
    });

    it("also survives crypto being entirely undefined", async () => {
      vi.stubGlobal("crypto", undefined);
      const hash = await sha256("some-key");
      expect(hash).toMatch(/^[a-f0-9]{28}$/);
    });
  });
});
