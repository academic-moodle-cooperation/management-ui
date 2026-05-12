# Open follow-ups

The single committed index of every "we know about this but we're not doing it now" item across the repo. Each entry says **what it is**, **when to revisit**, and **where the inline detail lives**.

Three other tracking surfaces feed into this list — keep them all in sync if you delete or close an item:

- **Per-area lists**: [`docs/TESTING.md` → Follow-ups](TESTING.md#follow-ups) (testing-specific items).
- **Inline `TODO:` / `FIXME:` comments** in code and config files (linked from each entry below).
- **`CONTRIBUTING.md` → Versioning** for the deprecation policy on items that need a changeset.

If you start work on a follow-up here, delete its entry in the PR that lands the fix; future archaeologists will find it via `git log`.

---

## 1. Scaffolding & community plugin distribution

### 1.1 Retire vs. extract `examples/community-plugin-template/`

The directory was originally consumed by `scripts/export-plugin-to-local.js` and `scripts/extract-module-to-plugin.mjs`, both retired in PR #126 in favour of `pnpm create-plugin`. The template's original reason for existing is gone, but it still ships a more elaborate starter (peerDependencies-shaped, multi-module-friendly) than the minimal scaffold the CLI emits today.

- **When to revisit**: Phase 6 (OSS readiness — "where do community plugins live").
- **Detail**: [`examples/community-plugin-template/EXTRACT_ME.md`](../examples/community-plugin-template/EXTRACT_ME.md) — two end-states (retire / extract) with execution steps.
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
- **Detail**: [`docs/architecture/CONFIGURATION.md` → "Follow-ups owned by this repo"](architecture/CONFIGURATION.md#follow-ups-owned-by-this-repo).

---

## 3. Linting / architectural boundaries

The full discussion lives inline in [`packages/eslint-config/base.js`](../packages/eslint-config/base.js) under "Known limitations". Three items, all documented at the call site:

### 3.1 (b) `boundaries/root-path` workaround

Required because turbo invokes lint per-package and `process.cwd()` is each package's directory; `boundaries/root-path` re-anchors patterns at the workspace root. Removing this would require migrating to a single workspace-root eslint invocation (slower; no per-package cache).

- **When to revisit**: only if per-package CI caching becomes the bottleneck.
- **Detail**: inline in [`packages/eslint-config/base.js`](../packages/eslint-config/base.js).

### 3.2 (c) Migrate eslint-plugin-boundaries v5 → v6 selector syntax

v6 introduced object-shaped selectors (`from: { type: "app" }`, `{{from.plugin}}`) but the schema validator currently rejects `allow:` entries written in the new `{ type, captured }` form. The plugin logs a `[boundaries][warning]` line on every run pointing at the migration guide.

- **When to revisit**: when upstream lands object-shape support for `allow:` entries. Watch [github.com/javierbrea/eslint-plugin-boundaries](https://github.com/javierbrea/eslint-plugin-boundaries) releases.
- **Detail**: inline in [`packages/eslint-config/base.js`](../packages/eslint-config/base.js).

### 3.3 (d) Workspace-specifier cross-plugin import detection

`import "../../<other-plugin>/..."` is caught today. `import "@oc-mui/plugin-<other>"` is not — the boundaries plugin follows the resolver but our pnpm symlinks aren't traversed in a way the rule can match against the `plugins/<name>` element pattern.

- **When to revisit**: when a real cross-plugin workspace-specifier slip happens, or as a planned hardening pass.
- **Suggested fix**: experiment with `eslint-import-resolver-typescript` config; fall back to a belt-and-suspenders `no-restricted-imports` rule against `@oc-mui/plugin-*` from inside plugin sources.
- **Detail**: inline in [`packages/eslint-config/base.js`](../packages/eslint-config/base.js).

### 3.4 Layer ordering inside `package → package`

Today the boundaries rule allows any `package` to import from any other `package`. The intended layered dependency story (core → foundation → integration → application) per [`docs/AI_DEVELOPMENT_GUIDE.md`](AI_DEVELOPMENT_GUIDE.md) is enforced by convention only.

- **When to revisit**: after Phase 6 namespace rename; mechanising this needs the same boundaries-elements infrastructure with `capture` rules to express layer order.
- **Detail**: comment block in [`packages/eslint-config/base.js`](../packages/eslint-config/base.js).

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
- **Suggested form**: a new section in [`CONTRACTS.md`](architecture/CONTRACTS.md) plus an ESLint rule (custom AST walker or regex-based `no-restricted-syntax`) in `@oc-mui/eslint-config/base.js`.

### 5.2 External plugin POM template + Maven parent

See [1.2](#12-external-plugin-pom-template--maven-parent) above.

### 5.3 Shared-npm-deps version-locking

`peerDependencies` declares ranges (`"react": "^18.0.0 || ^19.0.0"`) but doesn't enforce that JAR plugins bundle the *same* React major as the host. Two Reacts in one bundle = React context breaks, hooks become inconsistent.

- **When to revisit**: Phase 8.
- **Suggested form**: a "Shared Runtime Dependencies" section in `CONTRACTS.md`; optionally a load-time check in [`apps/shell/src/services/jarPluginLoader.ts`](../apps/shell/src/services/jarPluginLoader.ts) (mirrors `checkApiVersionCompatibility`).

---

## 6. Testing

Self-contained in [`docs/TESTING.md` → Follow-ups](TESTING.md#follow-ups). Items there:

1. Contract tests for the remaining plugins (✅ done in PR #114, list can be dropped from TESTING.md as part of Phase 3).
2. E2E suites per feature (upload-flow, series-flow, episodes-flow, marketplace-activation).
3. Coverage baseline + thresholds.
4. Playground-as-isolated-plugin-runner.
5. Marketplace metadata cleanup (move from hard-coded map to `extensionPoints` manifest).
6. Visual regression (Phase 4b).
7. Remote turbo cache to share artefacts across CI jobs.

---

## 7. Out-of-scope-by-design

These showed up during phase work and are explicitly **not** going to be fixed in this codebase:

- **`.local-plugins/*` content drift**: the gitignored submodule has its own lifecycle; references to the old `pluginNamespace` key in those plugins are tracked separately by whoever owns the `.local-plugins/` repo.
- **The `[boundaries][warning]` stderr lines**: not eslint warnings, don't trip `--max-warnings 0`. Will disappear naturally when [3.2](#32-migrate-eslint-plugin-boundaries-v5--v6-selector-syntax) is resolved upstream.
