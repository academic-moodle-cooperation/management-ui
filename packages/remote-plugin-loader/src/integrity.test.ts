import { describe, expect, it } from "vitest";

import { parseIntegrity, verifyIntegrity } from "./integrity";

const encode = (text: string): ArrayBuffer => new TextEncoder().encode(text).buffer as ArrayBuffer;

/** Compute the SRI string for a payload, the same way a registry author would. */
async function sriFor(text: string, algo: "SHA-256" | "SHA-384" | "SHA-512"): Promise<string> {
  const hash = await crypto.subtle.digest(algo, encode(text));
  const b64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
  return `${algo.replace("SHA-", "sha").toLowerCase()}-${b64}`;
}

describe("parseIntegrity", () => {
  it("accepts well-formed values for every supported algorithm", () => {
    expect(parseIntegrity("sha256-abc+/=")).toEqual({ algo: "sha256", digest: "abc+/=" });
    expect(parseIntegrity("  sha384-QUJD  ")).toEqual({ algo: "sha384", digest: "QUJD" });
    expect(parseIntegrity("sha512-eHl6")).toEqual({ algo: "sha512", digest: "eHl6" });
  });

  it("throws on malformed values instead of skipping verification", () => {
    for (const bad of ["", "md5-abcd", "sha384", "sha384-", "sha384-not base64!", "abcd"]) {
      expect(() => parseIntegrity(bad), bad).toThrow(/Malformed integrity/);
    }
  });
});

describe("verifyIntegrity", () => {
  const payload = 'export default { name: "demo" };';

  it.each(["SHA-256", "SHA-384", "SHA-512"] as const)(
    "accepts matching bytes (%s)",
    async (algo) => {
      const integrity = await sriFor(payload, algo);
      const result = await verifyIntegrity(encode(payload), integrity);
      expect(result.ok).toBe(true);
      expect(result.actual).toBe(integrity);
    },
  );

  it("rejects tampered bytes and reports the actual digest", async () => {
    const integrity = await sriFor(payload, "SHA-384");
    const result = await verifyIntegrity(encode(payload + "//evil"), integrity);
    expect(result.ok).toBe(false);
    expect(result.actual).toMatch(/^sha384-/);
    expect(result.actual).not.toBe(integrity);
  });

  it("rejects a digest of the right shape but wrong value", async () => {
    const other = await sriFor("something else entirely", "SHA-256");
    const result = await verifyIntegrity(encode(payload), other);
    expect(result.ok).toBe(false);
  });
});
