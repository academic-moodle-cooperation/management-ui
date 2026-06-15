---
"@opencast-mui/plugin-system": patch
"@opencast-mui/app-runtime": patch
"@opencast-mui/plugin-testing": patch
---

Move React from `dependencies` to `peerDependencies` on the SDK packages that
had it as a hard dependency.

A React library must use the host's single React instance — a bundled second
copy breaks hooks ("Invalid hook call") and context across the host↔plugin
boundary. These three packages declared `react`/`react-dom` under
`dependencies`, which can install a duplicate React in a consumer; the rest of
the SDK already used `peerDependencies`.

- `@opencast-mui/plugin-system`: `react` → peer (`^18 || ^19`); dropped the unused
  `react-dom` dependency (only referenced in shared-runtime config strings, never imported).
- `@opencast-mui/app-runtime`: `react` + `react-dom` → peers (it imports `react-dom/client`).
- `@opencast-mui/plugin-testing`: `react` → required peer; `react-dom` and
  `@testing-library/react` → optional peers (only the `render()` path needs
  them, via a dynamic import). This also fixes a latent bug: the published
  harness dynamically imports `@testing-library/react` at runtime but only
  declared it as a devDependency, so a consumer calling `render()` would have
  hit a missing module.

Each package keeps `react`/`react-dom` in `devDependencies` so its own build
and tests still resolve them. No public API change. Verified: full-workspace
`check-types` (32/32) and the affected packages' tests pass.
