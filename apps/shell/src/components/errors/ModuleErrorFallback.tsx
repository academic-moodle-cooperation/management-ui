/**
 * Inline error fallback shown when a dynamically-imported app module
 * fails to render — wired into the per-route `<ErrorBoundary>` in
 * `DynamicRouterProvider`. Intentionally compact (not full-screen) so
 * the surrounding shell chrome (sidebar, header) stays visible and the
 * user can navigate elsewhere.
 *
 * The `ErrorBoundary` class itself and the full-screen `NotFoundError`
 * page both live in `@oc-mui/ui/components` so every app/plugin can
 * reuse the same primitives — no need to duplicate them here.
 */
import type { FC } from "react";

export const ModuleErrorFallback: FC<{ name: string }> = ({ name }) => (
  <div className="flex items-center justify-center min-h-64 border border-destructive/40 bg-destructive/5 rounded-lg">
    <div className="text-center text-destructive">
      <h3 className="text-lg font-semibold mb-2">Module Error</h3>
      <p>Error loading module: {name}</p>
      <p className="text-sm mt-2 text-muted-foreground">Please try refreshing the page.</p>
    </div>
  </div>
);
