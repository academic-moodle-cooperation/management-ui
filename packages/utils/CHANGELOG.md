# @oc-mui/utils

## 1.1.0

### Minor Changes

- 4451b10: Replace `crypto-js` with the platform Web Crypto API in `sha256`.

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

### Patch Changes

- ed4a3d8: Declare `sideEffects` for tree-shaking, and add API-surface tracking to three more packages.
  - `sideEffects: false` on the pure packages (`utils`, `plugin-system`, `query`,
    `router`, `store`, `ui-config`, `app-runtime`, `plugin-testing`) so bundlers can
    drop unused exports. `@oc-mui/ui` uses `["**/*.css"]` (it ships `globals.css`).
    `@oc-mui/i18n` is intentionally left unset — its entry initialises i18next at
    import time, which is a real side effect.
  - `@oc-mui/app-runtime`, `@oc-mui/utils`, and `@oc-mui/plugin-testing` gain an
    `api-extractor.json` + `api-check`/`api-check:ci` scripts + a committed
    `etc/*.api.md`, so unintended public-API changes are caught in review (matching
    the six packages that already had this).
