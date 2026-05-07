# Contributing to Management UI

First off, thank you for considering contributing to the Management UI! It's people like you that make this a great platform for the video management community.

This project is a modular, plugin-based platform designed for extensibility. Before you start, please take a moment to read through this guide.

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v20 or higher
- **pnpm**: v10.4.1 or higher
- **Java**: Required for backend development (Maven)

### Initial Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-org/management-ui.git
    cd management-ui
    ```

2.  **Install dependencies**:
    ```bash
    pnpm install
    ```

3.  **Run the development server**:
    ```bash
    # Starts all applications and packages in dev mode
    pnpm dev
    ```

## 🏗️ Architecture Overview

The project is a monorepo managed with **Turborepo** and **pnpm workspaces**.

- **`/apps`**: Main entry point applications (e.g., `management-ui-core`).
- **`/packages`**: Shared infrastructure, UI components, and logic.
- **`/plugins`**: Domain-specific extensions (e.g., `series`, `episodes`).
- **`/backend`**: Java/Maven based backend services.

### Plugin-First Philosophy

Everything in this UI is built to be extensible. We use a **Plugin System** that allows you to override UI components, add new routes, and inject custom logic without touching the core packages.

For more details, see:
- [Plugin System Documentation](packages/plugin-system/README.md)
- [Architecture Decision Records](docs/architecture/)

## 🛠️ Development Workflows

We have detailed step-by-step guides for common tasks in the `docs/workflows/` directory:

- [Adding a New App](docs/workflows/ADDING_APPS.md)
- [Adding a New Package](docs/workflows/ADDING_PACKAGES.md)
- [Adding a New Plugin](docs/workflows/ADDING_PLUGINS.md)
- [Updating Dependencies](docs/workflows/UPDATING_DEPENDENCIES.md)
- [Swapping Technologies](docs/workflows/SWAPPING_TECHNOLOGIES.md)

## 🎨 Coding Standards

### TypeScript

- We use **Strict Mode** TypeScript. Avoid `any` whenever possible.
- If you must use a workaround, document it with a comment explaining why.

### Linting & Formatting

- **ESLint**: Run `pnpm lint` to check for code quality issues.
- **Prettier**: Run `pnpm format` to ensure consistent code style.
- **CI Enforcement**: Our GitHub Actions will fail if there are any linter errors or formatting issues.

### Testing

- We use **Vitest** for unit and integration tests.
- Add tests for any new logic or components.
- Run tests with `pnpm test`.

## 📦 Versioning, Changesets, and Deprecations

Every workspace package under `packages/` and `plugins/` is **versioned independently** following [Semver 2.0](https://semver.org/). The ground rules below apply to every public package; the four contracts in [`docs/architecture/CONTRACTS.md`](docs/architecture/CONTRACTS.md) layer additional, contract-specific rules on top for the explicitly-frozen API surfaces (Manifest 1.1, Runtime API 1.0, Theme 2.0, Config 1.0).

### What kind of bump?

Decide based on what the change does to the **package's public surface** — i.e. the symbols listed in its `package.json`'s `exports` field, the public types those exports re-export, and any documented runtime contract:

| Bump type | When to use |
|---|---|
| **Patch** | Internal-only refactors, performance work, doc/comment changes, bug fixes that keep the same public signature. No visible behaviour change for any consumer who treats the package as a black box. |
| **Minor** | New exports, new optional parameters, a new method on a class, a new optional field on a public type. Existing consumers remain source- and binary-compatible. |
| **Major** | A removed export, a renamed symbol, a changed signature (including a new required parameter), a behaviour change that an existing consumer would observe (e.g. an extension point's contract changes), or anything that breaks plugin-runtime API/manifest/theme/config compatibility. |

Plugin runtime API contracts have a hard rule: **anything that changes the Plugin Runtime API observable to plugin authors → major bump of `@workspace/plugin-system`.** The host loader rejects plugins whose declared `apiVersion` major mismatches the host's `PLUGIN_API_VERSION`.

### Adding a changeset

We use [Changesets](https://github.com/changesets/changesets) to track every user-facing change and generate per-package changelogs. The workflow:

```bash
# After making your changes, in the repo root:
pnpm changeset
# Pick the affected package(s), pick the bump level, write a one-line summary
# of the change as a release-note. The CLI writes a Markdown file to .changeset/.

