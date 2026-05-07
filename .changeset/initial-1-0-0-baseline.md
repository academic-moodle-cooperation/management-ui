---
"@workspace/plugin-admin-marketplace": minor
---

Phase 5 PR-A baseline. Two user-visible changes:

1. **Marketplace `RemoteLoader` now enforces `apiVersion`.** When a registry
   entry declares an `apiVersion` field, `loadAndRegister` runs it through
   `checkApiVersionCompatibility` from `@workspace/plugin-system` before any
   network fetch and refuses plugins whose major mismatches the host's
   `PLUGIN_API_VERSION` or whose minor exceeds the host's. Older registry
   entries without `apiVersion` continue to load (defaulted to "1.0.0").
2. **`@workspace/*` workspace packages bumped from `0.0.0` to `1.0.0`** to
   align with the 1.x contracts already declared in
   `docs/architecture/CONTRACTS.md`. Internal references use `workspace:*`
   so the lockfile is unchanged.

This is the baseline changeset: from here on every PR that touches a released
package must add its own changeset; CI enforces the rule (later commit in
this PR).
