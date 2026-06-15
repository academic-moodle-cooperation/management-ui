---
"@opencast-mui/eslint-config": minor
---

Add `eslint-plugin-boundaries` rules to the shared base config to mechanise the
architectural import boundaries `AGENTS.md` documents:

- `app` → may import `app`, `package`, `plugin`
- `plugin` → may import `package`, itself, and `plugins/core` (the canonical
  infrastructure plugin that owns shared extension-point identifiers)
- `package` → may import other `package`s (layer ordering deferred)

Cross-plugin imports written as relative paths are now reported as lint errors;
cross-plugin imports written as workspace package specifiers
(`@opencast-mui/plugin-<other>`) remain a follow-up. See `AGENTS.md` →
"Boundaries" for the full picture.

Consumers of `@opencast-mui/eslint-config` inherit the rules automatically; no
per-package action required unless your code currently violates the matrix
above.
