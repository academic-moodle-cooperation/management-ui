# Changelog

All notable changes to the `@oc-mui/*` packages are recorded here. The packages are
versioned and released together, so this is their shared history. The project follows
[Semantic Versioning](https://semver.org/) and the
[Keep a Changelog](https://keepachangelog.com/) format; from 1.0.0 on, every change
ships with its own changeset.

<!-- On release day, change "unreleased" below to the publish date (YYYY-MM-DD). -->

## 1.0.0 — unreleased

First public release. `@oc-mui` is the plugin SDK for the **Opencast Management UI**,
a modular, plugin-first admin interface for [Opencast](https://opencast.org/).
Everything below is new — this is the baseline the SDK starts from, not a diff against
an earlier version.

### Highlights

- **Plugin-first architecture.** The app is a thin shell; every route, nav item, header,
  setting, and screen is contributed by a plugin through typed *extension points*
  (`apps:definitions`, `sidebar:nav-items`, `app:config:defaults`, `appshell:header`, …).
  Author one with `createPlugin({ ... })` and register against the points you need.
- **Stable facades over moving libraries.** Plugins build against `@oc-mui/*` facades for
  routing, data fetching, i18n, and state, so the libraries underneath can evolve without
  breaking plugins.
- **A real component library.** `@oc-mui/ui` ships a shadcn/ui + Tailwind component set
  with semantic design tokens and dark mode, themeable entirely through CSS variables — no
  hardcoded colors in plugin code.
- **Scaffolding in one command.** `pnpm create-plugin <name>` generates a working plugin:
  manifest, entry, a passing contract test, and optionally a Maven POM that builds a
  deployable Opencast JAR.
- **Contract-tested by default.** `@oc-mui/plugin-testing` loads a plugin in isolation and
  asserts it activates cleanly, populates every extension point its manifest declares, and
  keeps i18n key parity across locales.
- **Three ways to ship a plugin** — an in-tree workspace package, an Opencast **JAR** served
  by the backend, or a **remote** ES-module bundle loaded at runtime from a registry — plus
  a built-in **marketplace** to install community plugins and themes on the fly, with a
  domain allowlist and runtime API-version checks.
- **Guardrails for a healthy ecosystem.** Architectural import boundaries (a plugin can't
  reach into apps or other plugins), per-plugin **error isolation** (a broken plugin degrades
  to a placeholder instead of crashing the shell), a **shared-runtime-dependencies** contract
  that version-gates what plugins may import from the host, and a GraphQL operation-naming
  contract — all enforced by the shared ESLint config.
- **i18n & config done right.** Per-plugin translation namespaces with key-parity checks, and
  per-plugin config slices declared with a Zod schema (`definePluginConfig`) and merged beneath
  the app's `config.json`.
- **Auth & standalone mode.** Password and SSO (Shibboleth/OIDC) login with protected routes,
  plus a standalone-app runtime so a single plugin app can run on its own.
- **Published with provenance.** Every package is published from CI with npm provenance
  attestations.

### Packages

All 15 packages are released at `1.0.0`:

| Package | What it is |
| --- | --- |
| `@oc-mui/plugin-system` | Plugin runtime — `createPlugin`, `PluginManager`, extension points, error boundaries |
| `@oc-mui/app-runtime` | Plugin runtime context + standalone-app bootstrap |
| `@oc-mui/ui` | React component library (shadcn/ui + Tailwind, dark mode, semantic tokens) |
| `@oc-mui/ui-config` | UI configuration primitives |
| `@oc-mui/router` | Routing + auth facade (TanStack Router) |
| `@oc-mui/query` | Data-fetching + GraphQL facade (TanStack Query) |
| `@oc-mui/store` | State facade (Jotai) |
| `@oc-mui/i18n` | Internationalization facade (i18next) |
| `@oc-mui/utils` | Shared utilities (logging, helpers) |
| `@oc-mui/plugin-testing` | Plugin contract-test harness |
| `@oc-mui/plugin-core` | Canonical infrastructure plugin (shared extension-point identifiers) |
| `@oc-mui/vite-config` | Shared Vite config + dev-server plugins |
| `@oc-mui/eslint-config` | Shared ESLint config (wrapper + boundary + GraphQL-naming rules) |
| `@oc-mui/typescript-config` | Shared TypeScript config |
| `@oc-mui/tailwind-config` | Shared Tailwind config |

### Requirements

- **Node.js** ≥ 20
- **React** 19 (`@oc-mui/ui` targets React 19; the framework packages also support React 18)
- **pnpm** for workspace development
- An **Opencast** backend for live data (over GraphQL/REST); plugin authoring can run against
  stubbed endpoints without one

### License

[ECL-2.0](LICENSE) — Educational Community License, Version 2.0.
