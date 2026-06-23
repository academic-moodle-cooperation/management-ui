---
---

Initial public release — every published `@oc-mui/*` package debuts at `1.0.0`.

This intentionally collapses the pre-publication changeset backlog. The ~70
accumulated patch/minor/major entries described the internal evolution of
packages that were never published (they were `private` / `access: restricted`),
so replaying them on a first public release would have been misleading: it would
debut `@oc-mui/query`, `@oc-mui/router`, and `@oc-mui/ui-config` at `2.0.0` and
fill the v1.0.0 changelog with churn no external consumer ever experienced.

The full pre-release history remains in git. This file is an empty changeset
(no version bump); from the first published version onward, every change to a
versioned package adds its own changeset as usual.
