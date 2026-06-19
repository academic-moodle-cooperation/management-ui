---
"@oc-mui/plugin-system": minor
---

Phase 8.5.3 — Shared Runtime Dependencies Contract 1.0.

New public exports:

- `SHARED_RUNTIME_MAJORS` — frozen `Record<string, number>` of the major
  versions the host provides for `react`, `react-dom`, `react/jsx-runtime`,
  `lucide-react`, and the contract-stable `@oc-mui/*` packages.
- `checkSharedDependencyCompatibility(required, hostMajors?)` — pure
  compatibility check that takes a plugin's `workspaceDependencies` object
  and the host's majors, returning `{ compatible, incompatibilities?,
  unknown? }`. Mirrors `checkApiVersionCompatibility`.
- `parseRangeMajor(range)` — extracts the lower-bound major from a semver
  range (`^1.0.0`, `>=1.0.0`, `1.x`, `1.0.0-alpha`, etc.). Returns `null`
  for wildcards and compound ranges (which aren't part of the contract).
- New TypeScript types: `SharedRuntimeDependencyName`,
  `SharedDependencyCheckResult`, `SharedDependencyIncompatibility`.

The contract formalises which packages the host shares via
`window.__SHARED_MODULES__` and the rule that a plugin's
`workspaceDependencies` lower-bound major must match the host's. The
runtime check is not yet wired into the JAR loader, `.local-plugins/`
discovery, or the marketplace's older `securityService.checkVersionCompatibility`
— those follow-ups are tracked in `docs/operations/open-followups.md` §5.3.

Manifest 1.1's `workspaceDependencies` field is unchanged in shape; only
its documentation is updated to point at the new contract section. The
`pnpm create-plugin` scaffold now writes a sensible default
`workspaceDependencies` block.

Purely additive — existing plugins are unaffected.
