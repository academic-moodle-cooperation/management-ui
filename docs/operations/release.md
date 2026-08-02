# Releases & versioning

How a change gets from a merged PR to a published version. The day-to-day rules are in [`CONTRIBUTING.md`](../../CONTRIBUTING.md#versioning-changesets-and-deprecations); this page is the deeper reference, plus the operational details a maintainer needs to actually cut a release.

## What gets published — the plugin-author SDK

The published npm packages exist for **one purpose: writing plugins without checking out this monorepo.** Someone running `pnpm create-plugin` (or building a plugin in their own repo) installs a handful of `@oc-mui/*` packages and nothing else. That set — and only that set — is what we publish to npm.

Everything else stays `private: true` **permanently**. The feature plugins ship inside the application (as JARs / via the marketplace), not as libraries someone imports; the host-only infrastructure has no meaning outside the shell. `private: true` is therefore their intended end state, not a temporary pre-1.0 lock.

The set is decided **forward-looking**: it covers what a plugin author can legitimately need to write a plugin against the supported model — not merely what an in-tree plugin happens to import today. (Current imports are a floor: `@oc-mui/app-runtime`, for instance, has no in-tree plugin consumer but is imported by an external third-party plugin; `@oc-mui/tailwind-config` has no in-tree dependent but any plugin that builds its own Tailwind needs the preset.) The set is dependency-closed: nothing published depends on a non-published package.

**Published — the SDK (15 packages).**

| Package | Why a plugin author needs it |
|---|---|
| `@oc-mui/plugin-system` | `createPlugin`, `PluginManager`, extension-point registration |
| `@oc-mui/plugin-core` | shared extension-point identifiers every plugin may import |
| `@oc-mui/app-runtime` | `AppRuntimeProvider` / `useAppRuntime` and the standalone-app bootstrap (`StandaloneAppWrapper`, `bootstrapStandaloneApp`) an external/standalone plugin boots with |
| `@oc-mui/ui` | the React component library |
| `@oc-mui/tailwind-config` | the shadcn design-token preset, so custom plugin markup matches the host's styling |
| `@oc-mui/utils` | logger, asset URLs, deep-merge |
| `@oc-mui/i18n` · `@oc-mui/query` · `@oc-mui/router` · `@oc-mui/store` | the wrapper facades (i18next / TanStack Query / TanStack Router / Jotai) |
| `@oc-mui/ui-config` | `AppConfig` types + defaults |
| `@oc-mui/plugin-testing` | the contract-test harness (devDependency) |
| `@oc-mui/eslint-config` · `@oc-mui/typescript-config` · `@oc-mui/vite-config` | the shared lint / TS / build configs the scaffold wires in |

**Never published — stays `private: true` (7 packages).** The guiding rule: *publishing is a commitment* — every published package is a versioned public contract. Adding a package to npm later is a non-breaking change; un-publishing one is not. So when a package is a host internal rather than part of the authoring contract, it stays private until there's a concrete reason to expose it.

| Package | Why it is not an SDK package |
|---|---|
| `@oc-mui/plugin-core-episodes` · `-series` · `-upload` | feature plugins — application products, shipped via JAR/marketplace. The architecture forbids importing one plugin from another (communicate via extension points), so no author depends on these as packages. |
| `@oc-mui/plugin-admin-marketplace` | the host's admin product |
| `@oc-mui/plugin-example` | reference/scaffold source, read not installed |
| `@oc-mui/remote-plugin-loader` | host-side mechanism for loading remote plugins; an author writes a plugin, the host loads it |
| `@oc-mui/providers` | app-level provider composition; authors reach the same wiring through `@oc-mui/app-runtime`'s standalone wrappers. Promote it only if we commit to authors composing providers by hand. |

> The SDK packages carry full npm metadata (`description`, `repository`, `author`, `keywords`, `publishConfig.access = public`) and a per-package `LICENSE`, and are publishable: the `private` flags were dropped in the publish flip (PR #210). The only remaining one-time step is the first-release bootstrap (see “Cutting a release”).

### Publish-readiness checklist (the work before the flip)

The packages are not yet npm-installable; getting there is tracked as:

- [x] **Metadata + per-package `LICENSE`** on the 15 SDK packages.
- [x] **React → `peerDependencies`** on `plugin-system`, `app-runtime`, `plugin-testing` (avoids duplicate-React in a consumer install).
- [x] **`exports` → built `dist/` + `files` allowlist** for every SDK package, so consumers get compiled JS, not raw `.ts`/`.tsx`. Pattern: tsup builds ESM JS → `dist/`; `tsc` emits `.d.ts` → `dist-types/` (also feeds api-extractor); package `exports` point **directly at `dist`** (dist-canonical; the former src/`publishConfig` indirection and the `development` condition were removed so published and local resolution can never diverge — the shell dev server resolves workspace sources via its own Vite aliases instead). All 15 SDK packages now ship `dist` (the 3 config packages ship source intentionally with a `files` allowlist). _Styling for external consumers works out of the box: `@oc-mui/ui`'s `globals.css` self-scans its own dist (so component classes are generated) and ships the design tokens + fonts, and Tailwind v4 auto-scans the consumer's project — so a plugin author just needs `@import "@oc-mui/ui/globals.css"`. The previous monorepo-specific `@source` globs (apps/plugins/.local-plugins) were moved out of the shared stylesheet into the shell's own Tailwind entry ([`apps/shell/src/app.css`](../../apps/shell/src/app.css)); verified against the visual-regression baselines (pixel-identical) and a real external Tailwind build._
- [x] **Verdaccio publish-smoke-test (the acceptance gate).** [`scripts/verify-sdk-publish.sh`](../../scripts/verify-sdk-publish.sh) (run via `pnpm test:sdk-publish`, CI: [`.github/workflows/sdk-publish.yml`](../../.github/workflows/sdk-publish.yml)) builds the SDK, strips `private`, publishes all 15 packages to a throwaway Verdaccio registry, then in a consumer project **outside the workspace** installs the SDK from that registry and runs a type-check (against the shipped `.d.ts`) + a runtime smoke test (against the shipped JS) of a real `createPlugin` plugin. This is the real proof that "a plugin can install and build against our packages without the monorepo." Everything is torn down on exit and the `private` flags restored from git.
- [x] **`pkg.pr.new` per-PR preview packages.** [`.github/workflows/preview-packages.yml`](../../.github/workflows/preview-packages.yml) publishes preview builds of the 15 SDK packages to the [pkg.pr.new](https://pkg.pr.new) CDN on each PR, and comments the install URLs, so anyone (e.g. a backend/plugin author) can `pnpm add https://pkg.pr.new/@oc-mui/<pkg>@<sha>` and test the exact artifacts from a branch before a permanent npm publish. It packs with `pnpm` (same pack path as a real publish) and rewrites workspace deps to sibling preview URLs, so the whole `@oc-mui` graph resolves from the CDN. pkg.pr.new **skips `private: true` packages**, so the workflow strips `private` in a dedicated step before publishing (the runner checkout is throwaway). **One-time setup (maintainer):** install the [pkg.pr.new GitHub App](https://github.com/apps/pkg-pr-new) on the repo running the workflow — pkg.pr.new checks the App against `$GITHUB_REPOSITORY`, so install it wherever you want previews. Until it's installed the publish step is rejected, but it's `continue-on-error` so it never fails the PR. (No npm token; pkg.pr.new is a preview CDN, not npm.)

Both closing tasks of the exports→dist effort are now in place — Verdaccio for the all-in-one acceptance gate, pkg.pr.new for low-friction per-branch testing. Together they are the standing answer to "can we test against staged packages before publishing?" — **yes**.

## Versioning model

Every workspace package under `packages/` and `plugins/` is **versioned independently** following [Semver 2.0](https://semver.org/). Apps under `apps/` (`shell`, `playground`) are not published and not versioned.

The four contracts in [`architecture/CONTRACTS.md`](../architecture/CONTRACTS.md) layer additional rules on top of plain Semver for the frozen surfaces:

- **Manifest 1.1** — `@oc-mui/plugin-system`
- **Runtime API 1.0** — `@oc-mui/plugin-system`
- **Theme 2.0** — `@oc-mui/ui` (tokens) + plugin authors (consumers)
- **Config 1.0** — `@oc-mui/query` (`definePluginConfig`) + `@oc-mui/plugin-system` (loader)

Any change observable to a plugin author through one of these surfaces is **always a major** bump of the affected package, even if Semver alone would say otherwise.

## Picking the bump level

Decide based on what the change does to the package's **public surface** — the symbols listed in `package.json`'s `exports`, the public types they re-export, and any documented runtime contract.

| Bump | When |
|------|------|
| **Patch** | Internal refactor, performance, bug fix that keeps the same public signature. No visible behaviour change. |
| **Minor** | New export, new optional parameter, new method, new optional field on a public type. Existing consumers stay source- and binary-compatible. |
| **Major** | Removed or renamed export, changed signature, behaviour change a consumer would observe, contract change. |

Plugin runtime API has the hard rule: anything that changes what plugin authors observe → **major** of `@oc-mui/plugin-system`. The loader rejects plugins whose declared `apiVersion` major doesn't match the host's `PLUGIN_API_VERSION`.

## Changesets

We use [Changesets](https://github.com/changesets/changesets) to track every user-facing change and generate per-package changelogs.

```bash
# After your change, in the repo root:
pnpm changeset
# Pick affected package(s), pick the bump level, write a one-line summary.
# The CLI writes a .changeset/<slug>.md file.

# Verify what your changeset releases:
pnpm changeset:status

# Commit it alongside the rest of your PR.
```

CI **rejects** any PR that touches a released package without a changeset. Changes scoped purely to `apps/shell`, `apps/playground`, root config, docs, or workflows do not need one (those packages are listed under `ignore` in `.changeset/config.json`).

For an intentionally release-noteless change to a versioned package (a JSDoc typo, an internal refactor that briefly touches a public file), record the deliberate decision:

```bash
pnpm changeset --empty
```

## API surface drift detection

The Semver rules only work if we *notice* that an API has changed. To make the visible surface mechanically observable, every contract-stable package commits a per-package report under `packages/<pkg>/etc/<pkg>.api.md`. The reports are generated by [API Extractor](https://api-extractor.com/) and look like a flattened `.d.ts` of the public exports.

```bash
# After changing a public API
pnpm api-check
git diff packages/*/etc/*.api.md
# If intentional, commit the diff with a matching changeset.
```

CI runs `pnpm api-check:ci`, which compares the generated reports against the committed snapshots and fails the PR if they differ. Intentional changes commit the regenerated `etc/<pkg>.api.md` + changeset; unintentional changes get an immediate signal.

Instrumented packages — the six contract-stable ones:

- `@oc-mui/plugin-system`
- `@oc-mui/router`
- `@oc-mui/query`
- `@oc-mui/i18n`
- `@oc-mui/store`
- `@oc-mui/ui-config`

Cross-package coupling visible in each report is intentional: when an upstream contract changes, every consumer's snapshot diff surfaces the break.

## Deprecations

Removing a public symbol is a major bump and requires a deprecation warning in the previous major.

1. Mark it `@deprecated` in JSDoc with a one-line reason and a pointer to the replacement.
2. Keep the old symbol working for one full major cycle. A symbol marked `@deprecated` in `1.x` may be removed only in `2.0.0`. The deprecation itself is a **minor** bump; the eventual removal is its own **major** changeset.
3. Emit a runtime warning in dev. Use `logger.warn` from `@oc-mui/utils`, gated behind `import.meta.env.DEV` so production callers don't pay the cost. Encouraged, not mandatory — type-only deprecations can't warn.
4. Document the deprecation in the changeset body so it lands in the changelog.

Plugin authors get a one-major-cycle grace window: when the host bumps `PLUGIN_API_VERSION` major, plugins compiled against the previous major are cleanly rejected by the loader with a "Plugin requires API major X, host provides Y" error.

## Branching model

Modeled on the Opencast project's GitFlow-style branching. Three branch roles matter for releases:

| Branch | Role |
|---|---|
| **`develop`** | Integration. Feature branches are cut from here and their PRs merge back here, each with a changeset. The latest integrated code — not yet released. `.changeset/config.json`'s `baseBranch` is `develop`. |
| **`r/NN.x`** | Release lines, named after the Opencast major they target (e.g. `r/19.x` ↔ Opencast 19). Releasing happens **here**: every

## Cutting a release

> **Note:** `.changeset/config.json` is set to `access: "public"` and the packages carry no `private` flag — they are publishable as-is. The only special case is the very first publish of each package (bootstrap, below).

Before any release — and especially before the first public 1.0 cut or any major bump of a contract-stable package — run the [release test protocol](./test-protocol.md). It's the integration-level gate that complements `pnpm verify`'s mechanical checks.

The automation lives in [`.github/workflows/release.yml`](../../.github/workflows/release.yml), which runs the [`changesets/action`](https://github.com/changesets/action) on every push to an **`r/**`** release line (see [Branching model](#branching-model)). The release flow:

1. **Push the release line `r/NN.x`** (branch from `develop`, or update an existing line). On the push, the action opens (or updates) a **"Version Packages" PR** against that line that aggregates the pending `.changeset/*.md` files into version bumps and changelog updates.
2. **Review and merge the Version Packages PR.** This commits the version bumps, regenerated changelogs, and consumes the `.changeset/*.md` files.
3. **The action publishes.** When that merge lands and no changesets remain, the same workflow runs `pnpm changeset:publish`, which calls `npm publish` for every bumped package and creates matching per-package git tags, plus the product tag `vNN.x.y` and a GitHub Release. Then forward-merge the release line back toward `develop`.

There is no manual `pnpm publish` step. If a release goes sideways, deprecate the bad version with `npm deprecate` rather than unpublishing.

## Bugfixes across multiple release lines

Like Opencast, we support the newest release lines in parallel (Opencast itself supports three majors, e.g. 18/19/20). `release.yml` triggers on every `r/**` push with a per-branch concurrency group, so **each line is an independent release machine** — the Opencast flow ("fix the oldest affected line, forward-merge upward") maps directly:

1. **Fix the oldest affected line.** PR (fix + changeset, usually `patch`) against e.g. `r/18.x`, merge it there.
2. **Forward-merge immediately, before releasing** — `r/18.x → r/19.x → r/20.x → develop`, one PR each, merged as **merge commits** (never squash — squash diverges the histories permanently). The order matters: forward-merging *before* any line's Version PR is merged carries the **changeset file** to every line, so each line's own Version PR consumes its own copy and produces that line's patch release (e.g. `1.0.3` on the 18-line and `2.1.1` on the 19-line, each with the fix in its changelog).
   *If you released the old line first*, the forward-merge carries the changeset **deletion** and the old line's version bumps instead — then cherry-pick or re-create the changeset on the newer line. It works, but it's the manual path; prefer forward-merge-first.
3. **Resolve version metadata toward the newer line.** Forward merges conflict in `package.json` versions, `CHANGELOG.md`s, and `VERSION`: always keep the **target (newer) line's** values and take only the fix itself. `VERSION` is per-line by design (`18.5.1` on `r/18.x`, `19.2.0` on `r/19.x`).
4. **Release each line independently** by merging its Version PR whenever that line wants to ship. There is no required ordering between lines.
5. **Repoint npm `latest` when an old line publishes.** `changeset publish` tags every publish `latest`; that is only correct for the newest line. After a patch release on an older line, repoint each affected package: `npm dist-tag add @oc-mui/<pkg>@<newest-version> latest`.

**Alternative (cherry-pick/backport):** land the fix on `develop` first and cherry-pick it (with its changeset) onto each supported line. Changesets handles this equally well, and it avoids the version-metadata conflicts of step 3 — at the price of one backport PR per line and no shared history. Use it as the fallback when a forward-merge would drag along commits a line must not receive; the default remains the Opencast-style flow above (decided in #236).

> **First-release bootstrap.** npm's OIDC trusted publishing cannot create a package that does not exist yet ([npm/cli#8544](https://github.com/npm/cli/issues/8544)). The very first publish of each package is therefore manual: `npm login`, then `pnpm publish -r --access public` from the release line (pnpm, not plain npm — it rewrites `workspace:*` deps). Afterwards configure each package's Trusted Publisher on npmjs.com (repo + `release.yml`); every later release flows through this workflow tokenlessly.

### npm authentication: tokenless via Trusted Publishing (OIDC)

There is **no `NPM_TOKEN` secret**. The release workflow authenticates to npm with a short-lived [OIDC](https://docs.npmjs.com/trusted-publishers) identity token (it has `id-token: write`), so there is no long-lived credential to leak or rotate, and provenance attestations are generated automatically.

The one wrinkle is the **first publish of each package** — OIDC can't create a package that doesn't exist yet, and a package can't have a trusted publisher configured until it exists ([npm/cli#8544](https://github.com/npm/cli/issues/8544), still open):

1. **Bootstrap (first publish only, from a maintainer's machine).** Publish each of the 15 SDK packages once by hand: `npm login` (interactive, with 2FA — nothing stored, no CI token), then `pnpm changeset:publish`. This is the *only* publish that happens off-CI.
2. **Configure Trusted Publishing per package.** On npmjs.com, set each package's *Trusted Publisher* to this repo + `.github/workflows/release.yml`. OIDC publishing needs **npm ≥ 11.5.1 and Node ≥ 22.14.0** on the runner — the workflow's Setup Node (`node-version: 22`) + `npm install -g npm@latest` steps guarantee this.
3. **Every release after that is workflow-only and tokenless.** Merging the Version Packages PR triggers `changeset publish`; npm accepts it via the run's OIDC token, no secret involved.

> Recheck npm's trusted-publishing docs at flip time: if new packages can by then be pre-registered with a trusted publisher ([npm/cli#8544](https://github.com/npm/cli/issues/8544)), even the one-time local bootstrap can be skipped and publishing is 100% CI from day one.

## See also

- [`CONTRIBUTING.md`](../../CONTRIBUTING.md#versioning-changesets-and-deprecations) — the day-to-day version of this page.
- [`architecture/CONTRACTS.md`](../architecture/CONTRACTS.md) — the six frozen contracts.
- [`.changeset/config.json`](../../.changeset/config.json) — current changesets configuration.
- [`test-protocol.md`](./test-protocol.md) — end-to-end checklist to run before every release.
- [`ci.md`](./ci.md) — what runs on every PR.
