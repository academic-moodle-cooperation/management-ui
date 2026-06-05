---
"@oc-mui/plugin-system": patch
---

Per-plugin error boundary (§5.6): a plugin component that throws during render
is now isolated by `ComponentResolver` instead of crashing the whole shell.
The plugin override is wrapped in a `PluginErrorBoundary` that falls back to
the built-in default component (and logs the failure with the extension-point
key), so one broken third-party plugin degrades gracefully rather than taking
the app down via the root error boundary.
