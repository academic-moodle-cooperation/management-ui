# Documentation

Routing by audience. Pick the path that matches what you're doing.

## I want to use Management UI

- [`getting-started/what-is-management-ui.md`](./getting-started/what-is-management-ui.md) — the elevator pitch.
- [`getting-started/installation.md`](./getting-started/installation.md) — clone, install, run.
- [`getting-started/configuration.md`](./getting-started/configuration.md) — the config model in practice.
- [`getting-started/upgrading.md`](./getting-started/upgrading.md) — moving between versions safely.
- [`architecture/overview.md`](./architecture/overview.md) — the shape of the codebase in one screen.

## I'm writing a plugin

- [`plugins/creating-a-plugin.md`](./plugins/creating-a-plugin.md) — the walkthrough.
- [`plugins/styling.md`](./plugins/styling.md) — Theme Contract 2.0.
- [`plugins/distribution.md`](./plugins/distribution.md) — in-tree, `.local-plugins/`, JAR, or CDN.
- [`plugins/i18n.md`](./plugins/i18n.md) — translations.
- [`plugins/testing.md`](./plugins/testing.md) — the required contract test plus what else to cover.
- [`../AGENTS.md`](../AGENTS.md) — the operational pre-flight checklist (the author-facing equivalent of `CONTRIBUTING.md`).

## I'm contributing to the core

- [`../CONTRIBUTING.md`](../CONTRIBUTING.md) — setup, the dev loop, versioning, PR rules.
- [`architecture/overview.md`](./architecture/overview.md) — the package layers and plugin boundaries.
- [`architecture/CONTRACTS.md`](./architecture/CONTRACTS.md) — the four frozen contracts.
- [`architecture/CONFIGURATION.md`](./architecture/CONFIGURATION.md) — the full config layer model.
- [`operations/testing.md`](./operations/testing.md) — the test pyramid.
- [`operations/release.md`](./operations/release.md) — versioning, changesets, publishing.
- [`operations/ci.md`](./operations/ci.md) — what runs on every PR.

## I want the canonical reference

- [`architecture/decisions/`](./architecture/decisions/) — ADRs. Why the shape is the way it is.
- [`architecture/CONTRACTS.md`](./architecture/CONTRACTS.md) — manifest, runtime API, theme, config.
- [`architecture/CONFIGURATION.md`](./architecture/CONFIGURATION.md) — config model.
- [`operations/open-followups.md`](./operations/open-followups.md) — every "known but not doing it now" item in the repo.
- [`/llms.txt`](../llms.txt) — machine-readable project summary for AI agents.

## I want to dig into specifics

- [`reference/favicon-configuration.md`](./reference/favicon-configuration.md) — how the favicon override system works.
- [`operations/shadcn-typescript-errors.md`](./operations/shadcn-typescript-errors.md) — why the type-check ignores certain shadcn files.

## I'm extending the workspace itself

- [`workflows/ADDING_APPS.md`](./workflows/ADDING_APPS.md) — add a new top-level app.
- [`workflows/ADDING_PACKAGES.md`](./workflows/ADDING_PACKAGES.md) — add a new shared package.

## See also

- [`../README.md`](../README.md) — project landing.
- [`../CONTRIBUTING.md`](../CONTRIBUTING.md) — contributor workflow.
- [`../AGENTS.md`](../AGENTS.md) — rules for AI agents and plugin authors.
- [`../CODE_OF_CONDUCT.md`](../CODE_OF_CONDUCT.md) — community standards.
- [`../SECURITY.md`](../SECURITY.md) — vulnerability reporting.
