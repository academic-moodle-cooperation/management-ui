/**
 * Small id/code generators. Browser-first (`crypto`), with non-secure-context
 * fallbacks so the plugin still works in plain HTTP dev setups and in tests.
 */

// Join-code alphabet without easily-confused characters (no I, L, O, 0, 1).
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** A stable unique id for decks, questions, options, and participants. */
export function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

/** A short, human-readable join code shown to the audience (e.g. "K7QP2M"). */
export function generateJoinCode(length = 6): string {
  const chars: string[] = [];
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const buf = new Uint32Array(length);
    crypto.getRandomValues(buf);
    for (let i = 0; i < length; i += 1) {
      const n = buf[i] ?? 0;
      chars.push(CODE_ALPHABET.charAt(n % CODE_ALPHABET.length));
    }
  } else {
    for (let i = 0; i < length; i += 1) {
      chars.push(CODE_ALPHABET.charAt(Math.floor(Math.random() * CODE_ALPHABET.length)));
    }
  }
  return chars.join("");
}
