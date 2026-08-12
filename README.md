# Management UI

A modular, plugin-first admin interface for [Opencast](https://opencast.org). A thin shell hosts routing, auth, and layout; every visible feature — episodes, series, upload, marketplace — ships as a plugin. Organisations customize by adding plugins and themes, not by forking.

[![License: ECL 2.0](https://img.shields.io/badge/License-ECL_2.0-blue.svg)](LICENSE)

## Where to start

| You want to… | Start at |
|---|---|
| **Run it on your Opencast** | [Deployment](docs/getting-started/deployment.md) — JARs deployed, `config.json` in place, login working. |
| **Build a plugin** | [Your first plugin](docs/plugins/first-plugin.md) — scaffolded, visible in the dev shell, contract test green in about five minutes. |
| **Contribute to this repo** | [`CONTRIBUTING.md`](CONTRIBUTING.md) — the dev loop, the changeset rule, and everything to land your first PR. |

Full documentation lives in [`docs/`](docs/README.md) and renders as the [docs site](https://academic-moodle-cooperation.github.io/management-ui/) (Pages deploys are currently dormant — browse `docs/` on GitHub meanwhile). Architecture tour: [`docs/architecture/overview.md`](docs/architecture/overview.md). For AI agents and tooling: [`AGENTS.md`](AGENTS.md) (operational rules) and [`llms.txt`](llms.txt).

## Quick start

```bash
git clone https://github.com/academic-moodle-cooperation/management-ui.git
cd management-ui
pnpm install
pnpm build         # one-time — builds dist-types/ for upstream packages
pnpm dev           # http://127.0.0.1:3000/management-ui/
```

Node and pnpm versions are pinned in [`package.json`](package.json) (`engines` and `packageManager`) — `corepack enable` picks the right pnpm automatically. Full development setup, including backend wiring and troubleshooting: [Run from source](docs/getting-started/installation.md).

## Everyday commands

| Command | What it does |
|---|---|
| `pnpm dev` | Run the shell with hot reload. |
| `pnpm verify` | The local pre-push gate — mirrors CI; step list in [AGENTS.md → Pre-push gate](AGENTS.md#pre-push-gate--pnpm-verify). |
| `pnpm test` | Unit tests across all packages. |
| `pnpm create-plugin <name>` | Scaffold a plugin (add `--in-tree` for a built-in one). |
| `pnpm docs:dev` | Serve the docs site locally. |

## Status

Pre-1.0, in OSS-readiness phases. The six plugin contracts are frozen for the 1.x line — see [`docs/architecture/CONTRACTS.md`](docs/architecture/CONTRACTS.md) — and the `@oc-mui/*` packages publish to npm. Remaining work is tracked in [`docs/operations/open-followups.md`](docs/operations/open-followups.md).

## License, security, conduct

- Licensed under the [Educational Community License v2.0](LICENSE).
- Vulnerabilities go through [`SECURITY.md`](SECURITY.md), never public issues.
- We follow the [Contributor Covenant](CODE_OF_CONDUCT.md).
