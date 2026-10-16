# @oc-mui/remote-plugin-loader

## 1.1.0

### Minor Changes

- 2a5bcac: Plugin CSS now loads into a dedicated `plugins` cascade layer so a plugin's own utilities win on its own DOM.

  Previously the loader inserted each plugin's stylesheet **before** the host shell stylesheets "so host utilities keep precedence". The side effect: a host base utility (e.g. `.text-4xl`) loaded _after_ the plugin would override the plugin's own responsive utility (e.g. `.sm:text-6xl`) on the plugin's element — a normal `text-4xl sm:text-6xl` heading rendered at the smaller size on desktop.

  Now `@oc-mui/ui`'s `globals.css` declares `@layer theme, base, components, utilities, plugins;`, and `@oc-mui/remote-plugin-loader` loads each plugin's CSS into `@layer plugins` (via a `<style>` with `@import … layer()`, since the `<link layer>` attribute isn't shipped in browsers yet). Because `plugins` sits after `utilities`, plugin utilities win on plugin-owned DOM regardless of load order, while every plugin still ships into one predictable layer so it can't reorder host chrome. No plugin change is required; per-plugin `@layer plugin-overrides` workarounds for this are no longer needed.

  **Superseded before release:** the `plugins` layer now sits _between_ `base` and `utilities` (`theme, base, plugins, components, utilities`), and the guarantee "plugin utilities win on plugin-owned DOM" is withdrawn — see the Theme Contract 2.1 entry in the same release.

### Patch Changes

- 3b40cfc: Documentation-only: correct package READMEs against the code (docs overhaul Phase 1).
- 9526e3f: Make the `plugins` cascade layer actually take effect, and place it where it is safe: between Tailwind's `base` and `utilities` (Theme Contract 2.1).

  Two defects, one visible symptom (a remote plugin's landing page rendered without vertical padding, margins or heading size on deployments whose host build never generated those classes):

  - `@oc-mui/ui/postcss.config` loaded `@tailwindcss/postcss` pinned to a 2024 alpha (`0.0.0-oxide.4`). Vite picked that config up automatically, so the alpha ran in addition to `@tailwindcss/vite` and rewrote the compiled `@layer` statement, hoisting `plugins` below `base` — Tailwind's preflight reset then overrode every plugin utility. The alpha dependency is removed, the shell and playground ship no PostCSS config, and `@oc-mui/ui/postcss.config` stays as a deprecated empty config for one major cycle.
  - The declared order (`plugins` after `utilities`) was never in effect and is unsafe: a plugin ships a complete Tailwind sheet, and its plain `.hidden` would beat the host's `md:block` on the sidebar wrapper. The new order `theme, base, plugins, components, utilities` lets plugin utilities beat preflight while host utilities keep precedence on class-name collisions; a plugin escalates its own responsive variants with Tailwind's `!` modifier. Documented in `docs/extend/styling.md`; the loader's comment follows.

- Updated dependencies
- Updated dependencies [3b40cfc]
- Updated dependencies [31c19e7]
- Updated dependencies [9db8ada]
- Updated dependencies [3f6bf7d]
- Updated dependencies [2fbe7c9]
- Updated dependencies [a007934]
- Updated dependencies [a36e731]
- Updated dependencies [2044d7f]
  - @oc-mui/plugin-system@1.2.0
  - @oc-mui/utils@1.2.0

## 1.0.1

### Patch Changes

- Updated dependencies [4451b10]
- Updated dependencies [1234904]
- Updated dependencies [ca4f8f6]
- Updated dependencies [ed4a3d8]
  - @oc-mui/utils@1.1.0
  - @oc-mui/plugin-system@1.1.0
