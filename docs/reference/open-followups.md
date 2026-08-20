# Open follow-ups

> **Reference — look it up, don't read it through.** Deliberately excluded from the published site; it is a tracking index for contributors, read on GitHub.

The single committed index of every "we know about this but we're not doing it now" item across the repo. Each entry says **what it is**, **when to revisit**, and **where the inline detail lives**.

Three other tracking surfaces feed into this list — keep them all in sync if you delete or close an item:

- **Per-area lists**: [`testing.md` → Follow-ups](../contribute/testing.md#follow-ups) (testing-specific items).
- **Inline `TODO:` / `FIXME:` comments** in code and config files (linked from each entry below).
- **[Releases & versioning → Deprecations](../contribute/release.md#deprecations)** for the deprecation policy on items that need a changeset.

If you start work on a follow-up here, delete its entry in the PR that lands the fix; future archaeologists will find it via `git log`.

---

## 1. Scaffolding & community plugin distribution

### 1.1 ✅ Done — `examples/community-plugin-template/` retired

The directory was originally consumed by `scripts/export-plugin-to-local.js` and `scripts/extract-module-to-plugin.mjs`, both retired in PR #126 in favour of `pnpm create-plugin`. With Phase 8.5.2 shipping the canonical Maven scaffold under `scripts/templates/create-plugin-maven/` (consumed by the default `pnpm create-plugin <name>` flow), the example directory had nothing left to teach and was deleted in the same PR.

### 1.2 ✅ Done — external plugin POM template

Shipped in Phase 8.5.2. `pnpm create-plugin <name>` now scaffolds a `backend/pom.xml` by default (skip with `--no-pom`); the template inherits from `org.opencastproject:base:20-SNAPSHOT` and produces a deployable Opencast JAR via `mvn package`. Full how-to in [`docs/extend/distribution.md`](../extend/distribution.md#path-3--jar-production). The future option of publishing a dedicated `management-ui-plugin-parent` POM (Option B from the design discussion) is tracked in §1.3 below.

### 1.3 (Maybe) publish a `management-ui-plugin-parent` POM

Today the scaffolded plugin POM inherits from `org.opencastproject:base` directly and declares its own `frontend-maven-plugin`, `maven-resources-plugin`, and OSGi defaults inline. If a non-trivial number of external plugins start shipping and end up duplicating the same POM scaffolding, it's worth publishing a `org.amc.management:management-ui-plugin-parent` artifact that plugins inherit from instead, moving the shared defaults into the parent.

- **When to revisit**: when we see 5+ external plugin POMs in the wild and notice consistent duplication of the same `<build>` config. Or when the scaffold needs a default that's awkward to update across all consumers (e.g. a Node version bump).
- **Effort estimate**: ~1 day to publish the parent once the artifact destination is decided (e.g. Maven Central or a private Maven registry). Each existing plugin needs a one-stanza `<parent>` swap to consume it.
- **Cost ramp**: cheap before any external plugins exist (we just announce "switch your `<parent>` block"); rises with every plugin published on the old parent.
- **Detail**: design discussion captured in the Phase 8.5.2 PR description.

---

## 2. Versioning / configuration cutover

### 2.1 ✅ Done — `llms.txt`'s legacy `pluginNamespace` references dropped

`llms.txt` deliberately retained references to the pre-Phase-2b `pluginNamespace` key so that AI agents would still understand the legacy name in pre-1.0 configs. Verified 2026-08-12: `llms.txt` contains zero `pluginNamespace` references — the cleanup already happened.

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

Today the boundaries rule allows any `package` to import from any other `package`. The intended layered dependency story (core → foundation → integration → application) per [`docs/reference/architecture.md`](./architecture.md) is enforced by convention only.

- **When to revisit**: after Phase 6 namespace rename; mechanising this needs the same boundaries-elements infrastructure with `capture` rules to express layer order.
- **Detail**: comment block in [`packages/eslint-config/base.js`](../../packages/eslint-config/base.js).

### 3.5 ✅ `@oc-mui/ui` is now router-free — residual: optional `@oc-mui/auth` split

The `@oc-mui/ui → @oc-mui/router` inversion is **resolved** (PR #180). `@oc-mui/ui` no longer depends on `@oc-mui/router`. Two distinct fixes, by component:

- **Data table** — fully decoupled (not just DI'd). The empty state used to branch on `pathname` and hardcode app routes (`/upload`, `/episodes`, `/series`) + a `<Link>`. It now takes an additive `emptyState` prop threaded `MUITable → DataTable → DataTableBody`; the owning plugins provide it: `core-episodes/components/EpisodesEmptyState.tsx` (real `@oc-mui/router` Link) and `core-series/components/SeriesEmptyState.tsx` (keeps the `series:empty-state` `ComponentResolver` override hook). `data-table-{body,empty-state}` now hold **zero** routing/app knowledge.
- **`appshell/components/nav-main.tsx`** — keeps DI via the `UiRouterProvider` context ([`packages/ui/src/components/router-context.tsx`](../../packages/ui/src/components/router-context.tsx)), which the shell fills with `@oc-mui/router`'s `Link` + a `useRouterState`-derived pathname (plain-`<a>` / empty-path defaults so it still renders provider-less in tests). A nav menu intrinsically needs routing, and it leans on TanStack's `Link` for basepath-aware active matching, so component injection (à la MUI's `LinkComponent`) is the right tool — re-implementing the matching via `navigate`/`useHref` was considered and rejected (regression risk for marginal gain). This is now the **only** consumer of the context DI.

**Residual (optional, low priority):** split auth context (`AuthInitializer`, `useAuth`, `useAuthActions`) out of `@oc-mui/router` into a dedicated `@oc-mui/auth` package — purely for `@oc-mui/router`'s own internal layering. No longer blocking anything now that the cycle is broken (`@oc-mui/router` could already import `@oc-mui/ui` if it wanted, e.g. to drop the PR-#146 DI workaround in `AppProtection`).

---

## 4. API Extractor

### 4.1 ✅ Done — TSDoc warnings resolved

`api-extractor run` previously emitted non-blocking `tsdoc-malformed-inline-tag` warnings. Verified resolved: `pnpm api-check` run directly (uncached) on all six API-snapshot packages (`plugin-system`, `query`, `router`, `i18n`, `store`, `ui-config`) now reports "API Extractor completed successfully" with zero warnings.

---

## 5. Backend & external-plugin runtime contract (Phase 8)

Three items added to the master plan after Phase 7. None has been started; all need the Phase 6 publishing model in place first.

### 5.1 GraphQL operation naming

✅ **Done.** Contract shipped in PR-5.1a, ESLint enforcement shipped in PR-5.1b, all 35 legacy operations renamed in PR-5.1c. Every `query`/`mutation`/`subscription`/`fragment` declared anywhere in the workspace now carries the right PascalCase prefix; `git grep "eslint-disable-next-line local/graphql-operation-naming"` returns zero hits in source. The full contract lives at [Contracts § GraphQL Operation Naming](./contracts.md#6-graphql-operation-naming).

### 5.2 External plugin POM template + Maven parent

See [1.2](#12--done--external-plugin-pom-template) above (done) and [1.3](#13-maybe-publish-a-management-ui-plugin-parent-pom) for the parent-POM option.

### 5.3 ✅ Shared-npm-deps version-locking — wired into the loaders (residual: backend `plugins.json`)

**Status:** contract + check function shipped; loader-side enforcement now wired across all three paths. Only the JAR path's data source is residual (backend-owned).

The Shared Runtime Dependencies contract (`@oc-mui/plugin-system`'s `SHARED_RUNTIME_MAJORS`, documented in [Contracts § Shared Runtime Dependencies](./contracts.md#5-shared-runtime-dependencies)) defines which packages the host provides and what major a plugin must declare in `workspaceDependencies`. `checkSharedDependencyCompatibility` is the single source of truth; all three loader paths now funnel through it:

- ✅ **Marketplace** — `securityService.checkVersionCompatibility` ([`security.ts`](../../plugins/admin-marketplace/src/services/security.ts)) is now a thin adapter over the canonical function (the older exact-semver logic was removed). Both the install-time load gate (`remote-loader.ts`) and the UI compatibility badge (`useMarketplace`) now use canonical major-matching, so they can't diverge.
- ✅ **`.local-plugins/` dev** — the dev server surfaces each plugin's `workspaceDependencies` (read from `plugin.json`) into `/local-plugins/manifest.json` ([`local-plugins-dev.ts`](../../packages/vite-config/src/plugins/local-plugins-dev.ts)); the shell gates each entry via `passesSharedDependencyGate` ([`sharedDepsGate.ts`](../../apps/shell/src/services/sharedDepsGate.ts)) in `PluginInitializer` before loading.
- ⏳ **JAR** — the same gate is applied to backend entries, and [`jarPluginLoader.ts`](../../apps/shell/src/services/jarPluginLoader.ts) reads `workspaceDependencies` when present. **Residual:** the backend's aggregated `plugins.json` doesn't carry `workspaceDependencies` per plugin yet, so the gate is a no-op for JAR plugins until then. Chosen option (a) — backend embeds the field per plugin in `plugins.json` (forward-compatible; the shell already consumes it). The alternative (b, loader fetches `<pluginDir>/plugin.json`) remains open if the backend change is undesirable.

- **When to revisit**: the JAR residual when the backend `plugins.json` producer is next touched (Opencast-side). Everything in-repo is done.

### 5.4 Deep-link return after SSO login

The shell-native password-login form returns the user to the exact route they first requested (it owns the post-login navigation). The **SSO** path can't: `createLoginRoute` redirects to `auth.loginUrl` verbatim, and the IdP returns the user to whatever return target is encoded in that URL (Shibboleth `target=`, OIDC `redirect_uri`, …) — typically the static app root, not the deep route.

To support deep-link return after SSO we'd need to inject the attempted path into the IdP's return param, which means knowing **which param** each IdP uses. Options:

- Add an optional `auth.loginRedirectParam` (e.g. `"target"`) to the config schema (additive → minor); when set, `createLoginRoute` appends `&<param>=<encoded attempted path>` to `loginUrl`.
- Or leave it as-is — landing on the app root after SSO is acceptable for most deployments.

- **When to revisit**: only if an org asks for exact-route return after SSO. Detail: SSO branch of [`packages/router/src/auth/createAuthRoutes.tsx`](../../packages/router/src/auth/createAuthRoutes.tsx).

### 5.5 ✅ Done — Auth-error screen no longer dumps the raw GraphQL error

When the `currentUser` check failed against a 5xx/unreachable backend, [`apps/shell/src/components/AuthCheckError.tsx`](../../apps/shell/src/components/AuthCheckError.tsx) used to render `error.message` verbatim in its `details` slot — for a GraphQL client error that's the full blob (`GraphQL Error (Code: 500): {"response":…,"request":{"query":"…MuiGetCurrentUser…"}}`). Fine for an admin debugging, but verbose and it exposed the operation/query text.

✅ **Done.** The screen now shows a friendly one-line title + description and tucks the raw message behind a collapsible `<details>` "Show details" expander (`authError.showDetails`), so an admin can still expand it to debug but it's out of the user's face by default. See [`AuthCheckError.tsx`](../../apps/shell/src/components/AuthCheckError.tsx).

### 5.6 ✅ Done (robustness) — a misbehaving remote plugin no longer crashes the whole shell

**Symptom.** Booting the shell against a live backend threw `TypeError: Cannot read properties of undefined (reading 'length')` from inside a remote-loaded plugin blob (a `<L>` component in the dev console), and the app rendered the error boundary instead of the UI. The console also showed `Warning: The following error wasn't caught by any route!` — so the failure was **not** contained to the offending plugin's route; it took down the boot.

**Scope / not a regression.** Observed only in a checkout that carries org `.local-plugins/` plus three bundled org plugin fixtures. These load against a real backend's `enabledPlugins` and one of them reads `.length` on an undefined value. A fresh clone that lacks those `.local-plugins/` boots fine — which is why it hasn't surfaced elsewhere.

**Two follow-up dimensions:**

1. ⏳ **Find & fix the offending plugin** — *org/community concern, not in-repo.* Narrow it down by bisecting `enabledPlugins` (or watching which plugin's blob is in the `<L>` stack frame) — prime suspects are an org plugin and the fixtures. Likely a data-shape assumption that holds offline but breaks against real backend data (an array that's `undefined` until loaded). This lives in the org's `.local-plugins/` ([out-of-scope-by-design](#7-out-of-scope-by-design)), not the OSS tree.
2. ✅ **Robustness (the important one) — Done.** A single third-party plugin throwing during render is now *isolated*, not fatal to the shell. Two render paths are guarded: plugin-provided component overrides go through [`PluginErrorBoundary`](../../packages/plugin-system/src/PluginErrorBoundary.tsx) in [`component-resolver.tsx`](../../packages/plugin-system/src/component-resolver.tsx) (a throwing override degrades to the built-in default component), and each plugin **app route** is wrapped in an `ErrorBoundary` with a `ModuleErrorFallback` in [`DynamicRouterProvider.tsx`](../../apps/shell/src/components/DynamicRouterProvider.tsx) (a broken plugin renders a placeholder for its route instead of taking down the boot). The loader already logs `success:false` per plugin (PluginInitializer); rendering is now guarded the same way.

- **When to revisit**: dimension 1 whenever the org fixtures are next touched. Repro: `VITE_PROXY_TARGET=<backend> pnpm --filter shell dev` in a checkout that has org `.local-plugins/`.

---

## 6. Testing

Self-contained in [`testing.md` → Follow-ups](../contribute/testing.md#follow-ups), which owns the list and its numbering. Items there (mirrored, not authoritative):

1. E2E suites per feature — residue only (the protocol-driven specs cover the main flows; convert the remaining hand-run protocol steps).
2. Coverage gates — extend to the apps (seven packages already enforce thresholds).
3. Playground-as-isolated-plugin-runner.
4. Marketplace metadata cleanup (move from hard-coded map to `extensionPoints` manifest).
5. Visual regression — data screens + promote to CI (default + alternate-theme baselines are committed).
6. Remote turbo cache to share artefacts across CI jobs.

---

## 7. Out-of-scope-by-design

These showed up during phase work and are explicitly **not** going to be fixed in this codebase. They live somewhere else's lifecycle.

### 7.1 `.local-plugins/*` repos must update their own dependency identifiers

Each `.local-plugins/<org>/` is its own git repository (gitignored from this monorepo). Two repo-internal updates land on those repos as a consequence of work that's already merged here:

- **Phase 6b namespace rename — urgent.** Every `package.json` `dependencies` / `devDependencies` entry that references `@workspace/<name>` must be rewritten to `@oc-mui/<name>`, plus every import statement. Once an org pulls Management UI past PR #130, `pnpm install` from inside their `.local-plugins/<org>/` repo will fail until they rename — the main repo no longer publishes `@workspace/*` workspace identifiers. The same rewrite the main repo took works there too: `rg --hidden -l "@workspace/" | xargs perl -pi -e 's|\@workspace/|\@oc-mui/|g'`.
- **Phase 2b `pluginNamespace` cutover — graceful.** Older configs that still use the `pluginNamespace` key keep working only because the shell silently ignores the field; they're not surfacing as an error, but they're also not effective. Migrate at leisure to the `app.enabledPlugins` + `config.plugins[id].enabled` split documented in [`docs/reference/configuration.md`](./configuration.md).

Both updates are explicitly out of scope for the main repo — each org owns the rename in its own repo and on its own timeline.

### 7.2 `[boundaries][warning]` stderr lines

Not eslint warnings, don't trip `--max-warnings 0`. Will disappear naturally when [3.2](#32-c-migrate-eslint-plugin-boundaries-v5--v6-selector-syntax) is resolved upstream.

---

## 8. Doc cleanup spillover from PR-3a

PR-3a restructured `docs/` from 40 files to 20, rewrote the plugin-author and operations docs, and replaced `AI_DEVELOPMENT_GUIDE.md` with `architecture/overview.md`. Two pockets weren't touched and still reference removed paths internally; the references are inside files that are themselves on a retirement path, so they were left for the dedicated follow-up rather than patched in place.

*(Numbering note: §8.2 was resolved and its entry removed — the gap is intentional, per the delete-on-completion rule at the top of this file.)*

### 8.1 ✅ Done — workflow docs consolidated

`ADDING_APPS.md` + `ADDING_PACKAGES.md` (formerly under a separate `workflows` directory in `docs/`; ~1.4k lines, with dangling links to deleted docs — `COUPLING_ANALYSIS.md`, `PACKAGE_README_TEMPLATE.md`, `AI_DEVELOPMENT_GUIDE.md` — and stale paths like `apps/management-ui-core`) were replaced by a single concise [`extending-the-workspace.md`](../contribute/extending-the-workspace.md), added to the Operations sidebar and dropped from `config.mts`'s `srcExclude`. That directory is now gone.

### 8.3 Going public with the docs site

The deploy trigger is **already active**: [`.github/workflows/docs.yml`](../../.github/workflows/docs.yml) deploys the site on every push to `develop` (plus manual `workflow_dispatch`) — there is no `main` branch in this repo. **Current blocker: GitHub Actions billing** — while it's unresolved no workflow runs at all, so no deploy happens; the moment billing is restored the site starts updating on merge with zero further edits.

Until the project is ready for public traffic the site stays **discouraged from indexing**. Exactly three things remain for go-public:

| # | What | Where | Change |
|---|------|-------|--------|
| 1 | Crawler block | [`docs/public/robots.txt`](../../docs/public/robots.txt) | `Disallow: /` → `Disallow:` (empty — allows everything). |
| 2 | `noindex` meta tag | [`docs/.vitepress/config.mts`](../../docs/.vitepress/config.mts) | Remove the `<meta name="robots" content="noindex, nofollow">` entry from the `head` array. |
| 3 | One-time GitHub setting | Repo **Settings → Pages** | Set source to **GitHub Actions** (not "Deploy from a branch"). The workflow's `actions/deploy-pages` step errors out until this is set. |

**When to revisit**: alongside the go-public flip (see [`test-protocol.md`](../contribute/test-protocol.md)'s closing section). Flip 1 and 2 together — the combo is belt-and-suspenders (robots.txt is advisory; the meta tag is what most search engines actually obey, so flipping only one leaves the other gating). Item 3 can be done earlier: with the guards in place, a manual `workflow_dispatch` deploy is safe any time — the URL exists, but search engines stay away.

### 8.4 Source-link rewriting is heuristic-based

[`docs/.vitepress/config.mts`](../../docs/.vitepress/config.mts)'s `rewriteRepoLink` rewrites `../foo/bar` links to GitHub permalinks unless the first path segment is one of a hardcoded list of docs subdirectories (`architecture`, `getting-started`, `operations`, `plugins`, `reference`, `workflows`). If a new top-level docs directory is added without updating that list, links into it from sibling docs will incorrectly point at GitHub.

- **When to revisit**: if/when a new top-level docs section is added. Update `DOCS_SUBDIRS` in the same PR.
- **Suggested alternative**: replace the whitelist with a build-time check of the actual filesystem (list immediate `docs/*` subdirs). Low priority — the current list is short and easy to keep in sync.

### 8.5 Move `docs/checkstyle/` out from under `docs/`

[`docs/checkstyle/`](../../docs/checkstyle/) is Maven build-time configuration — checkstyle ruleset, suppressions, license header, helper scripts — referenced by the `org.opencastproject:base` parent POM at the hardcoded path `${project.basedir}/docs/checkstyle/...`. It sits under `docs/` only because of that historical path expectation. The contents aren't documentation and are excluded from the VitePress site.

This is a footgun: it looks like a docs subdirectory but isn't. The Phase 3a restructure mistakenly deleted it because of that mistaken assumption, breaking staging Maven builds until a hotfix restored it.

- **When to revisit**: when the AMC Maven workflow is well-understood and the team has bandwidth to coordinate with Opencast upstream. Likely after Phase 6d.
- **Suggested form**: override `checkstyle.suppressions.file`, `checkstyle.config.location`, and `checkstyle.header.file` in the workspace `pom.xml` to point at a new location like `build-config/checkstyle/` (or `tooling/checkstyle/`). Move the files. Delete `docs/checkstyle/`. Make sure the JAR build still produces the same artifact.
- **Detail**: the inline [`docs/checkstyle/README.md`](../../docs/checkstyle/README.md) explains what each file is and why the directory must not be touched lightly.

### 8.6 Decide whether to keep `docs/contribute/test-protocol.md` long-term

The release test protocol was shipped to gate the first 1.0 public cut. It's written generally enough to be re-run before any major release of a contract-stable package, but its real proof-of-value is the first run.

After the first full pass, decide:

- **Keep as-is**: re-run before every major bump of `@oc-mui/plugin-system` (or any of the API-instrumented packages — see [`release.md` → API surface drift detection](../contribute/release.md#api-surface-drift-detection)). Treat it as the canonical pre-release gate.
- **Generalize**: drop the "1.0-flip-specific" framing in the closing section, lift any 1.0-only items, document a leaner version that focuses on the integration surfaces (the four loading paths, the six contracts, the Maven build) without the publishing-flip walkthrough.
- **Retire**: if the protocol's content is redundant with something else (e.g. an external QA process, or if it turns out our automated tests cover everything that mattered), delete it and rely on the automation.

- **When to revisit**: immediately after the first full pass against staging. The protocol's author should write a one-line decision on each section while the experience is fresh: "still relevant", "could be automated", "covers something CI already does", etc.
- **Suggested form**: a short follow-up PR after the 1.0 release that either trims, generalizes, or retires the doc based on what the first run taught.

### 8.7 Versioned docs site per `r/NN.x` release line

Today the site deploys one version, built from `develop`. Once more than one `r/NN.x` release line is supported in parallel (see [`release.md` → Branching model](../contribute/release.md#branching-model)), an admin on an older line reads docs describing a newer product. A versioned site (one build per supported line, plus a version switcher) would fix that.

- **When to revisit**: when a second release line exists and the docs meaningfully diverge between lines. Not before — a single-line project doesn't need the machinery.
- **Suggested form**: build `docs/` from each supported `r/NN.x` branch into a subpath (e.g. `/19.x/`), keep the `develop` build as the default, add a version selector to the VitePress theme config.

---

## 9. Pre-open-source audit follow-ups

A code-first security/packaging/dependency audit (2026-07) produced a set of
fixes and a set of deferred items. The full findings were captured in a
`PRE-OSS-AUDIT.md` working doc (not committed). Shipped fixes are noted for
context; the open items below are the ones deliberately not done yet.

**Shipped:** marketplace admin gate + episode XSS (PR #222), `pnpm audit`
cleanup + override pruning (PR #223), GitHub Actions SHA-pinning + Dependabot
(PR #224), marketplace remote-loading opt-in (PR #225), dist-canonical package
exports (this PR).

### 9.1 Before the first npm publish

- **peerDependencies shape.** ✅ Done in PR #227 — wrapped libraries in the
  facades and `react`/`react-dom` in the four in-tree plugins are
  `peerDependencies`; `@oc-mui/ui`'s react peer is reconciled.
- **`sideEffects` + api-extractor coverage.** Mostly done in PR #228
  (`sideEffects` declared; `.api.md` tracking + `api-check` added to
  `app-runtime`, `utils`, `plugin-testing`). `@oc-mui/ui` followed in PR #268
  (`./components`, 262 exports).

  **The planned sequencing was skipped, deliberately.** The note here used to
  say the curation pass should come *before* the initial snapshot, so the
  report wouldn't enshrine exports about to be removed. The baseline landed
  first anyway: nothing is published yet, so removing an export costs a
  regenerated report and a changeset — not a major bump. The snapshot is not
  the point of no return; the **first npm publish** is.

  **Still open, and now deadline-bound:** curate `@oc-mui/ui`'s export surface
  (which of the 262 are SDK, which are host internals) **before** step 2 of the
  [first-release bootstrap](../contribute/release.md#first-release-bootstrap--one-time-checklist).
  After that publish, every removal is a major bump plus a `@deprecated` cycle.
  Also still uncovered: the `./hooks`, `./lib`, `./lib/utils` and
  `./config-primitives` entry points (`etc/ui.api.md` exists but is empty —
  `src/index.ts` exports nothing).
- **npm org bootstrap (manual, on npmjs.com).** First-publish each `@oc-mui/*`
  package via `pnpm publish` while logged in, then configure per-package Trusted
  Publishers. See [`release.yml`](../../.github/workflows/release.yml).

### 9.2 Wave 2 — cleanup / quality

- ✅ **Done — `crypto-js` → Web Crypto** in `@oc-mui/utils` (PR #229; async
  `sha256`, with a fallback when `crypto.subtle` is unavailable). The org-plugin
  consumers were updated in lockstep in the private org-plugins repo; verified
  2026-08-12 that no `crypto-js` reference remains in any manifest or source.
- **Dead-code deletion** — ✅ the verified-dead subset (`AppRuntimeProvider.registerApp/
  getApps`, `useGenericQuery`, the dead GraphQL client singleton in `packages/query`)
  shipped in PR #230. Still open: the unused marketplace registry/security
  mutators and the `extension-points:documentation` extension point (registered,
  never read). **Not dead — earlier drafts of this list were wrong:**
  `datetime-picker.tsx` is live (rendered by `MetadataUpdateField` for DURATION
  fields).
- **Migrate the org-plugin language toggle off `@headlessui`** — ✅ done (#277,
  PR #377 + the org-plugins counterpart): `@oc-mui/ui` ships a native radix
  `Switch`, the org SidebarHeader migrated to it, and `SwitchHeadlessUI` plus
  the `@headlessui/react` dependency are gone.
- **Real license check in CI** — [`scripts/check-licenses.js`](../../scripts/check-licenses.js)
  is a basic allowlist script that is currently wired to no npm script and no CI
  job; either wire it up or replace it with a maintained checker.
- **Major-version migrations** (each its own PR): `i18next` 23→26 + `react-i18next`
  (also clears the last *runtime* `pnpm audit` item, `i18next-http-backend`),
  `zustand` 4→5, `react-day-picker` 8→10, `lucide-react` 0.417→1.x, and the app's
  `vite` 6→7 (clears the residual `vite` audit highs).
- **Retarget the backend to a released Opencast.** The `backend/` bundles build
  against `org.opencastproject:base:20-SNAPSHOT`, so external contributors must
  compile Opencast `r/20.x` from source before they can build or deploy them
  (see [getting-started/local-backend.md](../contribute/local-backend.md)).
  Once the parent targets a released Opencast (≥ 17 ships the GraphQL module),
  prebuilt container images become viable for the full-stack dev setup and the
  guide gets dramatically shorter.
  **Currently blocked upstream** (checked 2026-07-29): no released
  `org.opencastproject:base:19.x` exists in any public Maven repository —
  Maven Central stops at `18.5` (the 17.x series is missing entirely), and
  `mvn.opencast.org` is Opencast's third-party mirror, not its own artifacts.
  `18.5` being on Central proves the upstream publishing pipeline works, so
  the actionable step is asking the Opencast project to publish the 19.x
  artifacts; retarget once they exist.

### 9.3 Deferred marketplace hardening

Opt-in remote loading (PR #225) neutralised the default-on risk; these harden the
feature for deployments that enable it.

- **Integrity: SRI / signature verification** of fetched plugin (and theme) code.
  The domain allowlist authenticates the *host*, not the code's author (a shared
  CDN serves anyone), so it is necessary-but-not-sufficient. See
  `packages/remote-plugin-loader/src/loadAndRegister.ts`.
- **Namespace enforcement** so a loaded remote plugin can only register under its
  own declared namespace (can't hijack another plugin's routes/extension points).
