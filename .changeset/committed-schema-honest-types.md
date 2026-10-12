---
"@oc-mui/query": minor
---

GraphQL codegen reads a committed schema, and the emitted hook types survive every consumer.

- The schema now lives in the repo (`src/schema.graphql`, taken from Opencast 20.0.0.SNAPSHOT) and codegen reads it — regenerating types needs no running backend. Refreshing the schema from a live instance is the separate, reviewed `schema:refresh` step, and `pnpm codegen:check` (CI + `pnpm verify`) regenerates and fails on any diff, so committed inputs and outputs can no longer drift apart.
- The generated query/suspense hooks carry explicit return annotations. Without them, the emitted `.d.ts` referenced tanstack's `NoInfer` — which only some `@tanstack/react-query` minors export; where it doesn't resolve, `skipLibCheck` hid the error and every hook's `data` silently degraded to `any` for consumers. A consumer-perspective type check over `dist-types` (with `skipLibCheck: false`, plus a version-independent no-`NoInfer` guard) now runs in CI.
- Refreshing the schema brought in the Playlist API that Opencast's current line gained (types and inputs only — no operations use it yet).
