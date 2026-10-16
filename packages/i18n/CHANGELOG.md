# @oc-mui/i18n

## 1.1.0

### Minor Changes

- 45dc3ae: Translate the strings that stayed English (and one German) regardless of the selected language, and format dates in the active language.

  - `@oc-mui/i18n` gains `formatDate` / `activeDateLocale`. Six call sites built `new Intl.DateTimeFormat("de-DE", …)` themselves, so every date was German whatever the UI language was; they now share one helper that reads the active language and returns an empty string for unusable input instead of throwing inside a table cell.
  - `@oc-mui/i18n` also gains `setUserLanguage` / `getUserLanguage` / `applyConfiguredLanguage`. `app.locale` was declared in the config contract but nothing read it; it is now applied as the deployment's default language, with an explicit user choice remembered and taking precedence.
  - Filter reset, "More actions", the ACL editor's update button, login/logout, the series upload action, the sidebar metadata tab, the upload list's remove control and file size, and the series-picker placeholder now go through `t(...)`. New keys ship in both shipped locales.
  - The row-total counter in the data-table pagination bar was rendered only when there was nothing to count, which also left the page controls stranded at the left edge of the row.
  - The sidebar tab strip sized itself for exactly two tabs; the column count now follows the number of tabs actually rendered, so a second plugin-contributed tab no longer breaks the layout.

- 3f6bf7d: Let a plugin supply the label for the sidebar tab it contributes.

  The host derived the visible caption from the registration key by string surgery (`acme:exam-recordings` → "Exam Recordings"), so it could never be translated and leaked the internal key naming into the UI. `registerComponent` now accepts an optional `label`: a translation key, following the same convention as `sidebar:nav-items` titles. The host resolves it at render time, so the caption follows a language switch, and it loads the key's namespace itself — the tab's own component may not have mounted yet.

  Additive and backwards compatible: registrations without a `label` keep the derived caption. The resolution ships in `@oc-mui/i18n` as `useExtensionLabels` (plus `deriveLabelFromKey`).

- c69f95b: `SortableList` — a vertically sortable list for `@oc-mui/ui`. Pointer drag via a handle the list renders for every row, full keyboard reordering (space to pick up, arrow keys to move, space to drop, escape to cancel) and screen-reader announcements for each step, built on `@dnd-kit`. It is controlled: `items` is the order, `onReorder` hands back the next one together with the move, so the consumer decides whether a move saves immediately or is staged. `moveItem` is the matching pure helper for "move up / move down" menus. The handle label, instructions and announcements come from new `sortableList.*` keys in the shared `common` namespace of `@oc-mui/i18n` (en, de).

### Patch Changes

- cf06651: The download action now says why it is unavailable instead of appearing disabled without explanation, and the visible download dropdown no longer opens an empty list when an event has no downloadable track.
- Dependency maintenance: the October minor/patch group (47 packages) — the Radix primitives, react-aria/react-stately, Tailwind 4.3, zod 4.6, graphql-request 7.4, Playwright 1.64, api-extractor 7.59, typescript-eslint 8.71 and the rest. No code changes.

  Three bumps from the group are deliberately not taken, each with the reason recorded next to the pin:

  - **React stays on 19.1** (`pnpm.overrides` + root dev dependencies so every peer resolves to the same copy). React ≥ 19.2 logs a console error for the theme `<script>` that `next-themes` 0.4.6 renders, and the E2E smoke test asserts zero console errors; upstream is unresolved (pacocoursey/next-themes #385/#387/#397). Lifted once the theme provider no longer renders a script.
  - **`@tanstack/router-devtools` stays on 1.125**, together with `react-router-devtools` and `router-devtools-core`: the devtools import `@tanstack/router-core` internals and only work with the router minor they shipped with; the newer versions broke Vite's pre-bundling and with it the dev server.
  - **`@types/node` is pinned to the workspace's `^25`** across the tree: optional `@types/node` peers otherwise resolve to the newest major in packages that declare none, which splits Vite into two type-incompatible instances.

- 3b40cfc: Documentation-only: correct package READMEs against the code (docs overhaul Phase 1).
- 4ae141b: `useExtensionLabels` re-resolves its labels once the requested namespaces have loaded. The hook only re-rendered on a language switch, so a host surface that renders before the plugin's own component mounts — the sidebar — kept showing the derived fallback (or a raw key such as `Playlists.Nav`) until the user navigated or changed the language.
- 36b1289: Give the Videos table's icon-only buttons accessible names

  The layout toggle and both delete actions rendered bare icons — no
  aria-label, no sr-only text — so screen readers announced unnamed buttons
  (#254). The layout toggle now carries an sr-only label reflecting the
  TARGET state ("Switch to gallery view" / "Switch to list view", new keys
  in en+de), and both delete buttons reuse their existing tooltip labels as
  sr-only text. The E2E specs drop their icon-class selector workaround and
  locate the toggle by role and name — the same information a screen reader
  uses.

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

- 2044d7f: Move the `build:types` incremental state file (`tsconfig.build.tsbuildinfo`) into `dist-types/` so it lives and dies with the declaration output it describes. Previously the state file sat at the package root, outside the turbo `dist-types/**` cache outputs: a stale state file next to a deleted/partial `dist-types/` made `tsc` skip emission entirely, and turbo then cached the empty `dist-types/` — poisoning the (worktree-shared) build cache and breaking `check-types` repo-wide with `TS7016` errors on later "cache hit" runs (#258).

## 1.0.1

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
