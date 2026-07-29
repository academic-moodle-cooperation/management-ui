# @oc-mui/plugin-core-upload

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
