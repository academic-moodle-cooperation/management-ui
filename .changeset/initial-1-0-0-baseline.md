---
---

Phase 5 PR-A: introduce changesets, semver/deprecation policy, and host-side
plugin `apiVersion` enforcement; bump every `@workspace/*` workspace package
from `0.0.0` to `1.0.0` to align with the 1.x contracts already declared in
[`docs/architecture/CONTRACTS.md`](./docs/architecture/CONTRACTS.md).

This is the baseline changeset: from this point on, every PR that touches a
released package must add its own changeset; CI enforces the rule.
