---
"@oc-mui/providers": patch
---

Declare the `@oc-mui/query` peer dependency as `workspace:^` instead of
`workspace:*`. The exact-version range made every query release — even a
patch or minor — fall outside the declared peer range, which is why changesets
bumped `@oc-mui/providers` a **major** on each query bump (1 → 2 last time, and
it would have been 2 → 3 on the codegen-toolchain minor). With a caret range
providers follows query with a patch bump and only takes a major when query
actually goes major. No runtime change; pnpm rewrites the range to `^<version>`
at publish time either way.
