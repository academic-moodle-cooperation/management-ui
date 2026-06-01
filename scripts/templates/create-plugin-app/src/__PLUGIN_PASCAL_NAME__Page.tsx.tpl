/**
 * The page mounted at /__PLUGIN_NAME__. Any React component works here.
 * Use semantic tokens (text-foreground, text-muted-foreground, …) so it
 * adapts to the active theme and dark mode automatically — no hardcoded
 * colors. See docs/plugins/styling.md.
 */
export function __PLUGIN_PASCAL_NAME__Page() {
  return (
    <div className="p-6 space-y-3">
      <h1 className="text-2xl font-semibold text-foreground">
        Hello from the __PLUGIN_NAME__ plugin 👋
      </h1>
      <p className="text-muted-foreground">
        This page is mounted at <code>/__PLUGIN_NAME__</code> — the screen behind
        the sidebar entry of the same name.
      </p>
      <p className="text-muted-foreground">
        Edit <code>src/__PLUGIN_PASCAL_NAME__Page.tsx</code> to build your real UI.
      </p>
    </div>
  );
}
