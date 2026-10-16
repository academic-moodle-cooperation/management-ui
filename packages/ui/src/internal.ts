/**
 * Host-only surface of `@oc-mui/ui` — NOT part of the plugin SDK.
 *
 * Everything here is consumed by the shell (and the host-side runtime
 * packages) to assemble the application: the app shell frame, the router
 * primitives the host injects, the landing page, the error pages and the
 * theme-mode provider. Plugins never need these, and keeping them out of
 * `@oc-mui/ui/components` keeps them out of the published API contract —
 * no API report, no semver promise, free to change with the shell.
 *
 * The remote-plugin loader does not share this entry with loaded plugins
 * (`SHARED_MODULE_NAMES`), so a plugin importing it fails loudly at load
 * time rather than silently coupling to host internals.
 */

export * from "./components/router-context";
export * from "./components/appshell";
export * from "./components/DefaultLandingPage";
export * from "./components/errors";
export { ThemeModeProvider } from "./components/theme-mode/ThemeModeProvider";
