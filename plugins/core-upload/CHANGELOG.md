# @oc-mui/plugin-core-upload

## 1.1.2

### Patch Changes

- Updated dependencies [bbbdf68]
  - @oc-mui/query@2.0.1
  - @oc-mui/i18n@1.1.0
  - @oc-mui/plugin-system@1.2.0
  - @oc-mui/router@1.1.2
  - @oc-mui/store@1.1.1
  - @oc-mui/ui@2.0.1
  - @oc-mui/utils@1.2.0
  - @oc-mui/plugin-core@1.1.1

## 1.1.1

### Patch Changes

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

- 90dca3b: `PageShell` standardizes the content pages (#257): uniform page padding, the title in the same place and type scale on every page, optional description, an optional right-aligned actions slot, separator, content. Episodes, series, upload and the marketplace all render through it now — the marketplace loses its own padding/heading dialect (its view toggle moves into the actions slot), upload loses its accidental flex-wrap frame. The landing page deliberately stays out (marketing surface). Plugin apps should adopt `PageShell` so their pages sit flush with the core ones.
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

- 951a89a: Fix the upload dropzone and rename-field sizing, and replace hardcoded palette colors with theme tokens.
  - **Dropzone width regression:** the dropzone wrapper lost its effective width when the `asChild`-onto-Fragment markup was replaced with a real `<Container>` div. Previously the dropped wrapper classes let the `w-2/3` Card fill the full-width column; the new wrapper has no width and its parent column is `items-center`, so it shrank to its content and collapsed the dropzone into a narrow box. Restored with `w-full` on the wrapper so the dropzone fills the column as it did before.
  - **Rename-field font-race:** the file-rename input sized itself by measuring a hidden mirror span's `offsetWidth` during render, with no re-measure after web fonts load — so on a cold load it latched to the fallback-font width and rendered too narrow once a corporate web font swapped in. It now sizes purely via CSS (`field-sizing-content`, with a length-based `size` fallback bounded by `min-w`/`max-w`) — no measurement, no latch — and gets theme-token styling so it isn't an unstyled white field in dark mode.
  - File-status icons now use the status tokens `text-ok` / `text-error` / `text-info` instead of the fixed `text-green-500` / `text-red-500` / `text-indigo-500`, matching the episodes table. The raw palette colors never responded to dark mode or an organization theme.
  - The rename pencil icon uses `text-muted-foreground hover:text-foreground` (matching the sibling remove button) instead of `text-slate-500 hover:text-slate-900`, whose hover state was near-invisible on dark surfaces.
  - The remove button's keyboard focus ring uses `ring-ring` + `ring-offset-background` instead of `ring-indigo-500` and a default (white) offset.
  - The upload `Toaster` no longer hard-pins `theme="light"`, so toasts follow the active light/dark theme instead of rendering a white box in dark mode.
  - Removed a dead, empty, never-imported `src/index.css`.

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
  - @oc-mui/plugin-core@1.0.1
