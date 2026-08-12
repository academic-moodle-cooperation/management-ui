# Contributing to Management UI

For contributors to this repo. Afterwards you'll know the dev loop, the changeset rule, and what CI will demand — everything to land your first PR.

This page tells the contributor path in the order you'll walk it: set up → find work → make the change → pass the gate → add a changeset → open the PR.

## 1. Set up

Clone, install, and run the shell with the [README's Quick start](README.md#quick-start); the full development setup — backend wiring, stubbed endpoints, troubleshooting — is [Run from source](docs/getting-started/installation.md).

Toolchain notes:

- **Node and pnpm** versions are pinned in the root [`package.json`](package.json) (`engines` and `packageManager`); `corepack enable` picks the right pnpm automatically. Docs never restate the numbers — `package.json` is the single source.
- **Java + Maven** are needed only to build the deployable JAR. Pure frontend work doesn't need them.
- **Playwright browsers** — first time only, `pnpm test:e2e:install` downloads the Chromium build the E2E suite drives.

New to the codebase? Read [`docs/architecture/overview.md`](docs/architecture/overview.md) (the tour) and [`AGENTS.md`](AGENTS.md) (the operational rules — written for AI agents, equally useful as a human pre-flight checklist).

## 2. Find something to work on

Bugs and features use the issue templates ([file a bug](https://github.com/academic-moodle-cooperation/management-ui/issues/new?template=bug_report.yml), [request a feature](https://github.com/academic-moodle-cooperation/management-ui/issues/new?template=feature_request.yml)); blank issues are disabled. Plugin-authoring questions and design discussions go to [Discussions](https://github.com/academic-moodle-cooperation/management-ui/discussions). Security vulnerabilities go through [`SECURITY.md`](SECURITY.md) — never a public issue.

There are two contribution paths — make sure you're on the right one:

| You want to… | Then |
|---|---|
| Fix or extend the core — shell, `packages/*`, a built-in plugin under `plugins/` | Keep reading; this page is your path. |
| Build something specific to your organisation — a branded theme, an LMS integration, a custom upload flow | It doesn't belong in this repo. Start at [Your first plugin](docs/plugins/first-plugin.md); [Distribution](docs/plugins/distribution.md) covers shipping it as a JAR or remote module. Issues here about missing extension points or unclear contracts are very welcome. |

## 3. Make the change

Branch off `develop` with a descriptive name (`fix/sidebar-overlap`, `feat/upload-resume`, `docs/configuration-clarify`); no push rights to this repo? Fork first, add this repo as the `upstream` remote, and self-check later with `--since=upstream/develop`. Then iterate:

```bash
pnpm dev                                            # shell with hot reload
pnpm --filter @oc-mui/<package> test                # unit tests for one package
pnpm --filter @oc-mui/plugin-<name> test:contract   # one plugin's contract test
pnpm test:e2e:ui                                    # Playwright in interactive mode
pnpm lint && pnpm format                            # ESLint (incl. boundary rules) + Prettier
```

Where the tests live and what each layer covers (unit / contract / E2E): [`docs/operations/testing.md`](docs/operations/testing.md). Anything touching a plugin follows the [AGENTS.md](AGENTS.md) rules — plugin layout, import boundaries, the required contract test. TypeScript is strict; avoid `any`, and document any genuine escape hatch in a comment at the call site.

Generated files are committed — never hand-edit them, regenerate instead: GraphQL codegen output (see [`packages/query/README.md` → Code generation](packages/query/README.md#code-generation); only needed when the schema itself changes), `etc/*.api.md` API reports (`pnpm api-check`), and changelogs (owned by the release tooling).

## 4. Pass the gate

```bash
pnpm verify
```

That single command is the canonical pre-push gate and mirrors CI — the step list lives in [AGENTS.md → Pre-push gate](AGENTS.md#pre-push-gate--pnpm-verify). Green locally means green in CI, modulo cold-start E2E flakes that Playwright retries automatically.

<a id="versioning-changesets-and-deprecations"></a>

## 5. Add a changeset

Any change to a versioned package — every package under `packages/*` and `plugins/*`, **private ones included** — needs a committed [changeset](https://github.com/changesets/changesets). The authoritative rule and its only exemptions live in [AGENTS.md → Versioning](AGENTS.md#versioning--changesets-every-versioned-package-and-public-api-changes); docs, `.github/`, and root-config changes touch no package and need none. Here is the whole workflow for a one-package bug fix:

```console
$ pnpm changeset
🦋  Which packages would you like to include? · @oc-mui/utils
🦋  Which packages should have a major bump? · No items were selected
🦋  Which packages should have a minor bump? · No items were selected
🦋  The following packages will be patch bumped:
🦋  @oc-mui/utils
🦋  Please enter a summary for this change (this will be in the changelogs).
🦋  Summary · parseDuration no longer throws on non-ISO input
🦋  Is this your desired changeset? (Y/n) · true
🦋  Changeset added! - you can now commit it
```

Unsure whether that's a patch, minor, or major? [Picking the bump level](docs/operations/release.md#picking-the-bump-level) has the criteria. The CLI wrote a small Markdown file under `.changeset/` — the summary becomes the package's changelog entry, so write it for the consumer, not for the reviewer:

```markdown
---
"@oc-mui/utils": patch
---

parseDuration no longer throws on non-ISO input
```

**Commit that file.** CI runs `changeset status` against the committed tree, so an uncommitted changeset does not count — the classic "I added it but CI still says no changesets found" trap:

```bash
git add .changeset/<slug>.md
git commit -m "fix(utils): tolerate non-ISO durations"
```

Self-check before pushing — green output means every changed versioned package is covered (match `--since` to your PR's base branch):

```bash
pnpm changeset status --since=origin/develop
```

Three follow-on rules, each one sentence here and detailed in [Releases & versioning](docs/operations/release.md):

- A deliberately release-noteless change to a versioned package still needs a changeset — record the decision with `pnpm changeset --empty`. The empty changeset satisfies both the CI check and the `changeset status` self-check, even though it names no package.
- If you changed a public `@oc-mui/*` API surface, run `pnpm api-check` and commit the regenerated `etc/<pkg>.api.md` alongside the changeset ([API surface drift detection](docs/operations/release.md#api-surface-drift-detection)).
- Removing or renaming a public symbol follows the [deprecation policy](docs/operations/release.md#deprecations): `@deprecated` in one major, removal only in the next.

## 6. Open the PR

Target **`develop`** — unless you're fixing a bug in a released line, in which case the PR targets the **oldest affected `r/NN.x` branch** and the fix is forward-merged toward `develop`. [Releases & versioning → Branching model](docs/operations/release.md#branching-model) explains the model behind that checkbox in the PR template.

The [PR template](.github/pull_request_template.md) is the review checklist made explicit: `pnpm verify` green, changeset committed, API reports regenerated if a public surface changed, and **docs your change makes stale fixed in the same PR** (an [AGENTS.md](AGENTS.md) rule, not a nicety). Commits: short imperative first line; conventional-commit prefixes (`feat`, `fix`, `docs`, …) are encouraged, not enforced.

In doubt about the bump level, the changeset wording, or whether a frozen contract changed? Open the PR as a **draft** and ask — the contracts in [`docs/architecture/CONTRACTS.md`](docs/architecture/CONTRACTS.md) are public commitments, so over-discussing beats a silent break. Stacking on another open PR is fine: link the parent, GitHub retargets when it merges.

## Editing the docs

Docs contributions are the lightest path into the repo — typo to merged PR without ever cloning:

- **Where docs live.** [`docs/`](docs/README.md) is the source of the docs site; the sidebar in [`docs/.vitepress/config.mts`](docs/.vitepress/config.mts) is the *only* table of contents. Root files (this one, [`README.md`](README.md), [`AGENTS.md`](AGENTS.md), package READMEs) are GitHub-rendered markdown, not part of the site.
- **The loop.** Every site page has an **Edit this page on GitHub** link that opens GitHub's editor directly on `develop`; GitHub forks and opens the PR for you. For anything bigger than a paragraph, a normal clone-and-branch works the same — target `develop` either way.
- **What CI runs on a docs-only PR.** The fast path only ([`docs.yml`](.github/workflows/docs.yml)): site build, markdown lint (`pnpm docs:lint` locally; rules in [`.markdownlint.jsonc`](.markdownlint.jsonc)), and an offline check of repo-internal links ([`lychee`](lychee.toml) — a Rust binary, so CI-only unless you `brew install lychee`). The full `pnpm verify` gate does **not** run — [`test.yml`](.github/workflows/test.yml) skips PRs that touch only `docs/**` and `*.md` files.
- **No changeset needed** — docs aren't a versioned package ([the rule and its scope](AGENTS.md#versioning--changesets-every-versioned-package-and-public-api-changes)). Exception: a README *inside* `packages/*` or `plugins/*` is part of a versioned package and does need one.
- **Two conventions.** Pages open with a two-line header — `# Title`, then one paragraph: "For \<audience\>. Afterwards you'll know \<outcome\>." And facts live in exactly one place: link to the owning page (or file, like `package.json` for version numbers) instead of restating, so the copy can't drift.

---

We follow the [Contributor Covenant](CODE_OF_CONDUCT.md). Vulnerabilities go through [`SECURITY.md`](SECURITY.md). Docs render as the [docs site](https://academic-moodle-cooperation.github.io/management-ui/), built from [`docs/`](docs/README.md).

Thank you for contributing to Management UI.
