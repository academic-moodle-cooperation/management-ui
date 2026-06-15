---
"@opencast-mui/plugin-admin-marketplace": patch
"@opencast-mui/vite-config": patch
---

Enforce the Shared Runtime Dependencies contract at every plugin-load path
(open-followups §5.3). `checkSharedDependencyCompatibility` (in
`@opencast-mui/plugin-system`) becomes the single source of truth across all three
loaders:

- **Marketplace** — `securityService.checkVersionCompatibility` now delegates
  to the canonical checker (the older exact-semver `parseSemver`/
  `satisfiesConstraint` logic is removed). Both the install-time load gate and
  the UI compatibility badge use canonical major-matching, so they can't
  diverge.
- **`.local-plugins/` dev** — `@opencast-mui/vite-config`'s dev plugin surfaces each
  plugin's `workspaceDependencies` (from `plugin.json`) into
  `/local-plugins/manifest.json`; the shell gates each entry before loading.
- **JAR** — the shell applies the same gate to backend entries and reads
  `workspaceDependencies` when present. No-op until the backend includes the
  field in `plugins.json` (forward-compatible; tracked as the §5.3 residual).

No published-API behaviour change; the marketplace's stricter exact-version
match is relaxed to the contract's major-only rule, matching the other paths.
