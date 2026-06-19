---
---

Phase 5 follow-up: extends API Extractor coverage from 3 to **all 6** contract-stable
packages by adding a `types` condition to each package's `exports` map (pointing at
`./dist-types/...`) so that consumers' api-extractor runs can resolve transitive
workspace imports as `.d.ts` instead of raw `.ts`.

Newly instrumented:

- `@oc-mui/router`
- `@oc-mui/query`
- `@oc-mui/store`

Together with `@oc-mui/plugin-system`, `@oc-mui/i18n`, and `@oc-mui/ui-config`
(already instrumented in the Phase 5 PR-B drop), every package listed under
`docs/architecture/CONTRACTS.md` now has a committed `etc/<pkg>.api.md` snapshot and
is gated by the existing `api-check` CI job.

This is a tooling-only change (no runtime API behaviour changed); the empty changeset
is recorded for traceability.
