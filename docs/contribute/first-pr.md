# Your first pull request

For contributors to this repo. Afterwards you'll have a change, a green gate, a changeset, and an open pull request.

A working checkout first: [Set up the repo](./setup.md). New to the codebase? [Architecture](../architecture/overview.md) is the tour, [`AGENTS.md`](../../AGENTS.md) the operational rules — written for AI agents, equally useful as a human pre-flight checklist.

## 1. Find something to work on

Bugs and features go through the issue templates ([file a bug](https://github.com/academic-moodle-cooperation/management-ui/issues/new?template=bug_report.yml), [request a feature](https://github.com/academic-moodle-cooperation/management-ui/issues/new?template=feature_request.yml)) — blank issues are disabled. Authoring questions and design debates belong in [Discussions](https://github.com/academic-moodle-cooperation/management-ui/discussions); vulnerabilities go through [`SECURITY.md`](../../SECURITY.md) and never into a public issue. Building something for one organization — a branded theme, an LMS integration, a custom upload flow — is a plugin rather than a change here: start at [Extend it](../extend/index.md), and file the missing extension point or unclear contract as an issue anyway.

## 2. Make the change

Branch off `develop` with a descriptive name (`fix/sidebar-overlap`, `feat/upload-resume`, `docs/configure-clarify`). No push rights? Fork, add this repo as your `upstream` remote, and read `upstream/develop` wherever this page says `origin/develop`.

TypeScript is strict — avoid `any`, and justify a genuine escape hatch in a comment at the call site. Generated files are committed and never hand-edited; regenerate them instead: GraphQL codegen output ([`packages/query/README.md`](../../packages/query/README.md#code-generation), only when the schema itself changes), the `etc/*.api.md` reports (`pnpm api-check`), and the changelogs (owned by the release tooling). Plugin work follows the [`AGENTS.md`](../../AGENTS.md) rules; which test tier covers what is [Testing](../operations/testing.md).

## 3. Pass the gate

`pnpm verify` is the canonical pre-push gate and mirrors CI; its steps are listed once in [AGENTS.md → Pre-push gate](../../AGENTS.md#pre-push-gate--pnpm-verify). Green locally means green in CI, modulo cold-start E2E flakes that Playwright retries.

## 4. Add a changeset

Every change to a versioned package needs a **committed** changeset — the rule and its only exemptions live in [AGENTS.md → Versioning](../../AGENTS.md#versioning--changesets-every-versioned-package-and-public-api-changes). Here is the whole thing for a one-package bug fix:

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

Patch, minor, or major? [Picking the bump level](../operations/release.md#picking-the-bump-level) has the criteria. The CLI writes a small Markdown file under `.changeset/` — package name, bump level, and that summary, which becomes the package's changelog entry, so write it for the consumer rather than for the reviewer. **Now commit that file.** CI runs `changeset status` against the committed tree, so an unstaged changeset does not count — the classic "I added it but CI still says none found" trap:

```bash
git add .changeset/<slug>.md <your changed files>   # the changeset AND the change
git commit -m "fix(utils): tolerate non-ISO durations"
pnpm changeset status --since=origin/develop   # green = every changed package covered
```

Match `--since` to your PR's base branch. Nothing worth a release note? `pnpm changeset --empty` records that decision and satisfies both the CI gate and the self-check. Touched a public `@oc-mui/*` surface? Commit the regenerated [API report](../operations/release.md#api-surface-drift-detection) alongside, and never remove a public symbol without walking the [deprecation policy](../operations/release.md#deprecations) first.

## 5. Open the PR

Target **`develop`** — unless you're fixing a bug in an already-released line, where the PR goes to the oldest affected `r/NN.x` branch and is forward-merged from there; the [branching model](../operations/release.md#branching-model) explains the checkbox in the template. The [PR template](../../.github/pull_request_template.md) is the review checklist made explicit: gate green, changeset committed, API reports regenerated where a public surface moved, and docs your change makes stale fixed in the same PR. Commits: short imperative first line, conventional prefixes (`feat`, `fix`, `docs`, …) encouraged but not enforced.

Review reads the change against the contracts, not just against the diff. Unsure about a bump level, a changeset wording, or whether you moved a frozen contract? Open the PR as a **draft** and ask — the [contracts](../architecture/CONTRACTS.md) are public commitments, so over-discussing beats a silent break. Stacking on another open PR is fine: link the parent, GitHub retargets when it merges.

## If you're only changing docs

- **The lightest path in.** Every site page has an **Edit this page on GitHub** link that opens the editor on `develop` and forks for you; anything bigger than a paragraph is a normal branch.
- **Where they live.** `docs/` is the source of the site, and the sidebar in [`docs/.vitepress/config.mts`](../../docs/.vitepress/config.mts) is the only table of contents. Root files and package READMEs are GitHub-rendered markdown, not site pages.
- **Two conventions.** A page opens with a two-line header — `# Title`, then "For \<audience\>. Afterwards you'll \<outcome\>." And every fact has exactly one home: link to the owner (a page, or a file like `package.json` for version numbers) instead of restating it. `pnpm docs:ownership` enforces that for the drift-prone ones; `pnpm docs:lint` and `pnpm docs:build` are the other two local checks.
- **What CI runs.** The [docs fast path](../operations/ci.md#changes-that-skip-ci-gates), not the full gate. Docs need no changeset — but a README *inside* `packages/*` or `plugins/*` is part of a versioned package and does.
