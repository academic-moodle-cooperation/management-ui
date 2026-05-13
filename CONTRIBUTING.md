# Contributing to Management UI

Management UI is the plugin-based React/TypeScript management front-end for [Opencast](https://opencast.org/). It ships as a single Karaf-deployable JAR (frontend assets + a small backend bundle) and supports both built-in features and university- or organisation-specific extensions written as plugins.

Two kinds of changes land in this repo:

1. **Core changes** — work on the shell, the shared packages, or one of the built-in plugins under `plugins/`. These ship with every Management UI release.
2. **Tooling and docs** — improvements to the developer experience (`AGENTS.md`, `docs/`, CI, scaffolding scripts, etc.).

If your contribution is a **plugin that's specific to your organisation**, it should *not* live in this repo. See [Path B](#path-b-write-an-organisation-or-community-plugin) below.

---

## Getting started

### Prerequisites

- **Node.js** ≥ 20 (Node 22 LTS recommended)
- **pnpm** ≥ 10.4.1 (run `corepack enable` to install via Corepack)
- **Java** + **Maven** — only if you want to build the deployable JAR; pure frontend work doesn't need them

### Initial setup

```bash
git clone https://github.com/academic-moodle-cooperation/management-tool.git
cd management-tool
pnpm install
pnpm build              # one-time: populates dist-types/ for upstream packages
pnpm dev                # http://127.0.0.1:3000/management-ui/
```

If you're new to the codebase, read [`AGENTS.md`](AGENTS.md) (operational rules for plugin work) and [`docs/AI_DEVELOPMENT_GUIDE.md`](docs/AI_DEVELOPMENT_GUIDE.md) (architecture + package layers) before opening your first PR.

---

## Picking your contribution path

### Path A: Fix a bug or add a feature to the core

You'll be working in `apps/shell`, `apps/playground`, `packages/*`, or one of the in-repo plugins under `plugins/core-*`, `plugins/admin-marketplace`, or `plugins/example`.

1. Read [`AGENTS.md`](AGENTS.md) for the operational rules (boundaries, extension points, contract tests).
2. Make your change.
3. Run `pnpm verify` locally — it runs the same gates CI runs, in order: lint → check-types → build → unit → contract → api-check → Playwright smoke. If `pnpm verify` is green locally, CI will be too (modulo cold-start E2E flakes that retry).
4. Add a changeset if you touched a versioned package — see [Versioning, changesets, and deprecations](#versioning-changesets-and-deprecations).
5. Regenerate API reports if you changed a public surface — `pnpm api-check`, then commit the updated `packages/*/etc/*.api.md`.
6. Open a PR using the [template](.github/pull_request_template.md). CI tells you what's missing.

### Path B: Write an organisation or community plugin

If you're building something that's specific to your university or organisation (a custom upload flow, an institution-branded theme, an LMS integration), your plugin does **not** belong in this repo. Instead:

1. Scaffold a fresh plugin: `pnpm create-plugin my-plugin` writes a fully-wired starter under `.local-plugins/my-plugin/` (gitignored from this repo, lives in your own git repo).
2. Move it into your own organisation repo when ready.
3. Distribute it as one of:
   - A **JAR** dropped into the Karaf deploy folder (the same shape Management UI itself ships as), or
   - A **remote ES module** loaded by the Admin Marketplace from a registry / CDN.

[`AGENTS.md`](AGENTS.md) → "Boundaries" lists the contracts your plugin must obey (no cross-plugin imports, no `apps/*` imports, no direct use of wrapped libraries like `@tanstack/react-router`). [`docs/COMMUNITY_PLUGIN_DEVELOPMENT.md`](docs/COMMUNITY_PLUGIN_DEVELOPMENT.md) walks through the full plugin lifecycle.

You generally don't open PRs against *this* repo for plugin work — but you're welcome to open issues for missing extension points, unclear contracts, or scaffolding bugs.

---

## Architecture, in one screen

```
apps/
├── shell/         Main Vite-built app: layout, routing, plugin loader, theme runtime
└── playground/    Dev-only sandbox

packages/          Shared infrastructure, layered (lower layer never depends on higher):
├── plugin-system, store, i18n          Foundation
├── query, router, ui, …                Integration
└── app-runtime, providers, vite-config, ui-config    Application

plugins/           Built-in plugins shipped with the repo
├── core/                  Mandatory extension points + defaults
├── core-{episodes,series,upload}/    Feature plugins per /<route>
├── admin-marketplace/     Plugin + theme browser
└── example/               Minimal reference plugin

.local-plugins/    Org-specific plugin checkouts (gitignored, dev-only)
```

Cross-plugin imports, app-imports-plugin, and plugin-imports-app are **not allowed** and are enforced mechanically by `eslint-plugin-boundaries`. The single exception is `plugins/core` — every plugin may consume it because it owns the canonical extension-point identifiers (`uploadExtensionPoints`, `episodesExtensionPoints`, etc.).

Deeper material:

- [`docs/AI_DEVELOPMENT_GUIDE.md`](docs/AI_DEVELOPMENT_GUIDE.md) — package layers, plugin model, common pitfalls
- [`docs/architecture/CONTRACTS.md`](docs/architecture/CONTRACTS.md) — the four frozen contracts (Manifest 1.1, Runtime API 1.0, Theme 2.0, Config 1.0)
- [`docs/architecture/ADR-*.md`](docs/architecture/) — why the architecture is the way it is
- [`docs/TESTING.md`](docs/TESTING.md) — the test pyramid (unit / contract / E2E) and the harness API
- [`docs/OPEN_FOLLOWUPS.md`](docs/OPEN_FOLLOWUPS.md) — committed index of every "we know about this but haven't done it yet" item

---

## The development loop

```bash
pnpm verify                                              # the pre-push gate (mirrors CI exactly)

# Iterating on a single package or plugin
pnpm --filter @oc-mui/plugin-system test                # unit tests for one package
pnpm --filter @oc-mui/plugin-core-episodes test:contract # contract test for one plugin
pnpm api-check                                          # regenerate API surface snapshots
pnpm test:e2e:ui                                        # Playwright in interactive mode
pnpm dev                                                # vite dev server
```

`pnpm verify` runs `lint → check-types → build → test → test:contract → api-check → test:e2e` in dependency order. If it's green locally it's green in CI; the only flakes you'll see in CI that you don't see locally are cold-start E2E timeouts, which Playwright retries automatically.

### TypeScript

Strict mode. Avoid `any`; if you genuinely need an escape hatch, document it in a comment at the call site.

### Linting and formatting

- `pnpm lint` — ESLint with the wrapper-library rules (`@oc-mui/router` not `@tanstack/react-router` directly, etc.) and the architectural boundaries plugin
- `pnpm format` — Prettier write
- `pnpm format:check` — Prettier check (CI)

### Testing

Three layers, fully documented in [`docs/TESTING.md`](docs/TESTING.md):

- **Unit** (Vitest) — every package
- **Contract** (`@oc-mui/plugin-testing` harness) — every plugin under `plugins/` ships one `plugin.contract.test.ts`
- **E2E** (Playwright) — a smoke spec against `apps/shell` with stubbed backend endpoints

---

## Versioning, changesets, and deprecations

Every workspace package under `packages/` and `plugins/` is **versioned independently** following [Semver 2.0](https://semver.org/). The ground rules below apply to every public package; the four contracts in [`docs/architecture/CONTRACTS.md`](docs/architecture/CONTRACTS.md) layer additional, contract-specific rules on top for the explicitly-frozen API surfaces (Manifest 1.1, Runtime API 1.0, Theme 2.0, Config 1.0).

### What kind of bump?

Decide based on what the change does to the **package's public surface** — i.e. the symbols listed in its `package.json`'s `exports` field, the public types those exports re-export, and any documented runtime contract:

| Bump type | When to use |
|---|---|
| **Patch** | Internal-only refactors, performance work, doc/comment changes, bug fixes that keep the same public signature. No visible behaviour change for any consumer who treats the package as a black box. |
| **Minor** | New exports, new optional parameters, a new method on a class, a new optional field on a public type. Existing consumers remain source- and binary-compatible. |
| **Major** | A removed export, a renamed symbol, a changed signature (including a new required parameter), a behaviour change that an existing consumer would observe (e.g. an extension point's contract changes), or anything that breaks plugin-runtime API/manifest/theme/config compatibility. |

Plugin runtime API contracts have a hard rule: **anything that changes the Plugin Runtime API observable to plugin authors → major bump of `@oc-mui/plugin-system`.** The host loader rejects plugins whose declared `apiVersion` major mismatches the host's `PLUGIN_API_VERSION`.

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
3.  **Emit a runtime warning in dev** if the deprecated symbol is called. Use `logger.warn` (from `@oc-mui/utils`) so the message is captured by the same plumbing as other warnings; gate it behind `import.meta.env.DEV` so production callers don't pay the cost. This is encouraged, not mandatory — type-only deprecations (e.g. a renamed type) cannot warn.
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

Instrumented packages: `@oc-mui/plugin-system`, `@oc-mui/router`, `@oc-mui/query`, `@oc-mui/i18n`, `@oc-mui/store`, `@oc-mui/ui-config` — the six contract-stable packages declared in [`docs/architecture/CONTRACTS.md`](docs/architecture/CONTRACTS.md). The cross-package coupling visible in each report (e.g. `query`'s report imports types from `plugin-system` and `ui-config`) is intentional: when an upstream contract changes, every consumer's snapshot diff surfaces it.

---

## Filing a bug or feature request

Use the templates: [**File a bug**](https://github.com/academic-moodle-cooperation/management-tool/issues/new?template=bug_report.yml) or [**Request a feature**](https://github.com/academic-moodle-cooperation/management-tool/issues/new?template=feature_request.yml). Both templates ask for the structured information that lets us triage quickly (version/commit, repro steps, affected scope dropdown).

Blank issues are disabled. If your topic doesn't fit the bug or feature template — for example, a plugin-authoring question or a design discussion — open a thread in [Discussions](https://github.com/academic-moodle-cooperation/management-tool/discussions) instead.

**Security vulnerabilities go through a separate channel.** Do **not** file a public issue; see [`SECURITY.md`](SECURITY.md) for private vulnerability reporting.

---

## Submitting a pull request

1. **Branch name**: descriptive — `feat/upload-resume`, `fix/sidebar-overlap`, `docs/configuration-clarify`.
2. **Commits**: short imperative summary in the first line. Conventional-commit prefixes (`feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`) are encouraged but not enforced.
3. **`pnpm verify`** passes locally — this is the canonical pre-push gate.
4. **Changeset added** if your change touches a versioned package (see [Versioning](#versioning-changesets-and-deprecations) above). CI's `Changeset` job tells you which.
5. **API reports regenerated** if you intentionally changed a public surface — `pnpm api-check`, commit the updated `etc/*.api.md`. CI's `api-check` job tells you which.
6. **Open the PR** using the [provided template](.github/pull_request_template.md). It maps to the checklist above and helps reviewers focus.
7. **Stack on top of other open PRs** if your change depends on them; GitHub auto-rebases stacked PRs when the parent merges.

If you're in doubt about the bump level, the changeset wording, or whether a contract changed: open the PR as a draft and ask. The contracts in `docs/architecture/CONTRACTS.md` are deliberately strict because they're public commitments — better to over-discuss than to ship a silent break.

---

## Code of Conduct

Be respectful. We follow the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md).

## Security

Vulnerabilities go through [`SECURITY.md`](SECURITY.md), not public issues.

---

Thank you for contributing to Management UI.
