---
"@opencast-mui/query": major
"@opencast-mui/router": major
---

Phase 8.5.1c — rename the 33 grandfathered GraphQL operations and fragments
in `packages/query/src/queries.graphql` plus 2 inline `gql\`\`` operations to
the PascalCase prefix required by the GraphQL Operation Naming Contract
(`CONTRACTS.md` §6).

**This is a major bump because the public hook + type surface of
`@opencast-mui/query` changes.** Every consumer of the generated hooks and
types needs the corresponding rename in the same release:

- `useGetMyEventsQuery` → `useMuiGetMyEventsQuery`
- `GetMyEventsQuery` (type) → `MuiGetMyEventsQuery`
- `GetMyEventsDocument` → `MuiGetMyEventsDocument`
- … and similarly for every operation listed below.

The 33 operations/fragments renamed in `queries.graphql`:

- Operations: `User`, `SearchUser`, `GetMySeries`, `GetSeriesInfo`,
  `GetSeriesByIdInputFields`, `GetMySeriesNameAndId`, `GetSeriesNameById`,
  `EventsFromSeries`, `GetMyEvents`, `GetEventById`,
  `GetEventByIdInputFields`, `GetAllManagedAcls`,
  `GetManagedAclsWithEventId`, `GetManagedAclsWithSeriesId`,
  `CreateSeries`, `UpdateSeries`, `UpdateEvent`, `DeleteEvent`,
  `UpdateEventAcl`, `UpdateSeriesAcl` — all gain the `Mui` prefix.
- Fragments with redundant `Plugin` prefix (`PluginCurrentUserFields`,
  `PluginUserFields`, `PluginSeriesFields`, `PluginEventFields`) — `Plugin`
  replaced with `Mui`.
- Other fragments (`SeriesData`, `EventsData`, `EventsAclData`,
  `SeriesAclData`, `GetInputFieldsMetaData`, `GetListInputFieldsMetaData`,
  `GetStringInputFieldsMetaData`, `GetDurationInputFieldsMetaData`,
  `GetDateTimeInputFieldsMetaData`) — gain the `Mui` prefix.

Two inline `gql\`\`` operations elsewhere:

- `packages/query/src/hooks/useGetCurrentUser.ts`: `query GetCurrentUser`
  → `query MuiGetCurrentUser` (and its `UserQuery` type assertion is
  updated to `MuiUserQuery` accordingly).
- `plugins/core-upload/src/App.tsx`: the inline `query GetMySeriesNameAndId`
  is **deleted** — the plugin now imports `MuiGetMySeriesNameAndIdDocument`
  from `@opencast-mui/query` and passes it to `graphQLClient.request`. One
  fewer duplicate to keep in sync.

Migration tracker: every `# eslint-disable-next-line local/graphql-operation-naming`
comment is removed; `git grep` returns zero hits in source. The
`--report-unused-disable-directives` lint flag would catch any leftover.

24 consumer files updated to use the renamed hooks and types.

**`@opencast-mui/router` is also bumped major** because its `AuthContextType`
public surface uses the `UserQuery` type from `@opencast-mui/query`. The type
is structurally identical to the new `MuiUserQuery`, but the imported
name changes — any consumer that imported `UserQuery` from `@opencast-mui/query`
to type-cast against `AuthContextType.setUser` would need the rename.

Verified: `pnpm verify` runs 89/89 turbo tasks green plus the Playwright
smoke E2E.
