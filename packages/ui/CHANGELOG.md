# @oc-mui/ui

## 2.0.0

### Major Changes

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

### Minor Changes

- ff5eb70: Fix `AclEditor` rendering raw translation keys, and stop requiring props it doesn't need.

  **The bug.** Every label in the component comes from the `muitable-sidebar`
  namespace, but it bound `useI18n()` to the _default_ namespace and merely
  side-loaded the bundle from an effect. Not being subscribed, react-i18next had
  no reason to re-render it once the bundle arrived, so the first time the editor
  opened in a context that hadn't already loaded that namespace it showed bare
  keys — `accessPolicy`, `accessList`, `addUser`, `noEntries`, `noPolicy` —
  instead of text. It now subscribes with `useI18n("muitable-sidebar")`, which
  both loads the namespace and re-renders when it is ready; the manual
  `loadNamespace` effect is gone.

  **The props.** `hasChanges`, `refetch` and `onHasChangesChange` were required
  but only serve the "edit an existing entity, then press Update" flow. Callers
  that collect an ACL for something which does not exist yet — an upload, for
  instance — had to pass no-ops for all three. They are now optional with the
  defaults the component already applied internally. Existing callers are
  unaffected: this only relaxes the signature.

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

- a446b51: Download channel and tags are configurable: `app.channel` / `app.tags` select the publication channel and track tags the Episodes download action uses (defaults unchanged: `engage-player` / `engage-download`). The gallery view gains an `isPublic` access column, and `AclEditor` accepts an `i18nNamespace` so a plugin can translate the editor with its own namespace.
- fb144d3: Series column labels work, and the gallery's combined cells become a configuration choice.

  - The per-column config semantics (order + default visibility, `label`/`labelKey` overrides) now live in `@oc-mui/ui` (`normalizeColumnConfigs`, `getColumnLabelOverrides`, `resolveColumnLabel`, `resolveColumnMeta`, `getColumnVisibilityDefaults`) and both tables use them. The series table previously declared `labelKey` in its schema but never consumed it — a silent config no-op; it now resolves labels exactly like the episodes table, including loading org-plugin namespaces (#372).
  - The episodes gallery's column pool now carries both presentations: the combined cells get stable config ids (`video`, `dateAndLocation` — they keep sorting by their primary content), a standalone `thumbnail` column arrives, and every single-value list column is available (hidden by default). One deployment keeps the combined look, another splits it into single columns, purely via `views.gallery.columns` (#373). **Config note:** gallery configs that addressed the combined cells as `title`/`startDate` must use `video`/`dateAndLocation` now.
  - The tables' persisted column-visibility store starts empty instead of seeding `{ title: true }` — the seed counted as a user choice and pinned the title column against the config defaults.

- 90dca3b: `PageShell` standardizes the content pages (#257): uniform page padding, the title in the same place and type scale on every page, optional description, an optional right-aligned actions slot, separator, content. Episodes, series, upload and the marketplace all render through it now — the marketplace loses its own padding/heading dialect (its view toggle moves into the actions slot), upload loses its accidental flex-wrap frame. The landing page deliberately stays out (marketing surface). Plugin apps should adopt `PageShell` so their pages sit flush with the core ones.
- 9526e3f: Make the `plugins` cascade layer actually take effect, and place it where it is safe: between Tailwind's `base` and `utilities` (Theme Contract 2.1).

  Two defects, one visible symptom (a remote plugin's landing page rendered without vertical padding, margins or heading size on deployments whose host build never generated those classes):

  - `@oc-mui/ui/postcss.config` loaded `@tailwindcss/postcss` pinned to a 2024 alpha (`0.0.0-oxide.4`). Vite picked that config up automatically, so the alpha ran in addition to `@tailwindcss/vite` and rewrote the compiled `@layer` statement, hoisting `plugins` below `base` — Tailwind's preflight reset then overrode every plugin utility. The alpha dependency is removed, the shell and playground ship no PostCSS config, and `@oc-mui/ui/postcss.config` stays as a deprecated empty config for one major cycle.
  - The declared order (`plugins` after `utilities`) was never in effect and is unsafe: a plugin ships a complete Tailwind sheet, and its plain `.hidden` would beat the host's `md:block` on the sidebar wrapper. The new order `theme, base, plugins, components, utilities` lets plugin utilities beat preflight while host utilities keep precedence on class-name collisions; a plugin escalates its own responsive variants with Tailwind's `!` modifier. Documented in `docs/extend/styling.md`; the loader's comment follows.

- 86d633c: `Switch` is a first-class `@oc-mui/ui` primitive; the `@headlessui/react` pass-through is gone.

  The package shipped a second complete UI library for exactly one aliased export (`SwitchHeadlessUI`). A radix-based `Switch` now lives next to the other primitives, styled with the semantic tokens, and `@headlessui/react` leaves the dependencies. Removing `SwitchHeadlessUI` is a pre-npm public-surface removal (#277's window): consumers switch to `Switch` — its org-plugin consumer is migrated in the plugins repo counterpart.

- 2251f74: `ThemeModeProvider` no longer wraps `next-themes`; `@oc-mui/ui` ships its own light/dark/system provider and the `next-themes` dependency is gone.

  Observable behaviour is unchanged: a `.dark`/`.light` class and the matching `color-scheme` on `<html>`, default `system` that follows the OS preference reactively, the user's choice persisted in `localStorage` under the same key (`theme`) so existing users keep their setting, cross-tab sync, and transitions suppressed while the tokens swap. What changed is that no `<script>` is rendered inside the React tree — React ≥ 19.2 logs "Encountered a script tag while rendering React component" for that, which is what had been holding React at 19.1. The class is applied in a layout effect (before the first React frame paints); the shell's `index.html` additionally applies it before React mounts, so there is no light flash on first paint.

  New public export from `@oc-mui/ui/components`: `useThemeMode()` returning `{ theme, resolvedTheme, systemTheme, setTheme }` (plus the `ThemeMode`, `ResolvedThemeMode`, `ThemeModeContextValue` types and the `THEME_MODE_STORAGE_KEY` constant). It is safe to call without a provider. The `Toaster` wrapper now reads the appearance from it.

- a16ad96: `@oc-mui/ui/components` is the plugin SDK surface now — the host's assembly layer moved to a new `@oc-mui/ui/internal` entry.

  Moved out of `components`: `Appshell`, the router primitives (`UiRouterProvider`, `UiRouterPrimitives`, `useUiRouter`), `DefaultLandingPage`, the error pages (`ErrorPage`, `ErrorBoundary`, `NotFoundError`, `ForbiddenError`, `GeneralError`, `MaintenanceError`, `UnauthorizedError`) and `ThemeModeProvider`. Nothing a plugin uses changed: `NavMain`, `ThemeModeToggle`, `AppLoader`/`Loading` and every primitive stay in `components`. The internal entry carries no API report, is not shared with remote-loaded plugins, and `@oc-mui/eslint-config` now forbids importing it from `plugins/` and `.local-plugins/` (the shared restricted-import patterns are hoisted so the plugin-scoped rule extends rather than replaces them). `@oc-mui/app-runtime` and `@oc-mui/providers` import `ErrorBoundary` from the new entry instead of a deep path.

  Done before the first npm publish so the published surface is the one we intend to keep: 240 → 226 exports, every remaining one either used by a plugin today or a generic primitive.

- c69f95b: `SortableList` — a vertically sortable list for `@oc-mui/ui`. Pointer drag via a handle the list renders for every row, full keyboard reordering (space to pick up, arrow keys to move, space to drop, escape to cancel) and screen-reader announcements for each step, built on `@dnd-kit`. It is controlled: `items` is the order, `onReorder` hands back the next one together with the move, so the consumer decides whether a move saves immediately or is staged. `moveItem` is the matching pure helper for "move up / move down" menus. The handle label, instructions and announcements come from new `sortableList.*` keys in the shared `common` namespace of `@oc-mui/i18n` (en, de).

### Patch Changes

- ec52929: fix(ui): state the AclEditor's read-permission rule and fix its column widths

  The read checkbox was hardcoded `disabled` while still wired to a change
  handler that could never fire, leaving it unclear whether read was meant to be
  unremovable or the `disabled={disabled}` of the write column had been
  forgotten. It is deliberate: a new entry is created with `["read"]` and access
  is revoked by deleting the row, so being listed _is_ read access. The dead
  handler is gone and the checkbox now carries a label saying so.

  Also adds a floor: an entry can no longer end up granting nothing. Read
  normally holds it, but a backend-supplied entry can carry write without read,
  where unchecking write produced `action: []` — a row that reads as access in
  the list while granting none. Such an entry is rendered as it arrives; read is
  deliberately not added on load, which would be an unrequested permission change
  written back on the next save.

  The table's column widths declared `w-1/2 + w-1/4 + w-1/4 + w-1/3` = 133%.
  `table-fixed` normalised that proportionally, so the rendered columns never
  matched the written ones. Now `w-1/2 + 3 × w-1/6` = 100%.

- 8bf09b0: The main navigation resolves plugin-registered titles through `useExtensionLabels` instead of its own inline `i18n.exists ? t : raw` copy. One visible improvement: the resolver loads a title's namespace itself, so an org plugin's nav item no longer shows its raw translation key until some component of that plugin happens to mount. A title whose key is genuinely missing now falls back to a caption derived from the key ("common:some-entry" → "Some Entry") instead of the raw key.
- 1f6b671: Metadata edit fields are readable in dark mode

  The edit inputs in the metadata sidebar (`MetadataUpdateField`) carried
  hardcoded palette classes — `text-gray-900`, gray borders/rings, indigo
  focus — so in dark mode the edited value rendered near-black on a dark
  background (#279). The overrides are removed; the fields now inherit the
  base Input/Textarea semantic-token styling (which the theme rule mandates
  anyway), and the separator hint uses `text-muted-foreground`. Verified by
  a new E2E spec that measures the computed text color of the edit input in
  dark mode.

- Dependency maintenance: the October minor/patch group (47 packages) — the Radix primitives, react-aria/react-stately, Tailwind 4.3, zod 4.6, graphql-request 7.4, Playwright 1.64, api-extractor 7.59, typescript-eslint 8.71 and the rest. No code changes.

  Three bumps from the group are deliberately not taken, each with the reason recorded next to the pin:

  - **React stays on 19.1** (`pnpm.overrides` + root dev dependencies so every peer resolves to the same copy). React ≥ 19.2 logs a console error for the theme `<script>` that `next-themes` 0.4.6 renders, and the E2E smoke test asserts zero console errors; upstream is unresolved (pacocoursey/next-themes #385/#387/#397). Lifted once the theme provider no longer renders a script.
  - **`@tanstack/router-devtools` stays on 1.125**, together with `react-router-devtools` and `router-devtools-core`: the devtools import `@tanstack/router-core` internals and only work with the router minor they shipped with; the newer versions broke Vite's pre-bundling and with it the dev server.
  - **`@types/node` is pinned to the workspace's `^25`** across the tree: optional `@types/node` peers otherwise resolve to the newest major in packages that declare none, which splits Vite into two type-incompatible instances.

- 3b40cfc: Documentation-only: correct package READMEs against the code (docs overhaul Phase 1).
- 45dc3ae: Translate the strings that stayed English (and one German) regardless of the selected language, and format dates in the active language.

  - `@oc-mui/i18n` gains `formatDate` / `activeDateLocale`. Six call sites built `new Intl.DateTimeFormat("de-DE", …)` themselves, so every date was German whatever the UI language was; they now share one helper that reads the active language and returns an empty string for unusable input instead of throwing inside a table cell.
  - `@oc-mui/i18n` also gains `setUserLanguage` / `getUserLanguage` / `applyConfiguredLanguage`. `app.locale` was declared in the config contract but nothing read it; it is now applied as the deployment's default language, with an explicit user choice remembered and taking precedence.
  - Filter reset, "More actions", the ACL editor's update button, login/logout, the series upload action, the sidebar metadata tab, the upload list's remove control and file size, and the series-picker placeholder now go through `t(...)`. New keys ship in both shipped locales.
  - The row-total counter in the data-table pagination bar was rendered only when there was nothing to count, which also left the page controls stranded at the left edge of the row.
  - The sidebar tab strip sized itself for exactly two tabs; the column count now follows the number of tabs actually rendered, so a second plugin-contributed tab no longer breaks the layout.

- 3e20b75: `DefaultLandingPage`: point the documentation links at the rebuilt docs site. The
  "get started", installation, configuration and plugin-authoring links pointed at
  site routes that no longer exist (`/getting-started/*`, `/plugins/*`) and now
  resolve to `/what-is-management-ui`, `/operate/install`, `/operate/configure`
  and `/extend/first-plugin`.
- a5c54f6: The wrapper rule now covers drag-and-drop: `@dnd-kit/*` may only be imported by `@oc-mui/ui` itself, everyone else uses `SortableList` from `@oc-mui/ui/components`. Without the rule a plugin could import the library directly and ship its own copy; with it the facade can swap the implementation later without breaking plugins — the same contract `@oc-mui/router`, `@oc-mui/query`, `@oc-mui/i18n` and `@oc-mui/store` already give. `packages/ui` carries the matching self-exemption.
- dc9ca73: `MetadataField` and `MetadataUpdateField` no longer crash when a list-backed metadata field arrives without its `collection`. The GraphQL schema types `collection` as nullable, but both components read it unguarded (`Object.keys` / `Object.values`), so a backend that omits the option list took down the whole episodes info panel with "Module Error". The read-only field now falls back to the raw value, the editable one to its existing "no options" branch.
- 50c7f05: `OverflowTooltip` no longer underlines every cell when an org theme swaps in a corporate font.

  The vertical-overflow check compared `clientHeight < scrollHeight` exactly. A font whose ascenders and descenders are taller than the line box makes those differ by a pixel or two on a single line that visibly fits — so in a `truncate` (nowrap) column, _every_ cell got the dotted "content is cut off" underline as soon as a theme like univie's applied its self-hosted fonts. The check now requires the difference to exceed a few pixels, which only a genuinely clamped line does.

  It also re-measures on `ResizeObserver` in addition to `document.fonts.ready`. `fonts.ready` settles once, covering the fonts pending at that moment; a plugin theme loaded at runtime registers its `@font-face` rules afterwards, so its font swap never re-triggered a measurement. The observer also covers column resizes and zoom changes.

- 2a5bcac: Plugin CSS now loads into a dedicated `plugins` cascade layer so a plugin's own utilities win on its own DOM.

  Previously the loader inserted each plugin's stylesheet **before** the host shell stylesheets "so host utilities keep precedence". The side effect: a host base utility (e.g. `.text-4xl`) loaded _after_ the plugin would override the plugin's own responsive utility (e.g. `.sm:text-6xl`) on the plugin's element — a normal `text-4xl sm:text-6xl` heading rendered at the smaller size on desktop.

  Now `@oc-mui/ui`'s `globals.css` declares `@layer theme, base, components, utilities, plugins;`, and `@oc-mui/remote-plugin-loader` loads each plugin's CSS into `@layer plugins` (via a `<style>` with `@import … layer()`, since the `<link layer>` attribute isn't shipped in browsers yet). Because `plugins` sits after `utilities`, plugin utilities win on plugin-owned DOM regardless of load order, while every plugin still ships into one predictable layer so it can't reorder host chrome. No plugin change is required; per-plugin `@layer plugin-overrides` workarounds for this are no longer needed.

  **Superseded before release:** the `plugins` layer now sits _between_ `base` and `utilities` (`theme, base, plugins, components, utilities`), and the guarantee "plugin utilities win on plugin-owned DOM" is withdrawn — see the Theme Contract 2.1 entry in the same release.

- 57a7d88: Locale files describe the UI that exists (#341), and a dead tsconfig is gone (#326).

  Deleted the translation keys with no renderer: the never-shown upload-completion dialog, `upload:access`/`noSeries`/`uploadButton.completed` and the unreachable `upload:noSeriesAvailable` block, the series Studio/Playlist/Episodes action labels (trivially recreated when #108/#109 build those features), the duplicate `muitable-sidebar` tab-label pair, and the footer's Support/Imprint/Privacy labels (`core-footer:help` stays — an org plugin's footer reuses it). Wired the one string that should have been showing: the series empty state's explanatory paragraph (`series:noSeriesAvailable.text`) now renders under the title in both empty states. Also removed `packages/ui/src/components/ui/tsconfig.json` — compiler relaxations consumed by no build, lint, or editor path; the package's stricter tsconfig already checks those files and passes.

- 2fbe7c9: Hold React at `~19.2.0` (down from `^19.3.0`). React 19.3 makes the production
  build roughly four times slower on WebKit (Safari, iPad) — the browser matrix
  went from all-green in 2.4 min to 11 failed / 28 flaky in 10 min, bisected to
  the 19.3 bump alone. `react` and `react-dom` are pinned in every package and in
  the root `pnpm.overrides` so the workspace keeps resolving to a single copy;
  Dependabot ignores React minors until the hold is lifted (see
  `docs/reference/open-followups.md` §11). Peer ranges and public APIs are
  unchanged.
- a007934: React lifted from the 19.1 hold to `^19.3.0`. The `pnpm.overrides` pinning `react`, `react-dom`, `@types/react` and `@types/react-dom` to 19.1 are removed together with the Dependabot ignore for React minors; the workspace resolves to a single React copy without the workspace-root dev dependencies the hold had needed. Peer ranges (`^18.0.0 || ^19.0.0`) are unchanged. API reports regenerated: `@types/react` 19.3 spells JSX return types as `React.JSX.Element`, a rendering change only.
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

- 2044d7f: Move the `build:types` incremental state file (`tsconfig.build.tsbuildinfo`) into `dist-types/` so it lives and dies with the declaration output it describes. Previously the state file sat at the package root, outside the turbo `dist-types/**` cache outputs: a stale state file next to a deleted/partial `dist-types/` made `tsc` skip emission entirely, and turbo then cached the empty `dist-types/` — poisoning the (worktree-shared) build cache and breaking `check-types` repo-wide with `TS7016` errors on later "cache hit" runs (#258).
- 576a3cb: Rewrite the 37 self-imports (`@oc-mui/ui/...` → relative paths) so the package no longer depends on its own resolution. The `@oc-mui/ui/*` tsconfig alias, the vitest resolve alias, the tsup self-name externalisation and the `tsconfig.api-extractor.json` workaround are all gone; a regression test keeps the imports relative. API Extractor now also covers the `./hooks` entry point (`etc/ui-hooks.api.md`).
- 0546654: fix(ui): let the column menu close while the pointer is inside it

  `DataTableViewOptions` was a controlled dropdown whose `onOpenChange` was
  ignored entirely while a `preventEditClose` flag was set — and that flag was
  set on the content's `onMouseEnter`/`onClick` and only cleared on
  `onMouseLeave`. As long as the pointer rested inside the menu, no close signal
  was honoured: neither Esc nor an outside click, while the Radix overlay kept
  swallowing every click on the rest of the page.

  The menu is now uncontrolled, so Radix handles Esc and outside clicks itself.
  Staying open across column toggles — the behaviour the workaround was after —
  is expressed per item via `onSelect={(event) => event.preventDefault()}`.

- Updated dependencies [c0e302b]
- Updated dependencies [b135497]
- Updated dependencies [421e712]
- Updated dependencies [85a910f]
- Updated dependencies [cf06651]
- Updated dependencies
- Updated dependencies [3b40cfc]
- Updated dependencies [31c19e7]
- Updated dependencies [3f02712]
- Updated dependencies [a446b51]
- Updated dependencies [45dc3ae]
- Updated dependencies [4ae141b]
- Updated dependencies [36b1289]
- Updated dependencies [0f076c1]
- Updated dependencies [8ec82fc]
- Updated dependencies [9db8ada]
- Updated dependencies [05c6477]
- Updated dependencies [3f6bf7d]
- Updated dependencies [ace0e1e]
- Updated dependencies [57a7d88]
- Updated dependencies [5623ce4]
- Updated dependencies [2fbe7c9]
- Updated dependencies [a007934]
- Updated dependencies [a36e731]
- Updated dependencies [ac86dd6]
- Updated dependencies [b954e20]
- Updated dependencies [2044d7f]
- Updated dependencies [8b4dacf]
- Updated dependencies [c69f95b]
  - @oc-mui/query@2.0.0
  - @oc-mui/i18n@1.1.0
  - @oc-mui/plugin-system@1.2.0
  - @oc-mui/ui-config@2.0.0
  - @oc-mui/utils@1.2.0

## 1.1.0

### Minor Changes

- ca4f8f6: Restrict the plugin marketplace to administrators and gate developer URL loading.

  The marketplace loads and executes third-party code at runtime, so it is now
  admin-only:
  - `AppDefinition.requiredRoles` (plugin-system) and `AppProtectionConfig.requiredRoles`
    (router) let an app declare the roles allowed to open its route. `AppProtection`
    enforces them against the user's _granted_ roles (the `roles` array from Opencast's
    `/info/me.json`) — not the per-user `ROLE_USER_<username>` identity role — and shows
    an access-denied screen to authenticated users who lack the role. A deployment can
    override an app's roles via `config.plugins[<id>].protection.requiredRoles` (e.g. a
    non-default admin role).
  - The app sidebar (ui) hides nav entries whose `requiredRoles` the current user does
    not hold, so role-gated routes no longer surface a dead link.
  - The admin marketplace declares `requiredRoles: ["ROLE_ADMIN"]` (Opencast's default
    admin role) on its routes and nav item, and its developer "load from URL" flow now
    requires an explicit per-visit risk acknowledgement before it will run untrusted code.

### Patch Changes

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

- 41d22f6: Fix `OverflowTooltip` permanently latching the dotted "truncated" underline when a web font loads after first paint.

  The first overflow measurement runs synchronously in the element's `ref` callback on mount, which can happen while a fallback font is still in place — web fonts load asynchronously. The fallback's metrics differ, so a clamped multi-line cell (e.g. the episodes table's `contributors`/`presenters` columns) can momentarily report a vertical overflow it does not actually have once the real font swaps in. The previous logic only ever set the `overflowingVertical`/`needsTooltip` flags to `true`, so that false positive latched the underline on permanently and nothing ever cleared it.

  `OverflowTooltip` now re-asserts both flags on every measurement (so a later, correct measurement can clear a false positive) and re-measures once `document.fonts.ready` resolves. This removes the intermittent "every cell is underlined" rendering that showed up when an organization ships custom self-hosted fonts.

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

- 2de0b14: The data table's empty-state cell now sets `whitespace-normal`, so plugin-provided empty states wrap normally instead of inheriting the cell's `whitespace-nowrap` and rendering as a single overflowing line.
- Updated dependencies [4451b10]
- Updated dependencies [dae5dc4]
- Updated dependencies [1234904]
- Updated dependencies [ca4f8f6]
- Updated dependencies [8fef245]
- Updated dependencies [ed4a3d8]
  - @oc-mui/utils@1.1.0
  - @oc-mui/query@1.1.0
  - @oc-mui/i18n@1.0.1
  - @oc-mui/plugin-system@1.1.0
  - @oc-mui/ui-config@1.0.1
