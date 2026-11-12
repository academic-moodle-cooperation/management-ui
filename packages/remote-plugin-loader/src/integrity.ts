/**
 * Subresource-integrity-style verification for remote plugin bundles.
 *
 * Dynamic `import()` cannot carry an `integrity` attribute, but this loader
 * fetches the module source itself before importing it via a blob URL — so
 * the hash check happens exactly where the bytes are, with no second fetch
 * (and therefore no fetch/execute race an attacker could wedge into).
 *
 * The metadata format is the SRI string: `<algo>-<base64>`, e.g.
 * `sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC`.
 */

/** Supported digest algorithms, mapped to WebCrypto names. */
const ALGORITHMS: Record<string, string> = {
  sha256: "SHA-256",
  sha384: "SHA-384",
  sha512: "SHA-512",
};

export interface IntegrityCheckResult {
  ok: boolean;
  /** The computed digest in SRI format (for error messages / pinning help). */
  actual: string;
}

/**
 * Parse an SRI-style integrity string. Throws on malformed input so callers
 * fail closed on typos instead of silently skipping verification.
 */
export function parseIntegrity(integrity: string): { algo: string; digest: string } {
  const match = /^(sha256|sha384|sha512)-([A-Za-z0-9+/=]+)$/.exec(integrity.trim());
  if (!match || !match[1] || !match[2]) {
    throw new Error(
      `Malformed integrity value "${integrity}". Expected "<sha256|sha384|sha512>-<base64>".`,
    );
  }
  return { algo: match[1], digest: match[2] };
}

function toBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/**
 * Verify raw fetched bytes against an SRI-style integrity string.
 *
 * @param bytes - The exact bytes as fetched (before any transformation).
 * @param integrity - SRI string, e.g. `sha384-<base64>`.
 */
export async function verifyIntegrity(
  bytes: ArrayBuffer,
  integrity: string,
): Promise<IntegrityCheckResult> {
  const { algo, digest } = parseIntegrity(integrity);
  const webCryptoName = ALGORITHMS[algo];
  if (!webCryptoName) {
    // Unreachable via parseIntegrity's regex, kept for defense in depth.
    throw new Error(`Unsupported integrity algorithm "${algo}".`);
  }
  const hash = await crypto.subtle.digest(webCryptoName, bytes);
  const actualB64 = toBase64(hash);
  return { ok: actualB64 === digest, actual: `${algo}-${actualB64}` };
}