# Verify what your changeset will release:
pnpm changeset:status

# Commit the .changeset/<slug>.md file alongside the rest of your PR.
```

CI **rejects** any PR that touches a released package without an accompanying changeset. Changes scoped purely to `apps/shell` / `apps/playground`, root config, docs, or workflows do not need a changeset (those packages are listed under `ignore` in `.changeset/config.json`). For an intentionally release-noteless change to a versioned package — e.g. a typo fix in a JSDoc — use `pnpm changeset --empty` to record the deliberate decision.

### Deprecation policy

Removing a public symbol is a major bump and requires a deprecation warning in the previous major. Concretely:

1.  **Mark it `@deprecated` in JSDoc** with a one-line reason and a pointer to the replacement.
2.  **Keep the old symbol working for one full major cycle.** A symbol marked `@deprecated` in `1.x` may be removed only in `2.0.0`. Use a minor bump for the deprecation; the eventual removal is its own major changeset.
3.  **Emit a runtime warning in dev** if the deprecated symbol is called. Use `logger.warn` (from `@workspace/utils`) so the message is captured by the same plumbing as other warnings; gate it behind `import.meta.env.DEV` so production callers don't pay the cost. This is encouraged, not mandatory — type-only deprecations (e.g. a renamed type) cannot warn.
4.  **Document the deprecation** in the changeset body so it lands in the package's changelog.

Plugin authors get a one-major-cycle grace window: when the host bumps `PLUGIN_API_VERSION` major, plugins compiled against the previous major will be cleanly rejected with a "Plugin requires API major X, host provides Y" error from the loader.

### API surface drift detection (`pnpm api-check`)

The semver rules above only work if we *notice* that an API has changed. To make the visible surface mechanically observable, every contract-stable package commits a per-package report under `packages/<pkg>/etc/<pkg>.api.md`. The reports are generated by [API Extractor](https://api-extractor.com/) and look like a flattened `.d.ts` of the package's public exports.

```bash
# Regenerate reports locally after changing a public API
pnpm api-check

# Inspect what changed; if intentional, commit the updated etc/*.api.md
# alongside the rest of your PR (and add a changeset describing the bump)
git diff packages/*/etc/*.api.md
```

CI runs `pnpm api-check:ci` (note the `:ci` suffix) which compares the generated reports against the committed snapshots and **fails the PR** if they differ. Authors who intentionally change the surface regenerate, commit the diff, and ship a matching changeset; authors who didn't intend to change the surface get an immediate signal that they did.

Currently instrumented: `@workspace/plugin-system`, `@workspace/i18n`, `@workspace/ui-config`. Three other contract-stable packages (`@workspace/router`, `@workspace/query`, `@workspace/store`) need a small workspace-deps refactor before api-extractor can resolve their transitive `.ts` imports — tracked as a Phase 5 follow-up and intentionally out of scope for the initial drop.

## 📥 Submitting a Pull Request

1.  **Create a branch**: Use a descriptive name like `feat/new-upload-filter` or `fix/sidebar-overlap`.
2.  **Commit your changes**: Follow the existing commit message style (e.g., `feat: add new metadata field`).
3.  **Add a changeset** (see [Versioning](#-versioning-changesets-and-deprecations) above) for any change to a versioned package. Doc-only or shell-only changes can skip this; CI tells you which.
4.  **Regenerate API reports** with `pnpm api-check` if you intentionally changed a public surface, and commit the updated `packages/*/etc/*.api.md` files.
5.  **Validate your code**: Run `pnpm verify` (lint + types + build + unit + contract + api-check + E2E) before pushing.
6.  **Open a PR**: Use the provided template to describe your changes.

## 📄 Code of Conduct

Please be respectful and professional in all interactions. We follow the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md).

## 🛡️ Security

If you find a security vulnerability, please do NOT open a public issue. See our [Security Policy](SECURITY.md) for reporting instructions.

---

Thank you for your contribution!
