# @oc-mui/query

## 2.0.0

### Major Changes

- 3f02712: Remove `app.appName` — it was never rendered anywhere

  Nothing read the key: not the shell, not the in-tree plugins, not the org
  plugins (univie/tuwien). It sat in the public `AppConfig` type suggesting a
  capability that did not exist (#266). Removing it now is free; after the first
  npm publish it would require a deprecation cycle.

  The document title continues to come from `app.HtmlDocumentTitle`, the header
  branding from `app.logoUrl` / `app.orgLogoUrl` and the theme. Deployment
  `config.json` files that still carry `appName` keep working — unknown keys are
  ignored by the config merge.

  `@oc-mui/query` is bumped alongside because its public surface re-exposes the
  `AppConfig` type (via `useAppConfig`), so the field removal is observable
  through it as well.

### Minor Changes

- b135497: Move the GraphQL codegen toolchain to its current majors (`@graphql-codegen/cli` 7,
  `typescript` 6, `typescript-operations` 6, `typescript-react-query` 7; the unused
  `client-preset` is dropped) and regenerate `gql-generated.ts`. Nothing changes at
  runtime — the hooks, fetchers and document constants behave exactly as before —
  but the generators tightened the **types**, and the generated types are part of
  this package's public surface:

  - **Nullable result fields are no longer optional.** A field the schema declares
    nullable used to be generated as `title?: string | null`; it is now
    `title: string | null`. Reading code is unaffected (the new type is assignable
    to the old one). Code that _constructs_ values of a generated type — test
    fixtures, mock data, `satisfies` checks — must now spell out `null` for every
    nullable field it omitted.
  - **Custom scalars are typed.** `DateTime` and `Duration` are `string`, `Long`
    is `number`, `JSON` is `unknown`. They used to be `any`, which silently
    accepted e.g. treating a `Long` id as a string; such places now fail to
    compile and need an explicit conversion or narrowing.
  - **Deprecated:** `Exact`, `MakeOptional`, `MakeMaybe`, `MakeEmpty`. The
    generator no longer exports these internal helpers; hand-written copies keep
    them available, marked `@deprecated`, until the next major.

  The generators' other new behaviour is neutralised in the codegen config and
  post-processing rather than passed on: duplicate input/enum declarations are
  suppressed via `importSchemaTypesFrom`, and the `TypedDocumentString` wrapper
  `typescript-react-query` 7 puts around every document constant is unwrapped back
  into the plain string it always was (the wrapper would have broken `===` and
  `graphql-request`'s `client.request()` for consumers while typing nothing).

  `@oc-mui/ui`, `@oc-mui/plugin-core-series` and `@oc-mui/plugin-core-episodes`
  adapt to the typed scalars and the required-with-`null` fields: the ACL editor
  converts the managed-ACL id to the `Long` the mutation input expects,
  `MetadataField` renders through the string form of the field value instead of
  relying on `any`, and `MetadataUpdateField` now accepts the field's value in
  whatever scalar type the API delivers it (`value: unknown`) and normalises it
  itself — callers that passed `string | string[]` are unaffected.

  `@oc-mui/ui` additionally types `buttonVariants` and `badgeVariants` explicitly
  and exports the aliases it uses (`ButtonVariant`, `ButtonSize`,
  `ButtonVariantProps`, `BadgeVariant`, `BadgeVariantProps`). The accepted values
  are unchanged; the inferred literal unions printed their members in
  machine-dependent order, which made the API report drift between local and CI
  runs.

- 421e712: GraphQL codegen reads a committed schema, and the emitted hook types survive every consumer.

  - The schema now lives in the repo (`src/schema.graphql`, taken from Opencast 20.0.0.SNAPSHOT) and codegen reads it — regenerating types needs no running backend. Refreshing the schema from a live instance is the separate, reviewed `schema:refresh` step, and `pnpm codegen:check` (CI + `pnpm verify`) regenerates and fails on any diff, so committed inputs and outputs can no longer drift apart.
  - The generated query/suspense hooks carry explicit return annotations. Without them, the emitted `.d.ts` referenced tanstack's `NoInfer` — which only some `@tanstack/react-query` minors export; where it doesn't resolve, `skipLibCheck` hid the error and every hook's `data` silently degraded to `any` for consumers. A consumer-perspective type check over `dist-types` (with `skipLibCheck: false`, plus a version-independent no-`NoInfer` guard) now runs in CI.
  - Refreshing the schema brought in the Playlist API that Opencast's current line gained (types and inputs only — no operations use it yet).

- a446b51: Download channel and tags are configurable: `app.channel` / `app.tags` select the publication channel and track tags the Episodes download action uses (defaults unchanged: `engage-player` / `engage-download`). The gallery view gains an `isPublic` access column, and `AclEditor` accepts an `i18nNamespace` so a plugin can translate the editor with its own namespace.
- 05c6477: Only submit metadata fields the organization's GraphQL input type accepts (#278, #280)

  Opencast derives `CommonEventMetadataInput` / `CommonSeriesMetadataInput` per
  organization from the catalog UI adapter config: a `readOnly=true` property is
  absent from the input type, and submitting it is a hard ValidationError. The
  committed codegen types are a one-server snapshot and can only ever be a
  superset, so saving metadata failed entirely on deployments whose catalog
  config trims a field (`location` on events, `creator` on series).

  - `@oc-mui/query` gains `useAcceptedInputFields(typeName)` — introspects the
    org's input type once per session (cached, fail-open when introspection is
    disabled) — and the pure `pickAcceptedFields(metadata, accepted)` filter.
  - The episodes and series edit forms no longer seed server-read-only fields
    into the update payload and filter the mutation input against the accepted
    set as a last line of defence.
  - The create-series dialog hides metadata fields the organization does not
    accept and filters its mutation input the same way.

- 5623ce4: Typed playlist operations. `@oc-mui/query` now ships generated hooks for the Opencast 20 playlist API: `useMuiGetMyPlaylistsQuery`, `useMuiGetPlaylistByIdQuery`, `useMuiCreatePlaylistMutation`, `useMuiUpdatePlaylistMetadataMutation`, `useMuiUpdatePlaylistEntriesMutation`, `useMuiUpdatePlaylistAclMutation` and `useMuiDeletePlaylistMutation`, plus the `MuiPlaylistData` / `MuiPlaylistEntryData` fragments and `PLAYLIST_SORTABLE_FIELDS`. The update mutations are split per concern because the backend applies `updatePlaylist` as a patch — a caller can change the entry order without touching the ACL, and vice versa. Against an Opencast 19 backend these operations fail with a "cannot query field" error; consumers must gate on backend support.
- b954e20: Videos view: soft-delete by default, admin-only permanent delete.

  The delete action in the Videos table now performs a **soft delete** — it calls the
  custom `mui.deleteEvent` mutation, which the backend routes through the configured
  trash workflow (move-to-trash series), hiding the event from regular users while
  keeping it recoverable. This is the intended recycle-bin behaviour, and it is what
  the release protocol's delete step actually asks for ("wird das Video in der
  Admin-ui in die Papierkorbserie gelegt. Für den User sieht es so aus, als wäre es
  wirklich gelöscht").

  A second, **admin-only "Delete permanently"** action is added alongside it. It
  calls the stock top-level `deleteEvent` mutation (`IndexService.removeEvent`),
  which removes the event from the search index for good, and it carries a
  distinct, explicitly "permanent and irreversible" confirmation dialog.

  - `@oc-mui/query`: add a `useDeleteEventPermanentlyMutation` hook for the stock
    top-level `deleteEvent`. Written out by hand rather than generated, following
    `useGetCurrentUser`: codegen introspects a live endpoint, so regenerating for
    one mutation would also import whatever else that backend exposes into the
    published types. Additive — `MuiDeleteEvent` keeps its existing soft
    `mui.deleteEvent` shape.
  - `@oc-mui/plugin-core-episodes`: dual-delete UI in `ActionsCell` (soft "Move to
    trash" for everyone; admin-only destructive "Delete permanently"), each with its
    own confirmation dialog and toast.
  - `@oc-mui/i18n`: new `episodes` keys (`action.moveToTrash`,
    `action.deletePermanently`, `trashDialogue.*`, `notification.trash*`).

  The admin gate authorizes against the granted `roles` array from
  `/info/me.json` and treats the organization's configured `org.adminRole` as
  equivalent to `ROLE_ADMIN` — the same rule `AppProtection` and the sidebar
  already use, so a deployment that renamed its admin role does not silently lose
  the action. No second roles source is introduced.

  Both dialogs render their body from an i18n **key** rather than a pre-rendered
  string, so the escaping of the user-controlled event title lives in one place.
  i18n runs with `escapeValue: false` globally, and with two dialogs sharing the
  component a caller passing ready-made HTML would be one forgotten `escapeValue`
  away from reopening the stored-XSS hole fixed in #266.

### Patch Changes

- c0e302b: Re-sync the committed GraphQL codegen output with its inputs. The generated file had drifted: the suspense hooks still carried pre-`Mui` operation names (`useSuspenseGetMyEventsQuery`) while their non-suspense siblings had already been updated, and `MuiUserFieldsFragment.__typename` claimed `'MuiUser'` although the fragment is declared `on User`. Regenerating changed 14 exported suspense hooks, their query keys, and that `__typename` — a correction of generated output, not an API decision. Patch rather than major: these names exist in no published release (the package has never been published), and nothing in the workspace imports a suspense hook.
- 85a910f: The config-slice boundary is mechanical now: the new `local/no-cross-plugin-config` rule flags any raw read of an AppConfig's `plugins` map (`useAppConfig().config.plugins[...]`, `config?.plugins?.[id]`), pointing at the `definePluginConfig` reader instead. The infrastructure that legitimately touches the raw map (the reader itself, the config-merge tests, route protection, the shell's loader and router provider) is enumerated as ignores next to the rule's wiring. The "no lint rule catches this yet, so reviews enforce it" comments across the workspace now name the rule.
- Dependency maintenance: the October minor/patch group (47 packages) — the Radix primitives, react-aria/react-stately, Tailwind 4.3, zod 4.6, graphql-request 7.4, Playwright 1.64, api-extractor 7.59, typescript-eslint 8.71 and the rest. No code changes.

  Three bumps from the group are deliberately not taken, each with the reason recorded next to the pin:

  - **React stays on 19.1** (`pnpm.overrides` + root dev dependencies so every peer resolves to the same copy). React ≥ 19.2 logs a console error for the theme `<script>` that `next-themes` 0.4.6 renders, and the E2E smoke test asserts zero console errors; upstream is unresolved (pacocoursey/next-themes #385/#387/#397). Lifted once the theme provider no longer renders a script.
  - **`@tanstack/router-devtools` stays on 1.125**, together with `react-router-devtools` and `router-devtools-core`: the devtools import `@tanstack/router-core` internals and only work with the router minor they shipped with; the newer versions broke Vite's pre-bundling and with it the dev server.
  - **`@types/node` is pinned to the workspace's `^25`** across the tree: optional `@types/node` peers otherwise resolve to the newest major in packages that declare none, which splits Vite into two type-incompatible instances.

- 3b40cfc: Documentation-only: correct package READMEs against the code (docs overhaul Phase 1).
- 0f076c1: Rename an org-named test fixture to a generic tenant name (pre-OSS hygiene; test behaviour unchanged).
- 8ec82fc: Correct code comments and docs that claimed a lint rule flags direct cross-slice config reads — no such rule exists yet; reviews enforce the config-slice rule today.
- ace0e1e: `definePluginConfig`: partial config slices now merge over the defaults instead of silently doing nothing

  Plugin schemas declare required fields, and `validateOrFallback` used to
  validate the **raw** `config.json` slice — so an operator who set a single
  key failed validation and got every default back, with only a console
  warning to show for it (#256). The reader now deep-merges the raw slice on
  top of the plugin's registered defaults before validating (objects merge,
  arrays replace — the same semantics as every other config layer), so a
  partial override behaves as an override. Invalid values still fall back to
  the full defaults with the same warning.

- 2044d7f: Move the `build:types` incremental state file (`tsconfig.build.tsbuildinfo`) into `dist-types/` so it lives and dies with the declaration output it describes. Previously the state file sat at the package root, outside the turbo `dist-types/**` cache outputs: a stale state file next to a deleted/partial `dist-types/` made `tsc` skip emission entirely, and turbo then cached the empty `dist-types/` — poisoning the (worktree-shared) build cache and breaking `check-types` repo-wide with `TS7016` errors on later "cache hit" runs (#258).
- Updated dependencies
- Updated dependencies [3b40cfc]
- Updated dependencies [31c19e7]
- Updated dependencies [3f02712]
- Updated dependencies [a446b51]
- Updated dependencies [9db8ada]
- Updated dependencies [3f6bf7d]
- Updated dependencies [2fbe7c9]
- Updated dependencies [a007934]
- Updated dependencies [a36e731]
- Updated dependencies [2044d7f]
- Updated dependencies [8b4dacf]
  - @oc-mui/plugin-system@1.2.0
  - @oc-mui/ui-config@2.0.0
  - @oc-mui/utils@1.2.0

## 1.1.0

### Minor Changes

- 8fef245: Move stateful shared libraries to `peerDependencies` so consumers resolve a single instance.

  Shipping libraries that keep module-level state as regular `dependencies` risks a
  consumer getting two copies (the classic React "invalid hook call" / broken-context
  duplicate-instance bug). These are now peers, provided by the host app:
  - `@oc-mui/query` → `@tanstack/react-query`
  - `@oc-mui/router` → `@tanstack/react-router` (and drops the unused
    `@tanstack/router-core` direct dependency)
  - `@oc-mui/store` → `jotai`, `zustand`
  - The four in-tree plugins (`admin-marketplace`, `core-episodes`, `core-series`,
    `core-upload`) move `react` from `dependencies` to `peerDependencies`
    (`^18 || ^19`) + a `devDependencies` entry, matching `plugins/core`.
  - `@oc-mui/ui`'s `react` peer is widened from `^19.1.0` to `^18.0.0 || ^19.0.0`
    to match its siblings.

  `immer` (store) and `@tanstack/react-query-devtools` (query) stay regular
  dependencies — they are used internally and don't carry the singleton hazard. The
  workspace resolves the new peers via pnpm's `auto-install-peers` (already the
  project default), so the app and dev/test loop are unaffected.

### Patch Changes

- dae5dc4: Remove verified dead code (pre-open-source cleanup).

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

- 1234904: Make `dist` the canonical published entry point so an `npm`-based publish can't ship broken packages.

  Previously each package's top-level `main`/`types`/`exports` pointed at `./src/*`,
  with the `dist`-pointing map only under `publishConfig`. That is only correct when
  the publish tool applies `publishConfig` (pnpm does; `npm publish`/`npm pack` do
  not) — so a plain `npm publish` (e.g. the first-publish bootstrap) would ship a
  tarball whose entry points resolve to `src/`, which isn't in the published `files`.

  Now the top-level `exports` are `dist`-canonical for consumers, and `publishConfig`
  is reduced to `{ "access": "public" }`. There is deliberately no `development`
  condition pointing at `src`: vite/vitest activate `development` by default, so a
  published map carrying it would send _consumers'_ tooling to a `src/` path that is
  not in the tarball (caught by the SDK publish smoke-test). Inside the monorepo the
  dev server resolves source via the shell's vite aliases, and tests resolve built
  `dist` (turbo orders `^build`/`^build:types` first). No public API changed; this is
  packaging metadata only.

  Note this fixes the _entry points_ only. `workspace:*` dependency specifiers are
  still rewritten to real ranges by `pnpm publish` (which `changeset publish` uses),
  not by plain `npm publish` — so the first-publish bootstrap must use `pnpm`, as
  documented in `.github/workflows/release.yml`.

- ed4a3d8: Declare `sideEffects` for tree-shaking, and add API-surface tracking to three more packages.
  - `sideEffects: false` on the pure packages (`utils`, `plugin-system`, `query`,
    `router`, `store`, `ui-config`, `app-runtime`, `plugin-testing`) so bundlers can
    drop unused exports. `@oc-mui/ui` uses `["**/*.css"]` (it ships `globals.css`).
    `@oc-mui/i18n` is intentionally left unset — its entry initialises i18next at
    import time, which is a real side effect.
  - `@oc-mui/app-runtime`, `@oc-mui/utils`, and `@oc-mui/plugin-testing` gain an
    `api-extractor.json` + `api-check`/`api-check:ci` scripts + a committed
    `etc/*.api.md`, so unintended public-API changes are caught in review (matching
    the six packages that already had this).

- Updated dependencies [4451b10]
- Updated dependencies [1234904]
- Updated dependencies [ca4f8f6]
- Updated dependencies [ed4a3d8]
  - @oc-mui/utils@1.1.0
  - @oc-mui/plugin-system@1.1.0
  - @oc-mui/ui-config@1.0.1
