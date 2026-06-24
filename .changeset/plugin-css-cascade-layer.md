---
"@oc-mui/remote-plugin-loader": minor
"@oc-mui/ui": patch
---

Plugin CSS now loads into a dedicated `plugins` cascade layer so a plugin's own utilities win on its own DOM.

Previously the loader inserted each plugin's stylesheet **before** the host shell stylesheets "so host utilities keep precedence". The side effect: a host base utility (e.g. `.text-4xl`) loaded *after* the plugin would override the plugin's own responsive utility (e.g. `.sm:text-6xl`) on the plugin's element — a normal `text-4xl sm:text-6xl` heading rendered at the smaller size on desktop.

Now `@oc-mui/ui`'s `globals.css` declares `@layer theme, base, components, utilities, plugins;`, and `@oc-mui/remote-plugin-loader` loads each plugin's CSS into `@layer plugins` (via a `<style>` with `@import … layer()`, since the `<link layer>` attribute isn't shipped in browsers yet). Because `plugins` sits after `utilities`, plugin utilities win on plugin-owned DOM regardless of load order, while every plugin still ships into one predictable layer so it can't reorder host chrome. No plugin change is required; per-plugin `@layer plugin-overrides` workarounds for this are no longer needed.
