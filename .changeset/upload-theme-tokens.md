---
"@oc-mui/plugin-core-upload": patch
---

Upload section: use semantic theme tokens instead of hardcoded palette colors, fixing dark-mode and themed-deployment rendering.

- File-status icons now use the status tokens `text-ok` / `text-error` / `text-info` instead of the fixed `text-green-500` / `text-red-500` / `text-indigo-500`, matching the episodes table. The raw palette colors never responded to dark mode or an organization theme.
- The rename pencil icon uses `text-muted-foreground hover:text-foreground` (matching the sibling remove button) instead of `text-slate-500 hover:text-slate-900`, whose hover state was near-invisible on dark surfaces.
- The remove button's keyboard focus ring uses `ring-ring` + `ring-offset-background` instead of `ring-indigo-500` and a default (white) offset.
- The upload `Toaster` no longer hard-pins `theme="light"`, so toasts follow the active light/dark theme instead of rendering a white box in dark mode.
- Removed a dead, empty, never-imported `src/index.css`.
