---
"@oc-mui/utils": minor
---

Replace `crypto-js` with the platform Web Crypto API in `sha256`.

`crypto-js` is effectively unmaintained and has a history of CVEs; it was pulled
in only for a single `sha256` re-export. `sha256` now uses
`crypto.subtle.digest("SHA-256", …)` — no dependency, and correctness is pinned
by known-answer test vectors.

**BREAKING (pre-first-publish):** `sha256` is now **async** and returns a
lowercase-hex `string` (`(input: string) => Promise<string>`), where it
previously returned a synchronous crypto-js `WordArray`. It also requires a
secure context (HTTPS or localhost), like all Web Crypto. There are no in-repo
callers of the export, so nothing else changes. Filed as `minor` rather than
`major` because the SDK has not been published yet; adjust when cutting 1.0.0 if
a strict major is preferred.
