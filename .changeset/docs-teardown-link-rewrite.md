---
---

Docs teardown (N6): the old `docs/` tree was removed and its pages moved into the
role-based tree, so every reference to a `docs/…` path was rewritten repo-wide.
Inside versioned packages this touched only READMEs, code comments, one ESLint
message, one JSON-schema description and one dev-server notice — nothing a
consumer's build or runtime behaviour depends on, hence an empty changeset.
