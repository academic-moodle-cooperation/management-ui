# Open follow-ups

The single committed index of every "we know about this but we're not doing it now" item across the repo. Each entry says **what it is**, **when to revisit**, and **where the inline detail lives**.

Three other tracking surfaces feed into this list — keep them all in sync if you delete or close an item:

- **Per-area lists**: [`testing.md` → Follow-ups](testing.md#follow-ups) (testing-specific items).
- **Inline `TODO:` / `FIXME:` comments** in code and config files (linked from each entry below).
- **`CONTRIBUTING.md` → Versioning** for the deprecation policy on items that need a changeset.

If you start work on a follow-up here, delete its entry in the PR that lands the fix; future archaeologists will find it via `git log`.

---

## 1. Scaffolding & community plugin distribution

### 1.1 Retire vs. extract `examples/community-plugin-template/`

The directory was originally consumed by `scripts/export-plugin-to-local.js` and `scripts/extract-module-to-plugin.mjs`, both retired in PR #126 in favour of `pnpm create-plugin`. The template's original reason for existing is gone, but it still ships a more elaborate starter (peerDependencies-shaped, multi-module-friendly) than the minimal scaffold the CLI emits today.

- **When to revisit**: Phase 6 (OSS readiness — "where do community plugins live").
- **Detail**: [`examples/community-plugin-template/EXTRACT_ME.md`](../../examples/community-plugin-template/EXTRACT_ME.md) — two end-states (retire / extract) with execution steps.
- **Tied to**: the Phase 6 publishing-strategy decision and the namespace rename.

### 1.2 External plugin POM template + Maven parent

There's no public template for "here is how an external plugin's `pom.xml` should look, and which Maven parent it inherits from". The in-tree Maven setup (`apps/shell/pom.xml` + `assemblies/management-ui-feature/`) is shell-internal.

- **When to revisit**: Phase 8 (Backend & external-plugin contract).
- **Detail**: master-plan Phase 8 entry; could be folded into a `--with-pom` flag on `pnpm create-plugin`.

---

## 2. Versioning / configuration cutover

### 2.1 Flip `llms.txt`'s legacy `pluginNamespace` references

`llms.txt` deliberately retains four references to the pre-Phase-2b `pluginNamespace` key so that AI agents still understand the legacy name when they encounter a pre-1.0 config in the wild.

- **When to revisit**: trigger is the 1.0 cut. After Phase 6 ships and the ecosystem has had a beat to migrate, drop them.
- **Detail**: [`docs/architecture/CONFIGURATION.md` → "Follow-ups owned by this repo"](../architecture/CONFIGURATION.md#follow-ups-owned-by-this-repo).

---

## 3. Linting / architectural boundaries

The full discussion lives inline in [`packages/eslint-config/base.js`](../../packages/eslint-config/base.js) under "Known limitations". Three items, all documented at the call site:

### 3.1 (b) `boundaries/root-path` workaround

Required because turbo invokes lint per-package and `process.cwd()` is each package's directory; `boundaries/root-path` re-anchors patterns at the workspace root. Removing this would require migrating to a single workspace-root eslint invocation (slower; no per-package cache).

- **When to revisit**: only if per-package CI caching becomes the bottleneck.
- **Detail**: inline in [`packages/eslint-config/base.js`](../../packages/eslint-config/base.js).

### 3.2 (c) Migrate eslint-plugin-boundaries v5 → v6 selector syntax

v6 introduced object-shaped selectors (`from: { type: "app" }`, `{{from.plugin}}`) but the schema validator currently rejects `allow:` entries written in the new `{ type, captured }` form. The plugin logs a `[boundaries][warning]` line on every run pointing at the migration guide.

- **When to revisit**: when upstream lands object-shape support for `allow:` entries. Watch [github.com/javierbrea/eslint-plugin-boundaries](https://github.com/javierbrea/eslint-plugin-boundaries) releases.
- **Detail**: inline in [`packages/eslint-config/base.js`](../../packages/eslint-config/base.js).

### 3.3 (d) Workspace-specifier cross-plugin import detection

`import "../../<other-plugin>/..."` is caught today. `import "@oc-mui/plugin-<other>"` is not — the boundaries plugin follows the resolver but our pnpm symlinks aren't traversed in a way the rule can match against the `plugins/<name>` element pattern.

- **When to revisit**: when a real cross-plugin workspace-specifier slip happens, or as a planned hardening pass.
- **Suggested fix**: experiment with `eslint-import-resolver-typescript` config; fall back to a belt-and-suspenders `no-restricted-imports` rule against `@oc-mui/plugin-*` from inside plugin sources.
- **Detail**: inline in [`packages/eslint-config/base.js`](../../packages/eslint-config/base.js).

### 3.4 Layer ordering inside `package → package`

Today the boundaries rule allows any `package` to import from any other `package`. The intended layered dependency story (core → foundation → integration → application) per [`docs/architecture/overview.md`](../architecture/overview.md) is enforced by convention only.

- **When to revisit**: after Phase 6 namespace rename; mechanising this needs the same boundaries-elements infrastructure with `capture` rules to express layer order.
- **Detail**: comment block in [`packages/eslint-config/base.js`](../../packages/eslint-config/base.js).

---

## 4. API Extractor

### 4.1 TSDoc warnings in `@oc-mui/plugin-system` (and elsewhere)

`api-extractor run` emits non-blocking warnings for TSDoc tags like `@default`, `@param`, and `}` characters that aren't escaped (`tsdoc-malformed-inline-tag`). They're not errors and don't fail CI, but they clutter the output.

- **When to revisit**: a quiet hour, or as part of a doc-quality pass before publishing.
- **Detail**: warnings appear in any `pnpm api-check` run.

---

## 5. Backend & external-plugin runtime contract (Phase 8)

Three items added to the master plan after Phase 7. None has been started; all need the Phase 6 publishing model in place first.

### 5.1 GraphQL namespace convention

Plugins should namespace their GraphQL operations (`mui:` for core, `<org>:` for org plugins). Today `@oc-mui/query` wraps GraphQL but doesn't policy-check operation names.

- **When to revisit**: Phase 8.
- **Suggested form**: a new section in [`CONTRACTS.md`](../architecture/CONTRACTS.md) plus an ESLint rule (custom AST walker or regex-based `no-restricted-syntax`) in `@oc-mui/eslint-config/base.js`.

### 5.2 External plugin POM template + Maven parent

See [1.2](#12-external-plugin-pom-template--maven-parent) above.

### 5.3 Shared-npm-deps version-locking

`peerDependencies` declares ranges (`"react": "^18.0.0 || ^19.0.0"`) but doesn't enforce that JAR plugins bundle the *same* React major as the host. Two Reacts in one bundle = React context breaks, hooks become inconsistent.

- **When to revisit**: Phase 8.
- **Suggested form**: a "Shared Runtime Dependencies" section in `CONTRACTS.md`; optionally a load-time check in [`apps/shell/src/services/jarPluginLoader.ts`](../../apps/shell/src/services/jarPluginLoader.ts) (mirrors `checkApiVersionCompatibility`).

---

## 6. Testing

Self-contained in [`testing.md` → Follow-ups](testing.md#follow-ups). Items there:

1. Contract tests for the remaining plugins (✅ done in PR #114, list can be dropped from TESTING.md as part of Phase 3).
2. E2E suites per feature (upload-flow, series-flow, episodes-flow, marketplace-activation).
3. Coverage baseline + thresholds.
4. Playground-as-isolated-plugin-runner.
5. Marketplace metadata cleanup (move from hard-coded map to `extensionPoints` manifest).
6. Visual regression (Phase 4b).
7. Remote turbo cache to share artefacts across CI jobs.

---

## 7. Out-of-scope-by-design

These showed up during phase work and are explicitly **not** going to be fixed in this codebase. They live somewhere else's lifecycle.

### 7.1 `.local-plugins/*` repos must update their own dependency identifiers

Each `.local-plugins/<org>/` is its own git repository (gitignored from this monorepo). Two repo-internal updates land on those repos as a consequence of work that's already merged here:

- **Phase 6b namespace rename — urgent.** Every `package.json` `dependencies` / `devDependencies` entry that references `@workspace/<name>` must be rewritten to `@oc-mui/<name>`, plus every import statement. Once an org pulls Management UI past PR #130, `pnpm install` from inside their `.local-plugins/<org>/` repo will fail until they rename — the main repo no longer publishes `@workspace/*` workspace identifiers. The same rewrite the main repo took works there too: `rg --hidden -l "@workspace/" | xargs perl -pi -e 's|\@workspace/|\@oc-mui/|g'`.
- **Phase 2b `pluginNamespace` cutover — graceful.** Older configs that still use the `pluginNamespace` key keep working only because the shell silently ignores the field; they're not surfacing as an error, but they're also not effective. Migrate at leisure to the `app.enabledPlugins` + `config.plugins[id].enabled` split documented in [`docs/architecture/CONFIGURATION.md`](../architecture/CONFIGURATION.md).

Both updates are explicitly out of scope for the main repo — each org owns the rename in its own repo and on its own timeline.

### 7.2 `[boundaries][warning]` stderr lines

Not eslint warnings, don't trip `--max-warnings 0`. Will disappear naturally when [3.2](#32-migrate-eslint-plugin-boundaries-v5--v6-selector-syntax) is resolved upstream.

---

## 8. Doc cleanup spillover from PR-3a

PR-3a restructured `docs/` from 40 files to 20, rewrote the plugin-author and operations docs, and replaced `AI_DEVELOPMENT_GUIDE.md` with `architecture/overview.md`. Two pockets weren't touched and still reference removed paths internally; the references are inside files that are themselves on a retirement path, so they were left for the dedicated follow-up rather than patched in place.

### 8.1 `docs/workflows/ADDING_APPS.md` + `ADDING_PACKAGES.md`

The two surviving workflow docs (~1.4k lines combined) are written for a contributor adding a new top-level app or package. They still link to deleted docs (`COUPLING_ANALYSIS.md`, `templates/PACKAGE_README_TEMPLATE.md`, `AI_DEVELOPMENT_GUIDE.md`). They're not broken — adding a top-level app or package is rare and the existing prose still describes the operation — but the references are dangling. They're also excluded from the VitePress site (PR-3c) for the same reason — they shouldn't be public-facing until rewritten.

- **When to revisit**: small standalone PR. Consolidate both into a single `docs/operations/extending-the-workspace.md` (~150 lines, two sections) or shrink in place. Once they're in shape, drop them from `docs/.vitepress/config.mts`'s `srcExclude` list and add them to the Operations sidebar.

### 8.2 `examples/community-plugin-template/`

The leftover template directory (`AVAILABLE_PACKAGES.md`, `README.md`, etc.) still references `COMMUNITY_PLUGIN_DEVELOPMENT.md` etc. Already tracked in [1.1](#11-retire-vs-extract-examplescommunity-plugin-template) — when that decision is executed (retire or extract), the references go with it.

### 8.3 Flip docs deploy from manual to on-push

[`/.github/workflows/docs.yml`](../../.github/workflows/docs.yml) currently runs the build on every PR (so reviewers see the build pass) and deploys only via `workflow_dispatch`. The `push` trigger to `release/oss-1.0` is in place but commented out, so the live site doesn't auto-update yet.

- **When to revisit**: alongside Phase 6d (the `access: "restricted" → "public"` npm-publish flip). Once everything has been verified on the test server and the plan is finished, uncomment the `push:` block in `docs.yml` so merges to `release/oss-1.0` keep the live site fresh.
- **First-time enablement on GitHub**: when you're ready, enable GitHub Pages in the repo settings under **Settings → Pages**, source: **GitHub Actions** (not "Deploy from a branch"). The workflow's `actions/deploy-pages` step needs that to be set, otherwise it errors out.

### 8.4 Source-link rewriting is heuristic-based

[`docs/.vitepress/config.mts`](../../docs/.vitepress/config.mts)'s `rewriteRepoLink` rewrites `../foo/bar` links to GitHub permalinks unless the first path segment is one of a hardcoded list of docs subdirectories (`architecture`, `getting-started`, `operations`, `plugins`, `reference`, `workflows`). If a new top-level docs directory is added without updating that list, links into it from sibling docs will incorrectly point at GitHub.

- **When to revisit**: if/when a new top-level docs section is added. Update `DOCS_SUBDIRS` in the same PR.
- **Suggested alternative**: replace the whitelist with a build-time check of the actual filesystem (list immediate `docs/*` subdirs). Low priority — the current list is short and easy to keep in sync.
