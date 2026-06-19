---
"@oc-mui/plugin-system": minor
"@oc-mui/remote-plugin-loader": minor
---

Expose `@oc-mui/app-runtime` as a host-provided shared module so app-type
plugins (which import `AppRuntimeProvider` / `useAppRuntime` /
`AdaptiveAppWrapper`) load correctly. Previously it was externalized by the
community-plugin build but not provided by the host, so the plugin blob's bare
import failed at load. Added to `SHARED_MODULE_NAMES`, `SHARED_RUNTIME_MAJORS`,
and the shell's `exposeSharedModules()` (the three lists that must stay in
sync).

Also hardens the contract in two ways:

- The remote-plugin loader now logs a clear, actionable error naming any
  `@oc-mui/*` package a plugin imports that the host doesn't expose — instead of
  the previous silent failure with a cryptic blob-import error.
- `checkSharedDependencyCompatibility` now **rejects** a wrong-scope reference to
  a host package (e.g. a plugin declaring `@workspace/plugin-system`, the
  pre-rename namespace, while the host provides `@oc-mui/plugin-system`) with a
  rename hint, instead of waving it through as a benign "unknown" dependency.
