---
"@oc-mui/query": patch
"@oc-mui/utils": minor
---

The GraphQL schema is no longer a per-release-line file. `@oc-mui/query` commits
one SDL per supported Opencast major (`schema-19.graphql`, `schema-20.graphql`),
generates its code from the newest one, and `pnpm schema:validate` enforces
that each schema is a strict superset of the previous major's and that every
document is valid against every schema it may meet (`queries.graphql`) or
against the majors it is written for (`queries.oc20.graphql`, the playlist
operations). The generated code is unchanged. `@oc-mui/utils` gains
`getOpencastMajor()`, `setOpencastMajor()` and `supportsOpencastMajor(min)`:
the shell publishes the major its build targets, and a plugin gates features
that need a newer backend with it instead of the code being reverted per line.
