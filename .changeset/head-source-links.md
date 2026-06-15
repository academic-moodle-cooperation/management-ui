---
"@opencast-mui/eslint-config": patch
"@opencast-mui/ui": patch
---

Use branch-agnostic `/blob/HEAD/` GitHub links instead of pinning to a branch name, so source/doc links survive branch renames and deletions. Affects the `graphql-operation-naming` rule's doc URL and the default landing page's `REPO_BLOB`.
