---
"@oc-mui/plugin-core-upload": patch
---

Fix the upload dropzone and rename-field sizing, and replace hardcoded palette colors with theme tokens.

- **Dropzone width regression:** the dropzone wrapper lost its effective width when the `asChild`-onto-Fragment markup was replaced with a real `<Container>` div. Previously the dropped wrapper classes let the `w-2/3` Card fill the full-width column; the new wrapper has no width and its parent column is `items-center`, so it shrank to its content and collapsed the dropzone into a narrow box. Restored with `w-full` on the wrapper so the dropzone fills the column as it did before.
- **Rename-field font-race:** the file-rename input sized itself by measuring a hidden mirror span's `offsetWidth` during render, with no re-measure after web fonts load — so on a cold load it latched to the fallback-font width and rendered too narrow once a corporate web font swapped in. It now sizes purely via CSS (`field-sizing-content`, with a length-based `size` fallback bounded by `min-w`/`max-w`) — no measurement, no latch — and gets theme-token styling so it isn't an unstyled white field in dark mode.
- File-status icons now use the status tokens `text-ok` / `text-error` / `text-info` instead of the fixed `text-green-500` / `text-red-500` / `text-indigo-500`, matching the episodes table. The raw palette colors never responded to dark mode or an organization theme.
- The rename pencil icon uses `text-muted-foreground hover:text-foreground` (matching the sibling remove button) instead of `text-slate-500 hover:text-slate-900`, whose hover state was near-invisible on dark surfaces.
- The remove button's keyboard focus ring uses `ring-ring` + `ring-offset-background` instead of `ring-indigo-500` and a default (white) offset.
- The upload `Toaster` no longer hard-pins `theme="light"`, so toasts follow the active light/dark theme instead of rendering a white box in dark mode.
- Removed a dead, empty, never-imported `src/index.css`.
