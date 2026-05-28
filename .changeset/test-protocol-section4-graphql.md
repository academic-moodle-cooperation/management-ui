---
---

Docs: expand the release test protocol's Section 4 (GraphQL data flow)
with concrete how-to steps. Adds a "How to read GraphQL traffic"
preamble (all operations POST to the same `/graphql` URL — read the
operation name out of the request payload, check the `Mui` prefix,
inspect `data` vs `errors`) and a "How to inspect the TanStack Query
cache" preamble (the always-mounted React Query Devtools panel and the
default `staleTime`/`refetchOnWindowFocus` it assumes).

Rewrites the checks table to be verifiable rather than vague: the three
operation-name checks now say where to look; adds a sort-`orderBy`
validity check (the path that surfaced the `EventOrderByInput`
regression); and corrects the cache rows — lists do **not** refetch on
focus (global default is `false`); they auto-poll only while an item is
processing (`refetchInterval`), and `MuiGetCurrentUser` is the one query
that opts into `refetchOnWindowFocus: true`.

Docs-only. Empty changeset records the documentation nature of the change.
