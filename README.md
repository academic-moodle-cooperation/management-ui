# Management UI

A modular, plugin-first admin interface for [Opencast](https://opencast.org). A thin shell hosts routing, auth, and layout; every visible feature ships as a plugin.

[![License: ECL 2.0](https://img.shields.io/badge/License-ECL_2.0-blue.svg)](LICENSE)

## What it is

- **For Opencast operators** — a modern admin UI you can deploy and configure per org without forking core.
- **For plugin authors** — a stable extension-point contract for adding routes, sidebar items, themes, and config without touching the shell.
- **For contributors** — a pnpm + Turborepo monorepo with strict architectural boundaries and a frozen plugin contract.

The four contracts (Manifest 1.1, Runtime API 1.0, Theme 2.0, Config 1.0) are frozen for the 1.x line — see [`docs/architecture/CONTRACTS.md`](docs/architecture/CONTRACTS.md).

## Quick start

```bash
git clone https://github.com/academic-moodle-cooperation/management-tool.git
cd management-tool
pnpm install
pnpm build         # one-time — builds dist-types/ for upstream packages
pnpm dev           # http://127.0.0.1:3000/management-ui/
```

Full setup, including backend wiring: [`docs/getting-started/installation.md`](docs/getting-started/installation.md).

## Repo layout

```
apps/shell/          The deployable Vite app. Routing, auth, layout, plugin loader.
apps/playground/     Dev-only single-plugin sandbox.
packages/            Shared infrastructure (plugin-system, ui, query, router, i18n, …).
plugins/             Built-in plugins (episodes, series, upload, marketplace, …).
.local-plugins/      Org plugins (gitignored — each is its own git repo).
docs/                Full documentation, audience-routed at docs/README.md.
```

Architectural tour: [`docs/architecture/overview.md`](docs/architecture/overview.md).

## Documentation

| If you want to… | Start at |
|-----------------|----------|
| **Use Management UI** | [`docs/getting-started/`](docs/getting-started/) |
| **Write a plugin** | [`docs/plugins/creating-a-plugin.md`](docs/plugins/creating-a-plugin.md) |
| **Contribute to the core** | [`CONTRIBUTING.md`](CONTRIBUTING.md) |
| **Understand the architecture** | [`docs/architecture/overview.md`](docs/architecture/overview.md) |
| **See what's deferred** | [`docs/operations/open-followups.md`](docs/operations/open-followups.md) |
| **Browse the full doc tree** | [`docs/README.md`](docs/README.md) |

For AI agents and tooling: [`llms.txt`](llms.txt) (machine-readable summary), [`AGENTS.md`](AGENTS.md) (operational rules).

## Per-package READMEs

Every package, app, and plugin ships its own README:

- [`apps/README.md`](apps/README.md) — applications (shell, playground).
- [`packages/README.md`](packages/README.md) — shared infrastructure catalogued by layer.
- [`plugins/README.md`](plugins/README.md) — built-in plugins.

## Customization

Plugins register on **extension points** declared by [`@oc-mui/plugin-core`](plugins/core/). To customize the UI without forking:

- **Routes and sidebar entries** — register on `apps:definitions` and `sidebar:nav-items`.
- **Header, footer, branding** — register on `app:header-logo`, `app:footer`, `app:branding`.
- **Theme** — ship a CSS file with token overrides; see [`docs/plugins/styling.md`](docs/plugins/styling.md).
- **Config** — declare a Zod-typed slice with `definePluginConfig`; see [`docs/getting-started/configuration.md`](docs/getting-started/configuration.md).

Scaffold a new plugin in one command:

```bash
pnpm create-plugin my-plugin             # → .local-plugins/my-plugin/
pnpm create-plugin my-plugin --in-tree   # → plugins/my-plugin/
```

## Development

```bash
pnpm dev                    # run the shell
pnpm verify                 # the local pre-push gate (lint, types, build, unit, contract, api-check, e2e)
pnpm test                   # unit tests
pnpm test:contract          # plugin contract tests
pnpm test:e2e               # Playwright smoke against the shell
pnpm api-check              # regenerate API surface snapshots
pnpm changeset              # add a release-note entry
```

`pnpm verify` mirrors CI exactly — if it's green locally, it's green in CI. See [`docs/operations/ci.md`](docs/operations/ci.md) for the CI graph.

## Contributing

Read [`CONTRIBUTING.md`](CONTRIBUTING.md). New contributors should also read [`AGENTS.md`](AGENTS.md) (the operational pre-flight checklist — written for AI agents but useful as a human checklist too) and [`docs/architecture/overview.md`](docs/architecture/overview.md).

Issue templates: [bug report](https://github.com/academic-moodle-cooperation/management-tool/issues/new?template=bug_report.yml), [feature request](https://github.com/academic-moodle-cooperation/management-tool/issues/new?template=feature_request.yml). Plugin-authoring questions go in [Discussions](https://github.com/academic-moodle-cooperation/management-tool/discussions).

## Status

Pre-1.0 — currently in OSS readiness phases. The four contracts are frozen, but the publishing target (`@oc-mui/*` on npm) flips from `restricted` to `public` only after every phase ships and the build is verified against a real Opencast test server. Track the work at [`docs/operations/open-followups.md`](docs/operations/open-followups.md).

## License

Educational Community License v2.0 (ECL 2.0). See [`LICENSE`](LICENSE).

## Security

Vulnerabilities go through [`SECURITY.md`](SECURITY.md), not public issues.

## Code of conduct

We follow the [Contributor Covenant](CODE_OF_CONDUCT.md).
