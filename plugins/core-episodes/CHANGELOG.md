# @oc-mui/plugin-core-episodes

## 1.2.0

### Minor Changes

- 0ec637a: New extension point `episodes:table:status-indicators`: a plugin registers an `EpisodeStatusIndicator` (`matches`, `icon`, `tone`, `label`, optional `href`/`target`) and the episodes table shows it in place of the default status icon — in the list view's status column and as the gallery thumbnail overlay — for every row the indicator claims; with an `href` the icon and the thumbnail link to where the state is resolved (the editor, say). This is how a deployment surfaces states `eventStatus` does not carry, such as a processed event that still awaits publication. `@oc-mui/plugin-core` exports the type and the `EPISODE_STATUS_INDICATORS` key and now also documents the existing `episodes:table:actions` slot.

  The gallery thumbnail no longer links to an empty `href` when a processed event has no `publishUrl`.

- a446b51: Download channel and tags are configurable: `app.channel` / `app.tags` select the publication channel and track tags the Episodes download action uses (defaults unchanged: `engage-player` / `engage-download`). The gallery view gains an `isPublic` access column, and `AclEditor` accepts an `i18nNamespace` so a plugin can translate the editor with its own namespace.
- fb144d3: Series column labels work, and the gallery's combined cells become a configuration choice.

  - The per-column config semantics (order + default visibility, `label`/`labelKey` overrides) now live in `@oc-mui/ui` (`normalizeColumnConfigs`, `getColumnLabelOverrides`, `resolveColumnLabel`, `resolveColumnMeta`, `getColumnVisibilityDefaults`) and both tables use them. The series table previously declared `labelKey` in its schema but never consumed it — a silent config no-op; it now resolves labels exactly like the episodes table, including loading org-plugin namespaces (#372).
  - The episodes gallery's column pool now carries both presentations: the combined cells get stable config ids (`video`, `dateAndLocation` — they keep sorting by their primary content), a standalone `thumbnail` column arrives, and every single-value list column is available (hidden by default). One deployment keeps the combined look, another splits it into single columns, purely via `views.gallery.columns` (#373). **Config note:** gallery configs that addressed the combined cells as `title`/`startDate` must use `video`/`dateAndLocation` now.
  - The tables' persisted column-visibility store starts empty instead of seeding `{ title: true }` — the seed counted as a user choice and pinned the title column against the config defaults.

- 462e731: Table column config now sets defaults instead of removing columns (#80).

  A deployment's `columns` config used to _remove_ everything it didn't list with `show: true` — removed columns vanished from the View menu too, so a user could never bring them back ("Spalten ein-/ausblenden funktioniert nicht"). The config now orders the columns it names and sets their _default_ visibility (listed → their `show` flag, unlisted → hidden when a config exists); every column stays in the table and the View menu, and the user's own toggles win over the defaults and persist.

  The episodes table additionally loads the i18n namespaces of configured `labelKey`s, so a column label from an org plugin's namespace translates instead of showing the raw key ("labelkey funktioniert nur für core plugin").

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

- 85a910f: The config-slice boundary is mechanical now: the new `local/no-cross-plugin-config` rule flags any raw read of an AppConfig's `plugins` map (`useAppConfig().config.plugins[...]`, `config?.plugins?.[id]`), pointing at the `definePluginConfig` reader instead. The infrastructure that legitimately touches the raw map (the reader itself, the config-merge tests, route protection, the shell's loader and router provider) is enumerated as ignores next to the rule's wiring. The "no lint rule catches this yet, so reviews enforce it" comments across the workspace now name the rule.
- cf06651: The download action now says why it is unavailable instead of appearing disabled without explanation, and the visible download dropdown no longer opens an empty list when an event has no downloadable track.
- Dependency maintenance: the October minor/patch group (47 packages) — the Radix primitives, react-aria/react-stately, Tailwind 4.3, zod 4.6, graphql-request 7.4, Playwright 1.64, api-extractor 7.59, typescript-eslint 8.71 and the rest. No code changes.

  Three bumps from the group are deliberately not taken, each with the reason recorded next to the pin:

  - **React stays on 19.1** (`pnpm.overrides` + root dev dependencies so every peer resolves to the same copy). React ≥ 19.2 logs a console error for the theme `<script>` that `next-themes` 0.4.6 renders, and the E2E smoke test asserts zero console errors; upstream is unresolved (pacocoursey/next-themes #385/#387/#397). Lifted once the theme provider no longer renders a script.
  - **`@tanstack/router-devtools` stays on 1.125**, together with `react-router-devtools` and `router-devtools-core`: the devtools import `@tanstack/router-core` internals and only work with the router minor they shipped with; the newer versions broke Vite's pre-bundling and with it the dev server.
  - **`@types/node` is pinned to the workspace's `^25`** across the tree: optional `@types/node` peers otherwise resolve to the newest major in packages that declare none, which splits Vite into two type-incompatible instances.

- 3b40cfc: Documentation-only: correct package READMEs against the code (docs overhaul Phase 1).
- 31c19e7: fix(episodes): keep the file extension on downloaded tracks

  The download link handed the raw event title to the browser's `download`
  attribute. A title containing a dot (`Vorlesung 3.2 Einführung`) was read as
  already carrying an extension, so the file was saved without `.mp4` and
  Windows reported an unknown format.

  Adds `buildDownloadFileName` to `@oc-mui/utils`, which appends the real
  extension — taken from the track path, falling back to its MIME type — and
  strips characters Windows rejects in file names.

- 564d02f: Drop the lucide icon barrel from `@oc-mui/ui`'s public surface

  `@oc-mui/ui` re-exported 37 hand-picked lucide symbols, both from
  `@oc-mui/ui/components` and the `@oc-mui/ui/components/icons` subpath. They are
  gone; import them from `lucide-react` instead.

  **Migration:** replace the import source, nothing else.

  ```diff
  -import { Video, ExternalLink } from "@oc-mui/ui/components/icons";
  +import { Video, ExternalLink } from "lucide-react";
  ```

  Nothing changes at runtime. The host already registers the _complete_ lucide
  module in its shared-module map (`apps/shell/src/shared/sharedModules.ts`), and
  plugins mark `lucide-react` as external, so these imports resolve to the same
  host copy the barrel resolved to.

  Why remove it: 37 of ~1500 icons is an arbitrary subset that generates a
  request every time someone needs the 38th, `docs/plugins/styling.md` already
  prescribes importing `lucide-react` directly, and carrying two ways to do the
  same thing into the first npm publish would freeze both.

  `@oc-mui/ui`'s **own** icons — the hand-drawn SVGs in the `Icons` object — are
  unaffected and still exported.

  **Note on process:** a removal of this kind normally requires a `@deprecated`
  cycle in the previous major (see `docs/operations/release.md` → Deprecations).
  That step is deliberately skipped: nothing is published to npm yet, so there is
  no consumer a deprecation could warn. This is the last moment the removal is
  free — after the first publish it would cost a full major cycle.

- 45dc3ae: Translate the strings that stayed English (and one German) regardless of the selected language, and format dates in the active language.

  - `@oc-mui/i18n` gains `formatDate` / `activeDateLocale`. Six call sites built `new Intl.DateTimeFormat("de-DE", …)` themselves, so every date was German whatever the UI language was; they now share one helper that reads the active language and returns an empty string for unusable input instead of throwing inside a table cell.
  - `@oc-mui/i18n` also gains `setUserLanguage` / `getUserLanguage` / `applyConfiguredLanguage`. `app.locale` was declared in the config contract but nothing read it; it is now applied as the deployment's default language, with an explicit user choice remembered and taking precedence.
  - Filter reset, "More actions", the ACL editor's update button, login/logout, the series upload action, the sidebar metadata tab, the upload list's remove control and file size, and the series-picker placeholder now go through `t(...)`. New keys ship in both shipped locales.
  - The row-total counter in the data-table pagination bar was rendered only when there was nothing to count, which also left the page controls stranded at the left edge of the row.
  - The sidebar tab strip sized itself for exactly two tabs; the column count now follows the number of tabs actually rendered, so a second plugin-contributed tab no longer breaks the layout.

- 36b1289: Give the Videos table's icon-only buttons accessible names

  The layout toggle and both delete actions rendered bare icons — no
  aria-label, no sr-only text — so screen readers announced unnamed buttons
  (#254). The layout toggle now carries an sr-only label reflecting the
  TARGET state ("Switch to gallery view" / "Switch to list view", new keys
  in en+de), and both delete buttons reuse their existing tooltip labels as
  sr-only text. The E2E specs drop their icon-class selector workaround and
  locate the toggle by role and name — the same information a screen reader
  uses.

- 8ec82fc: Correct code comments and docs that claimed a lint rule flags direct cross-slice config reads — no such rule exists yet; reviews enforce the config-slice rule today.
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

- 3f6bf7d: Let a plugin supply the label for the sidebar tab it contributes.

  The host derived the visible caption from the registration key by string surgery (`acme:exam-recordings` → "Exam Recordings"), so it could never be translated and leaked the internal key naming into the UI. `registerComponent` now accepts an optional `label`: a translation key, following the same convention as `sidebar:nav-items` titles. The host resolves it at render time, so the caption follows a language switch, and it loads the key's namespace itself — the tab's own component may not have mounted yet.

  Additive and backwards compatible: registrations without a `label` keep the derived caption. The resolution ships in `@oc-mui/i18n` as `useExtensionLabels` (plus `deriveLabelFromKey`).

- 90dca3b: `PageShell` standardizes the content pages (#257): uniform page padding, the title in the same place and type scale on every page, optional description, an optional right-aligned actions slot, separator, content. Episodes, series, upload and the marketplace all render through it now — the marketplace loses its own padding/heading dialect (its view toggle moves into the actions slot), upload loses its accidental flex-wrap frame. The landing page deliberately stays out (marketing surface). Plugin apps should adopt `PageShell` so their pages sit flush with the core ones.
- 2fbe7c9: Hold React at `~19.2.0` (down from `^19.3.0`). React 19.3 makes the production
  build roughly four times slower on WebKit (Safari, iPad) — the browser matrix
  went from all-green in 2.4 min to 11 failed / 28 flaky in 10 min, bisected to
  the 19.3 bump alone. `react` and `react-dom` are pinned in every package and in
  the root `pnpm.overrides` so the workspace keeps resolving to a single copy;
  Dependabot ignores React minors until the hold is lifted (see
  `docs/reference/open-followups.md` §11). Peer ranges and public APIs are
  unchanged.
- a007934: React lifted from the 19.1 hold to `^19.3.0`. The `pnpm.overrides` pinning `react`, `react-dom`, `@types/react` and `@types/react-dom` to 19.1 are removed together with the Dependabot ignore for React minors; the workspace resolves to a single React copy without the workspace-root dev dependencies the hold had needed. Peer ranges (`^18.0.0 || ^19.0.0`) are unchanged. API reports regenerated: `@types/react` 19.3 spells JSX return types as `React.JSX.Element`, a rendering change only.
- 49dcb64: A failed metadata save is no longer silent

  The edit sidebar closed unconditionally right after firing the update
  mutation: on failure there was no error toast, the edits were dropped, and
  the only difference to a successful save was the missing success toast
  (#287). The sidebar now closes only on success; failures show the existing
  `changesFailed` toast and keep the panel open with the edits intact, so a
  retry saves the same change. The Save button is disabled while the
  mutation is in flight.

- ac86dd6: The semantic-token theme rule is now lint-enforced, and the codebase is swept clean

  New `local/no-palette-classes` ESLint rule (#297): Tailwind raw palette
  color classes (`text-gray-900`, `bg-amber-50`, `focus:ring-indigo-600`, …)
  are forbidden — they ignore the theme tokens, which is exactly how #279
  (unreadable dark-mode inputs) happened. The rule scans all string and
  template literals, so class strings in plain `.ts` style maps are covered
  too; the shadcn layer keeps its existing lint exemption.

  The sweep replaced ~70 palette usages across the table styles, the
  marketplace's amber/emerald status colors (→ `warning`/`ok` tokens, whose
  theme stability also removes the hand-written `dark:` duplicates), both
  table plugins and the language switcher. Three table row-color variants
  that are NAMED after fixed colors (`purple`, `dark`, `black`) keep their
  values under a reasoned eslint-disable — no semantic equivalent exists and
  removing them would break the exported variant type.

- 5ec9a9e: Both Videos views show the same three direct actions

  The list view showed four direct actions (incl. Download) while the
  gallery showed three, hiding Download and Delete behind the overflow menu
  (#42). The list now matches the gallery: edit-data, edit-video and play
  stay direct; Download and the delete actions live in the "More actions"
  menu in both views.

- Updated dependencies [ff5eb70]
- Updated dependencies [ec52929]
- Updated dependencies [8bf09b0]
- Updated dependencies [c0e302b]
- Updated dependencies [b135497]
- Updated dependencies [421e712]
- Updated dependencies [85a910f]
- Updated dependencies [1f6b671]
- Updated dependencies [cf06651]
- Updated dependencies
- Updated dependencies [3b40cfc]
- Updated dependencies [31c19e7]
- Updated dependencies [3f02712]
- Updated dependencies [564d02f]
- Updated dependencies [0ec637a]
- Updated dependencies [a446b51]
- Updated dependencies [c4ae3f9]
- Updated dependencies [fb144d3]
- Updated dependencies [45dc3ae]
- Updated dependencies [4ae141b]
- Updated dependencies [36b1289]
- Updated dependencies [3e20b75]
- Updated dependencies [0f076c1]
- Updated dependencies [a5c54f6]
- Updated dependencies [8ec82fc]
- Updated dependencies [9db8ada]
- Updated dependencies [05c6477]
- Updated dependencies [dc9ca73]
- Updated dependencies [3f6bf7d]
- Updated dependencies [50c7f05]
- Updated dependencies [90dca3b]
- Updated dependencies [ace0e1e]
- Updated dependencies [2a5bcac]
- Updated dependencies [9526e3f]
- Updated dependencies [57a7d88]
- Updated dependencies [5623ce4]
- Updated dependencies [2fbe7c9]
- Updated dependencies [a007934]
- Updated dependencies [a36e731]
- Updated dependencies [86d633c]
- Updated dependencies [2251f74]
- Updated dependencies [ac86dd6]
- Updated dependencies [b954e20]
- Updated dependencies [2044d7f]
- Updated dependencies [8b4dacf]
- Updated dependencies [a16ad96]
- Updated dependencies [576a3cb]
- Updated dependencies [c69f95b]
- Updated dependencies [0546654]
  - @oc-mui/ui@2.0.0
  - @oc-mui/query@2.0.0
  - @oc-mui/i18n@1.1.0
  - @oc-mui/plugin-core@1.1.0
  - @oc-mui/plugin-system@1.2.0
  - @oc-mui/router@1.1.1
  - @oc-mui/store@1.1.1
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

- b87d5b3: Fix a stored XSS in the episode delete-confirmation dialog. The dialog renders a
  translated string as HTML (for its static `<strong>` emphasis) and interpolated
  the user-controlled event title into it unescaped, because i18n runs with
  `escapeValue: false` globally. A crafted event title (e.g. containing an `<img
onerror=…>`) would execute in the session of any user opening the delete dialog.
  The title is now escaped for this interpolation while the trusted static markup
  is preserved.
- Updated dependencies [4451b10]
- Updated dependencies [dae5dc4]
- Updated dependencies [1234904]
- Updated dependencies [ca4f8f6]
- Updated dependencies [41d22f6]
- Updated dependencies [8fef245]
- Updated dependencies [39c4b67]
- Updated dependencies [ed4a3d8]
- Updated dependencies [2de0b14]
  - @oc-mui/utils@1.1.0
  - @oc-mui/query@1.1.0
  - @oc-mui/i18n@1.0.1
  - @oc-mui/plugin-system@1.1.0
  - @oc-mui/router@1.1.0
  - @oc-mui/store@1.1.0
  - @oc-mui/ui@1.1.0
  - @oc-mui/ui-config@1.0.1
