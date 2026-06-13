# Open follow-ups

The single committed index of every "we know about this but we're not doing it now" item across the repo. Each entry says **what it is**, **when to revisit**, and **where the inline detail lives**.

Three other tracking surfaces feed into this list — keep them all in sync if you delete or close an item:

- **Per-area lists**: [`testing.md` → Follow-ups](testing.md#follow-ups) (testing-specific items).
- **Inline `TODO:` / `FIXME:` comments** in code and config files (linked from each entry below).
- **`CONTRIBUTING.md` → Versioning** for the deprecation policy on items that need a changeset.

If you start work on a follow-up here, delete its entry in the PR that lands the fix; future archaeologists will find it via `git log`.

---

## 1. Scaffolding & community plugin distribution

### 1.1 ✅ Done — `examples/community-plugin-template/` retired

The directory was originally consumed by `scripts/export-plugin-to-local.js` and `scripts/extract-module-to-plugin.mjs`, both retired in PR #126 in favour of `pnpm create-plugin`. With Phase 8.5.2 shipping the canonical Maven scaffold under `scripts/templates/create-plugin-maven/` (consumed by the default `pnpm create-plugin <name>` flow), the example directory had nothing left to teach and was deleted in the same PR.

### 1.2 ✅ Done — external plugin POM template

Shipped in Phase 8.5.2. `pnpm create-plugin <name>` now scaffolds a `backend/pom.xml` by default (skip with `--no-pom`); the template inherits from `org.opencastproject:base:19-SNAPSHOT` and produces a deployable Opencast JAR via `mvn package`. Full how-to in [`docs/plugins/distribution.md`](../plugins/distribution.md#path-3--jar-production). The future option of publishing a dedicated `management-ui-plugin-parent` POM (Option B from the design discussion) is tracked in §1.3 below.

### 1.3 (Maybe) publish a `management-ui-plugin-parent` POM

Today the scaffolded plugin POM inherits from `org.opencastproject:base` directly and declares its own `frontend-maven-plugin`, `maven-resources-plugin`, and OSGi defaults inline. If a non-trivial number of external plugins start shipping and end up duplicating the same POM scaffolding, it's worth publishing a `org.amc.management:management-ui-plugin-parent` artifact that plugins inherit from instead, moving the shared defaults into the parent.

- **When to revisit**: when we see 5+ external plugin POMs in the wild and notice consistent duplication of the same `<build>` config. Or when the scaffold needs a default that's awkward to update across all consumers (e.g. a Node version bump).
- **Effort estimate**: ~1 day to publish the parent once the artifact destination is decided (e.g. Maven Central or a private Maven registry). Each existing plugin needs a one-stanza `<parent>` swap to consume it.
- **Cost ramp**: cheap before any external plugins exist (we just announce "switch your `<parent>` block"); rises with every plugin published on the old parent.
- **Detail**: design discussion captured in the Phase 8.5.2 PR description.

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

✅ **Done.** Contract shipped in PR-5.1a, ESLint enforcement shipped in PR-5.1b, all 35 legacy operations renamed in PR-5.1c. Every `query`/`mutation`/`subscription`/`fragment` declared anywhere in the workspace now carries the right PascalCase prefix; `git grep "eslint-disable-next-line local/graphql-operation-naming"` returns zero hits in source. The full contract lives at [`architecture/CONTRACTS.md` § 6](../architecture/CONTRACTS.md#6-graphql-operation-naming).

### 5.2 External plugin POM template + Maven parent

See [1.2](#12-external-plugin-pom-template--maven-parent) above.

### 5.3 ✅ Shared-npm-deps version-locking — wired into the loaders (residual: backend `plugins.json`)

**Status:** contract + check function shipped; loader-side enforcement now wired across all three paths. Only the JAR path's data source is residual (backend-owned).

The Shared Runtime Dependencies contract (`@oc-mui/plugin-system`'s `SHARED_RUNTIME_MAJORS`, documented in [`architecture/CONTRACTS.md` §5](../architecture/CONTRACTS.md#5-shared-runtime-dependencies)) defines which packages the host provides and what major a plugin must declare in `workspaceDependencies`. `checkSharedDependencyCompatibility` is the single source of truth; all three loader paths now funnel through it:

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

### 5.5 Auth-error screen dumps the raw GraphQL error to the user

When the `currentUser` check fails against a 5xx/unreachable backend, [`apps/shell/src/components/AuthCheckError.tsx`](../../apps/shell/src/components/AuthCheckError.tsx) renders `error.message` verbatim in its `details` slot — for a GraphQL client error that's the full blob (`GraphQL Error (Code: 500): {"response":…,"request":{"query":"…MuiGetCurrentUser…"}}`). Fine for an admin debugging, but verbose and it exposes the operation/query text.

- **Suggested form**: trim to a friendly one-line summary (status + "couldn't reach the server"), and move the raw message behind a collapsible "Show details" expander (or gate it on dev). Small, self-contained shell PR.
- **When to revisit**: a UI-polish pass before the 1.0 cut. Surfaced while diagnosing a backend-down screen.

### 5.6 A misbehaving remote plugin crashes the whole shell on boot

**Symptom.** Booting the shell against a live backend throws `TypeError: Cannot read properties of undefined (reading 'length')` from inside a remote-loaded plugin blob (a `<L>` component in the dev console), and the app renders the error boundary instead of the UI. The console also shows `Warning: The following error wasn't caught by any route!` — so the failure is **not** contained to the offending plugin's route; it takes down the boot.

**Scope / not a regression.** Observed only in a checkout that carries org `.local-plugins/` plus bundled community example plugins (`poll-plugin`, `video-playlists-plugin`, `series-create-acl-editor-plugin`, …). These load against a real backend's `enabledPlugins` and one of them reads `.length` on an undefined value. A fresh clone that lacks those `.local-plugins/` boots fine — which is why it hasn't surfaced elsewhere.

**Two follow-up dimensions:**
1. **Find & fix the offending plugin.** Narrow it down by bisecting `enabledPlugins` (or watching which plugin's blob is in the `<L>` stack frame) — prime suspects are an org plugin and the community fixtures. Likely a data-shape assumption that holds offline but breaks against real backend data (an array that's `undefined` until loaded).
2. **Robustness (the more important one).** A single third-party plugin throwing during render should be *isolated*, not fatal to the shell. The remote-plugin render path needs a per-plugin error boundary so a broken plugin degrades to a placeholder rather than an app-wide crash — this matters once external orgs ship their own plugins. Related: the loader already logs `success:false` per plugin (PluginInitializer), but rendering isn't guarded the same way.

- **When to revisit**: dimension 2 before the public plugin ecosystem opens up; dimension 1 whenever the org/community fixtures are next touched. Repro: `VITE_PROXY_TARGET=<backend> pnpm --filter shell dev` in a checkout that has org `.local-plugins/`.

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

### 8.1 ✅ Done — workflow docs consolidated

`docs/workflows/ADDING_APPS.md` + `ADDING_PACKAGES.md` (~1.4k lines, with dangling links to deleted docs — `COUPLING_ANALYSIS.md`, `PACKAGE_README_TEMPLATE.md`, `AI_DEVELOPMENT_GUIDE.md` — and stale paths like `apps/management-ui-core`) were replaced by a single concise [`extending-the-workspace.md`](extending-the-workspace.md), added to the Operations sidebar and dropped from `config.mts`'s `srcExclude`. The `docs/workflows/` directory is now gone.

### 8.3 Going public with the docs site

The doc site is built and deployable but **discouraged from indexing** until the project is ready for public traffic. Three guards are in place; all three flip together when you announce the site.

| File | Current state | Change when going public |
|------|---------------|--------------------------|
| [`docs/public/robots.txt`](../../docs/public/robots.txt) | `Disallow: /` | Change to `Disallow:` (empty — allows everything). |
| [`docs/.vitepress/config.mts`](../../docs/.vitepress/config.mts) | `<meta name="robots" content="noindex, nofollow">` in the `head` array | Remove that entry. |
| [`.github/workflows/docs.yml`](../../.github/workflows/docs.yml) | `push:` trigger is commented out; deploys only via `workflow_dispatch` | Uncomment the `push: branches: [main]` block so merges keep the site fresh. |

**When to revisit**: alongside Phase 6d (the `access: "restricted" → "public"` npm-publish flip). Once everything has been verified on the test server and the plan is finished, do all three together — the `robots.txt` + meta-tag combo is belt-and-suspenders (robots.txt is advisory; the meta tag is what most search engines actually obey, so flipping only one leaves the other gating).

**First-time enablement on GitHub**: when you're ready to ship even a manual deploy, enable GitHub Pages in the repo settings under **Settings → Pages**, source: **GitHub Actions** (not "Deploy from a branch"). The workflow's `actions/deploy-pages` step needs that to be set, otherwise it errors out. While the guards are in place, you can do a manual `workflow_dispatch` deploy any time — the URL exists, but search engines stay away.

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

### 8.6 Decide whether to keep `docs/operations/test-protocol.md` long-term

The release test protocol was shipped to gate the first 1.0 public cut. It's written generally enough to be re-run before any major release of a contract-stable package, but its real proof-of-value is the first run.

After the first full pass, decide:

- **Keep as-is**: re-run before every major bump of `@oc-mui/plugin-system` (or any of the six contract-stable packages). Treat it as the canonical pre-release gate.
- **Generalize**: drop the "1.0-flip-specific" framing in the closing section, lift any 1.0-only items, document a leaner version that focuses on the integration surfaces (the four loading paths, the six contracts, the Maven build) without the publishing-flip walkthrough.
- **Retire**: if the protocol's content is redundant with something else (e.g. an external QA process, or if it turns out our automated tests cover everything that mattered), delete it and rely on the automation.

- **When to revisit**: immediately after the first full pass against staging. The protocol's author should write a one-line decision on each section while the experience is fresh: "still relevant", "could be automated", "covers something CI already does", etc.
- **Suggested form**: a short follow-up PR after the 1.0 release that either trims, generalizes, or retires the doc based on what the first run taught.
