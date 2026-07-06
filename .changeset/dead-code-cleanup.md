---
"@oc-mui/query": patch
"@oc-mui/ui": patch
"@oc-mui/app-runtime": patch
---

Remove verified dead code (pre-open-source cleanup).

None of these had any in-repo consumer:

- `@oc-mui/ui`: dropped the dead `SwitchHeadlessUI` re-export and its
  `@headlessui/react` dependency (the only use of headlessui).
- `@oc-mui/query`: removed the null-wrapper `useGenericQuery` (use `useQuery`
  directly) and the never-initialised GraphQL client singleton
  (`getGraphQLClient` / `initializeGraphQLClient`) — the live path is the
  `createGraphQLClient` factory. (`QueryKey`, which was only re-exported through
  `useGenericQuery`, is no longer surfaced; import it from `@tanstack/react-query`.)
- `@oc-mui/app-runtime`: removed the unused `registerApp` / `getApps` from the
  runtime context (and the `useState`-backed second app registry behind them) —
  apps flow through the plugin manager's `apps:definitions`, not this context.

Not touched: `datetime-picker.tsx` is **live** (rendered by `MetadataUpdateField`
for DURATION fields, used by core-episodes/series), so it and the react-aria
dependencies stay.
