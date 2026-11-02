# @oc-mui/utils

## 1.3.0

### Minor Changes

- b1d5f78: The GraphQL schema is no longer a per-release-line file. `@oc-mui/query` commits
  one SDL per supported Opencast major (`schema-19.graphql`, `schema-20.graphql`),
  generates its code from the newest one, and `pnpm schema:validate` enforces
  that each schema is a strict superset of the previous major's and that every
  document is valid against every schema it may meet (`queries.graphql`) or
  against the majors it is written for (`queries.oc20.graphql`, the playlist
  operations). The generated code is unchanged. `@oc-mui/utils` gains
  `getOpencastMajor()`, `setOpencastMajor()` and `supportsOpencastMajor(min)`:
  the shell publishes the major its build targets, and a plugin gates features
  that need a newer backend with it instead of the code being reverted per line.

## 1.2.0

### Minor Changes

- 31c19e7: fix(episodes): keep the file extension on downloaded tracks

  The download link handed the raw event title to the browser's `download`
  attribute. A title containing a dot (`Vorlesung 3.2 Einführung`) was read as
  already carrying an extension, so the file was saved without `.mp4` and
  Windows reported an unknown format.

  Adds `buildDownloadFileName` to `@oc-mui/utils`, which appends the real
  extension — taken from the track path, falling back to its MIME type — and
  strips characters Windows rejects in file names.

### Patch Changes

- 3b40cfc: Documentation-only: correct package READMEs against the code (docs overhaul Phase 1).
- 9db8ada: `parseDuration` no longer throws on non-ISO input

  A single event whose `duration` was not valid ISO 8601 (e.g. a raw
  millisecond number) threw inside the table cell renderer, and the nearest
  error boundary unmounted the entire Videos page (#253). `parseDuration`
  now returns the raw value for input tinyduration cannot parse — one odd
  cell instead of a dead module. Valid durations format as before;
  undefined/empty still yields `00:00:00` (rendered as ∞ by callers).

- a36e731: `sha256` no longer throws on plain-HTTP deployments: when `crypto.subtle` is unavailable (insecure contexts), it falls back to a stable cyrb53-based hex hash instead of crashing the caller (#309). The helper's contract is unchanged — non-cryptographic cache keys / stable ids; the fallback output is shorter and not SHA-256.
- 2044d7f: Move the `build:types` incremental state file (`tsconfig.build.tsbuildinfo`) into `dist-types/` so it lives and dies with the declaration output it describes. Previously the state file sat at the package root, outside the turbo `dist-types/**` cache outputs: a stale state file next to a deleted/partial `dist-types/` made `tsc` skip emission entirely, and turbo then cached the empty `dist-types/` — poisoning the (worktree-shared) build cache and breaking `check-types` repo-wide with `TS7016` errors on later "cache hit" runs (#258).

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
