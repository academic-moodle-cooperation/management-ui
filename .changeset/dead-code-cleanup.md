---
"@oc-mui/query": patch
"@oc-mui/app-runtime": patch
---

Remove verified dead code (pre-open-source cleanup).

None of these had any consumer (checked in-repo and across the org plugin
repos):

- `@oc-mui/query`: removed the null-wrapper `useGenericQuery` (use `useQuery`
  directly) and the never-initialised GraphQL client singleton
  (`getGraphQLClient` / `initializeGraphQLClient`) — the live path is the
  `createGraphQLClient` factory. (`QueryKey`, which was only re-exported through
  `useGenericQuery`, is no longer surfaced; import it from `@tanstack/react-query`.)
- `@oc-mui/app-runtime`: removed the unused `registerApp` / `getApps` from the
  runtime context (and the `useState`-backed second app registry behind them) —
  apps flow through the plugin manager's `apps:definitions`, not this context.

Not touched:

- `datetime-picker.tsx` is **live** (rendered by `MetadataUpdateField` for
  DURATION fields, used by core-episodes/series), so it and the react-aria
  dependencies stay.
- `SwitchHeadlessUI` (and the `@headlessui/react` dependency behind it) is
  **live**: tuwien's SidebarHeader in management-ui-plugins uses it for the
  language toggle. Removing it is tracked as a follow-up (native radix Switch +
  tuwien migration) in `docs/operations/open-followups.md`.
