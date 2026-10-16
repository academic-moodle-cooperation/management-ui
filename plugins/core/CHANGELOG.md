# @oc-mui/plugin-core

## 1.1.0

### Minor Changes

- 0ec637a: New extension point `episodes:table:status-indicators`: a plugin registers an `EpisodeStatusIndicator` (`matches`, `icon`, `tone`, `label`, optional `href`/`target`) and the episodes table shows it in place of the default status icon — in the list view's status column and as the gallery thumbnail overlay — for every row the indicator claims; with an `href` the icon and the thumbnail link to where the state is resolved (the editor, say). This is how a deployment surfaces states `eventStatus` does not carry, such as a processed event that still awaits publication. `@oc-mui/plugin-core` exports the type and the `EPISODE_STATUS_INDICATORS` key and now also documents the existing `episodes:table:actions` slot.

  The gallery thumbnail no longer links to an empty `href` when a processed event has no `publishUrl`.

### Patch Changes

- Dependency maintenance: the October minor/patch group (47 packages) — the Radix primitives, react-aria/react-stately, Tailwind 4.3, zod 4.6, graphql-request 7.4, Playwright 1.64, api-extractor 7.59, typescript-eslint 8.71 and the rest. No code changes.

  Three bumps from the group are deliberately not taken, each with the reason recorded next to the pin:

  - **React stays on 19.1** (`pnpm.overrides` + root dev dependencies so every peer resolves to the same copy). React ≥ 19.2 logs a console error for the theme `<script>` that `next-themes` 0.4.6 renders, and the E2E smoke test asserts zero console errors; upstream is unresolved (pacocoursey/next-themes #385/#387/#397). Lifted once the theme provider no longer renders a script.
  - **`@tanstack/router-devtools` stays on 1.125**, together with `react-router-devtools` and `router-devtools-core`: the devtools import `@tanstack/router-core` internals and only work with the router minor they shipped with; the newer versions broke Vite's pre-bundling and with it the dev server.
  - **`@types/node` is pinned to the workspace's `^25`** across the tree: optional `@types/node` peers otherwise resolve to the newest major in packages that declare none, which splits Vite into two type-incompatible instances.

- 3b40cfc: Documentation-only: correct package READMEs against the code (docs overhaul Phase 1).
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

- c4ae3f9: The footer's "About Management UI" link points at the published documentation site instead of the app's home page. It pointed home only while the docs URL 404'd on the private repo.
- 45dc3ae: Translate the strings that stayed English (and one German) regardless of the selected language, and format dates in the active language.

  - `@oc-mui/i18n` gains `formatDate` / `activeDateLocale`. Six call sites built `new Intl.DateTimeFormat("de-DE", …)` themselves, so every date was German whatever the UI language was; they now share one helper that reads the active language and returns an empty string for unusable input instead of throwing inside a table cell.
  - `@oc-mui/i18n` also gains `setUserLanguage` / `getUserLanguage` / `applyConfiguredLanguage`. `app.locale` was declared in the config contract but nothing read it; it is now applied as the deployment's default language, with an explicit user choice remembered and taking precedence.
  - Filter reset, "More actions", the ACL editor's update button, login/logout, the series upload action, the sidebar metadata tab, the upload list's remove control and file size, and the series-picker placeholder now go through `t(...)`. New keys ship in both shipped locales.
  - The row-total counter in the data-table pagination bar was rendered only when there was nothing to count, which also left the page controls stranded at the left edge of the row.
  - The sidebar tab strip sized itself for exactly two tabs; the column count now follows the number of tabs actually rendered, so a second plugin-contributed tab no longer breaks the layout.

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
- 2044d7f: Move the `build:types` incremental state file (`tsconfig.build.tsbuildinfo`) into `dist-types/` so it lives and dies with the declaration output it describes. Previously the state file sat at the package root, outside the turbo `dist-types/**` cache outputs: a stale state file next to a deleted/partial `dist-types/` made `tsc` skip emission entirely, and turbo then cached the empty `dist-types/` — poisoning the (worktree-shared) build cache and breaking `check-types` repo-wide with `TS7016` errors on later "cache hit" runs (#258).
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
- Updated dependencies [3f02712]
- Updated dependencies [564d02f]
- Updated dependencies [a446b51]
- Updated dependencies [fb144d3]
- Updated dependencies [45dc3ae]
- Updated dependencies [4ae141b]
- Updated dependencies [36b1289]
- Updated dependencies [3e20b75]
- Updated dependencies [0f076c1]
- Updated dependencies [a5c54f6]
- Updated dependencies [8ec82fc]
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
  - @oc-mui/plugin-system@1.2.0
  - @oc-mui/router@1.1.1

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

- Updated dependencies [dae5dc4]
- Updated dependencies [1234904]
- Updated dependencies [ca4f8f6]
- Updated dependencies [41d22f6]
- Updated dependencies [8fef245]
- Updated dependencies [39c4b67]
- Updated dependencies [ed4a3d8]
- Updated dependencies [2de0b14]
  - @oc-mui/query@1.1.0
  - @oc-mui/i18n@1.0.1
  - @oc-mui/plugin-system@1.1.0
  - @oc-mui/router@1.1.0
  - @oc-mui/ui@1.1.0
