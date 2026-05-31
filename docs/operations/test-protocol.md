# Release test protocol

A systematic walkthrough verifying every advertised feature actually works end-to-end before cutting a release. Run this in a fresh checkout against your staging Opencast backend.

This is **not** the same as `pnpm verify`. The verify gate runs lint, types, unit tests, contract tests, an API-snapshot check, and a Playwright smoke against a mocked backend. It catches mechanical regressions. The protocol below catches **integration** regressions — things that pass in CI but fall over when a real backend, a real plugin JAR, a real org theme, or a real config drift hits them.

Mark each item ✅ / ❌ / ➖ (skipped, justified). Any ❌ blocks the release.

## When to run

- Before the first public 1.0 cut (Phase 6d's npm `restricted → public` flip).
- Before any major bump of `@oc-mui/plugin-system` (the contract-stable core).
- Before any release that touches the JAR-packaging pipeline (Maven POMs, `apps/shell/pom.xml`, the `PluginBundleTracker`).
- Annually, as a calibration pass even if none of the above triggered.

## Setup

You need:

- A clean clone of the repo at the branch you're releasing.
- Node ≥ 20, pnpm ≥ 10.4.1, Java 21 (for the JAR sections), Maven 3.9+.
- A staging Opencast instance you can deploy to and break without consequence. `$OPENCAST_HOME` should be writable; you should be able to inspect logs.
- A web browser with devtools.

```bash
# From a fresh dir
git clone https://github.com/academic-moodle-cooperation/management-tool.git
cd management-tool
git checkout <release-branch>
pnpm install
pnpm build
```

**Point Vite at your staging backend** before running Section 2 onwards — otherwise the proxy can't reach the endpoints the shell loads at boot (`config.json`, `plugins.json`, `/info/me.json`, `/graphql`) and most sections will fail:

```bash
export VITE_PROXY_TARGET=https://your-staging.example.org
```

Without this, the Vite dev server will print a single "Backend not reachable" notice the first time the shell tries to fetch and then go quiet. Most of the protocol's checks won't pass; Sections 1, 8, 13, 14 are the only parts that don't need a backend. See [`docs/getting-started/installation.md` → Configure the backend](../getting-started/installation.md#configure-the-backend) for the three options (point at a real backend, run Opencast locally, or stub the four endpoints).

## Section 1 — Workspace baseline

Pre-flight. If any of these fail, stop. The release is broken in a way that doesn't need staging to surface.

| # | Test | Expected | If fails |
|---|------|----------|----------|
| 1.1 | `pnpm install` | Completes; `node_modules/` populated. | Check lockfile + pnpm version. |
| 1.2 | `pnpm build` | All packages compile; `dist/`, `dist-types/` populated. | TypeScript errors → real bug. |
| 1.3 | `pnpm verify` | 88+ turbo tasks pass + Playwright smoke green. | Read the failing job's log. Usually deterministic. |
| 1.4 | `pnpm api-check` | API Extractor snapshots match committed `etc/<pkg>.api.md`. | A real API surface drifted. Regenerate + add changeset, or revert the offending PR. |

## Section 2 — Shell boots cleanly

```bash
pnpm dev
```

Open `http://127.0.0.1:3000/management-ui/` in the browser.

| # | Test | Expected |
|---|------|----------|
| 2.1 | Shell renders without console errors | Devtools console clean. Warnings OK, errors not. |
| 2.2 | Sidebar shows expected nav items | Episodes, Series, Upload, Marketplace (depending on `app.enabledPlugins`). |
| 2.3 | Default theme applied | Semantic tokens render (no white-on-white text, no `oklch()` strings visible). |
| 2.4 | Active route highlights in sidebar | Click an item — its row goes active. |
| 2.5 | Footer renders | Default core footer present. |
| 2.6 | Logo renders | The `app:header-logo` registration resolves. |

## Section 3 — Built-in plugin features

Each core plugin's route should mount, render, and react to user input. Backend calls hit the staging Opencast.

| # | Plugin | Route | Test |
|---|--------|-------|------|
| 3.1 | Episodes | `/episodes` | Table renders. Sorting, filtering, pagination work. Click a row → detail panel. |
| 3.2 | Series | `/series` | Table renders. "Create series" toolbar action opens dialog. Submitting creates the series; it appears in the list. |
| 3.3 | Upload | `/upload` | Upload-file UI renders. Drag-drop or browse-pick works. Workflow selection shows configured options. |
| 3.4 | Marketplace | `/admin/marketplace` | Lists registered plugins. Developer Mode section visible (admin role). |

## Section 4 — GraphQL data flow

Verifies the `@oc-mui/query` layer and the GraphQL Operation Naming Contract (`Mui`-prefixed operations — see [`docs/architecture/CONTRACTS.md`](../architecture/CONTRACTS.md)).

### How to read GraphQL traffic

Every operation is a **POST to the same `/graphql` URL** — the request URL never tells you which operation ran. You read the operation name out of the request body.

1. Open devtools → **Network** tab. Filter by `graphql` (or filter on **Fetch/XHR**).
2. Trigger the action (load a route, submit a dialog).
3. Click the `graphql` request → **Payload** (Chrome) / **Request** (Firefox) tab. The JSON body has a `query` field whose text begins with the operation, e.g. `query MuiGetMyEvents(...)` or `mutation MuiCreateSeries(...)`. That word after `query`/`mutation` is the operation name — confirm the **`Mui` prefix**.
4. Click the **Response** (or **Preview**) tab to see the result. Success = a `data` object with the expected shape. Failure = a top-level `errors` array (this is how the episodes-sort regression surfaced: `field 'description' is not defined for input object type 'EventOrderByInput'`).

> Tip: a single route load fires several operations (current user, the list query, lookups). Match on the operation name in the payload, not on request order.

### How to inspect the TanStack Query cache

`QueryProvider` mounts **React Query Devtools** unconditionally (the floating TanStack logo, bottom corner). Click it to open the panel. Each query is listed by its `queryKey` with a live status badge — `fresh`, `stale`, `fetching`, `inactive`. Use this panel for 4.4–4.6 instead of guessing from the Network tab.

Cache defaults that these checks assume (`packages/query/src/QueryProvider.tsx`): `staleTime` 5 min, `refetchOnWindowFocus: false`, `retry: 1`. Individual hooks override these — note that below.

| # | Test | How | Expected |
|---|------|-----|----------|
| 4.1 | `/episodes` list query | Load `/episodes`, read the list request's payload. | Operation name `MuiGetMyEvents`. Response has `data`, no `errors`. |
| 4.2 | `/series` list query | Load `/series`, read the list request's payload. | Operation name `MuiGetMySeries`. Response has `data`, no `errors`. |
| 4.3 | "Create series" mutation | `/series` → "Create series" → fill + submit. | A POST with `mutation MuiCreateSeries`; Response has `data.createSeries` (no `errors`); the new series appears in the list. |
| 4.4 | Sorting sends a valid `orderBy` | Click each sortable column header on `/episodes` and `/series`. | Each click fires `MuiGetMyEvents`/`MuiGetMySeries` with an `orderBy` variable and returns `data` with **no `errors`**. Columns the backend can't sort show no sort control (enforced by `restrictSortingToFields` against the generated `*_SORTABLE_FIELDS`). |
| 4.5 | Cache serves repeat visits instantly | Load `/episodes`, navigate away, return within 5 min. | No new `MuiGetMyEvents` POST on return; data renders immediately. Devtools shows the query `fresh`. (5-min `staleTime`.) |
| 4.6 | List auto-refetch only while processing | Have an event/series mid-workflow; watch Network on `/episodes` or `/series`. | The list re-polls (`MuiGetMyEvents`/`MuiGetMySeries`) every ~10 s **only while an item is processing** (`refetchInterval`), then stops. There is **no** refetch on window focus for lists — global default is `refetchOnWindowFocus: false`. |
| 4.7 | Auth query revalidates on focus | Switch to another window/tab, then back to the shell; watch Network. | `MuiGetCurrentUser` refetches on focus. This is the **one** query that opts into `refetchOnWindowFocus: true` (plus `staleTime: 0`, `refetchOnMount: "always"`) — confirms auth state re-checks without a full reload. |
| 4.8 | Server-side attribution (optional) | If your staging Opencast logs GraphQL operation names, grep the Karaf log after the steps above. | Operation names appear `Mui`-prefixed, making them traceable to this UI. ➖ if the backend isn't configured to log operation names — not a release blocker. |

## Section 5 — i18n

| # | Test | Expected |
|---|------|----------|
| 5.1 | Language switcher in header | Visible. Clicking opens a list of available locales. |
| 5.2 | Switch to German | UI strings update; sidebar entries translated; persists on reload. |
| 5.3 | Plugin-specific namespace loads | A plugin-owned key (e.g. `episodes:title`) renders translated. |
| 5.4 | Missing key falls back | Keys without a translation render the English source (or the key itself with a warning), don't crash the page. |

## Section 6 — Configuration

`config.json` is the deployment-time source of truth. Verify it's actually consumed.

The file the shell fetches is `apps/shell/public/ui/config/management-ui/config.json` (served at the origin-absolute path `/ui/config/management-ui/config.json`). For these checks, serve that local file by running either **without** a backend (`pnpm dev`, `VITE_PROXY_TARGET` unset) or **with** a backend plus `VITE_LOCAL_CONFIG=true` (`VITE_PROXY_TARGET=… VITE_LOCAL_CONFIG=true pnpm dev`) — the latter keeps real data/auth while letting you edit config locally. Edit the file and reload to see changes. With a backend and `VITE_LOCAL_CONFIG` unset, config is proxied to the backend and the local file is ignored; edit the backend's config instead. Restart the dev server after changing env vars. See [`docs/getting-started/configuration.md` → Where the host's config.json comes from](../getting-started/configuration.md#where-the-host-s-config-json-comes-from).

| # | Test | Expected |
|---|------|----------|
| 6.1 | Edit `app.theme` in `apps/shell/public/ui/config/management-ui/config.json` | New theme applies after page reload (no dev-server restart). |
| 6.2 | Remove a plugin from `app.enabledPlugins` | Plugin no longer loads; its sidebar entry disappears. |
| 6.3 | Set `config.plugins.episodes.enabled = false` | Episodes plugin loads (it's in the ship filter) but doesn't activate; sidebar entry hidden. |
| 6.4 | Change a plugin's config slice value (e.g. `config.plugins.upload.workflows`) | Plugin reads new value via `definePluginConfig().use()`. |
| 6.5 | Add an unknown top-level key (e.g. `"legacyThing": 1`) and reload | Shell still boots; the unknown key is ignored, not a crash. (Confirms the `[key: string]: unknown` passthrough.) |

## Section 7 — Theming

| # | Test | Expected |
|---|------|----------|
| 7.1 | Default light theme | OKLCH tokens applied; no hardcoded colors visible. |
| 7.2 | Appearance toggle in the header → Dark | All tokens flip to the dark palette; no broken contrast. Defaults to the OS preference (System); choice persists across reload. |
| 7.3 | Appearance toggle → Light / System | Switches back; System follows the OS setting live. |
| 7.4 | Marketplace → Themes → preview a showcase theme (e.g. Oxford Navy) | Color **and** structure change (radius, headings font, shadows) — not just hue. Works in light and dark. |
| 7.5 | Set `app.theme: "forest-sage"` in `config.json`; reload | The same theme applies via config (loaded from `apps/shell/public/plugins/themes/<name>.css`). |
| 7.6 | Drop a custom org theme — `.local-plugins/<org>/themes/<org>.css` (dev) or its JAR at `/static/plugins/<org>/<org>.css` (prod) — overriding `--primary` + `.dark` | Set `app.theme: "<org>"`; reload; primary changes everywhere, in light and dark. |
| 7.7 | No theme CSS overrides component classes directly | grep the theme file — `:root { --primary: … }` / `.dark { … }` only, no `.button { … }`. No external `@import` of web fonts (GDPR/offline). |

## Section 8 — Plugin scaffolding (`pnpm create-plugin`)

The three modes documented in `docs/plugins/distribution.md`.

| # | Command | Expected |
|---|---------|----------|
| 8.1 | `pnpm create-plugin trial-default` | Creates `.local-plugins/trial-default/` with the frontend + `backend/` Maven layout. |
| 8.2 | `pnpm create-plugin trial-no-pom --no-pom` | Creates `.local-plugins/trial-no-pom/` with no `backend/`. |
| 8.3 | `pnpm create-plugin trial-in-tree --in-tree` | Creates `plugins/trial-in-tree/`; no `backend/`. |
| 8.4 | `pnpm --filter @oc-mui/plugin-trial-default test:contract` | Passes on first run. (The placeholder `app:header-logo` registration is intentional.) |
| 8.5 | `pnpm --filter @oc-mui/plugin-trial-default check-types` | Passes. |
| 8.6 | Plugin's `plugin.json` declares `workspaceDependencies` with `Mui` prefix expectation in the README's "Conventions" section | Confirms the scaffold communicates the GraphQL naming + shared-deps contracts. |
| 8.7 | After test, delete the trial plugins | `rm -rf .local-plugins/trial-default .local-plugins/trial-no-pom plugins/trial-in-tree` |

## Section 9 — `.local-plugins/` dev-time loading

| # | Test | Expected |
|---|------|----------|
| 9.1 | Scaffold `pnpm create-plugin demo-local` | Folder created with full Maven layout. |
| 9.2 | `pnpm build` once (builds `@oc-mui/vite-config` etc.), then `pnpm --filter @oc-mui/plugin-demo-local build` | Produces `dist/demo-local.mjs`. The plugin's `vite.config.ts` imports `@oc-mui/vite-config`, so that workspace package must be built first — that's what the scaffold's step 2 (`pnpm build`) is for. |
| 9.3 | Add `"demo-local"` to `app.enabledPlugins` in the served `config.json` | Edit `apps/shell/public/ui/config/management-ui/config.json` and run dev **without** a backend (or with `VITE_LOCAL_CONFIG=true`) so that file is the one served — see §6. (Or inject it via a `.local-plugins/config/` plugin if you use that pattern.) |
| 9.4 | `pnpm dev` and reload | Browser console shows `[demo-local] activated`. Plugin's logo placeholder shows in the header (the `/assets/demo-local-logo.svg` image 404s — that's the expected placeholder; the registration taking effect is the signal). |
| 9.5 | Inspect `http://127.0.0.1:3000/management-ui/local-plugins/manifest.json` | Lists `demo-local` with the correct URL. (The dev manifest is served under the shell base path `/management-ui/`, not at the origin root.) |

## Section 10 — JAR build + deployment

This is the big one. The whole point of Maven scaffolding.

| # | Test | Expected |
|---|------|----------|
| 10.1 | `cd .local-plugins/demo-local/backend && mvn package` | JAR produced at `target/demo-local-1.0.0-SNAPSHOT.jar`. No checkstyle/build errors. |
| 10.2 | Inspect JAR's `MANIFEST.MF` | Contains `Management-Plugin: demo-local`, `Http-Alias: /management-ui/static/plugins/demo-local`, `Http-Classpath: /static/plugins/demo-local`. |
| 10.3 | `unzip -l <jar>` | Contains `static/plugins/demo-local/demo-local.mjs`, `static/plugins/demo-local/plugin.json`. |
| 10.4 | `cp <jar> $OPENCAST_HOME/deploy/` | Opencast picks it up. Inspect Karaf log: `Tracked plugin: demo-local`. |
| 10.5 | `curl http://staging/management-tool/ui/config/plugins.json` | Returns the plugin entry with the correct `scriptUrl`. |
| 10.6 | Reload the shell at staging | Plugin loads from the JAR. Console shows `[demo-local] activated`. |
| 10.7 | `mvn install -DdeployTo=$OPENCAST_HOME` | The convenience copy-to-deploy path works. |
| 10.8 | `mvn package -Dskip.frontend.build=true` (after a manual `pnpm build`) | JAR still produced; frontend not rebuilt. |

## Section 11 — Marketplace (CDN-distributed plugin)

Verifies the dynamic-load path used for community plugins.

| # | Test | Expected |
|---|------|----------|
| 11.1 | Build `dist/demo-local.mjs` and host it on any HTTPS URL with CORS open | (jsDelivr against a tagged GitHub release works; or your own static server.) |
| 11.2 | Navigate to `/admin/marketplace` | UI loads. |
| 11.3 | Developer Mode → paste URL → Try | Plugin loads temporarily. Console shows activation. |
| 11.4 | Reload | Without Install, plugin gone. |
| 11.5 | Developer Mode → paste URL → Install | Plugin persists in localStorage. |
| 11.6 | Reload | Plugin loads on its own without re-entering the URL. |
| 11.7 | Uninstall via marketplace UI | Plugin gone. localStorage entry removed. |

## Section 12 — Contracts enforcement

The mechanical safeguards we built for plugin authors.

| # | Test | Expected |
|---|------|----------|
| 12.1 | Scaffold a plugin, add `query BrokenName { ... }` to its `gql\`\`` | `pnpm --filter @oc-mui/plugin-<name> lint` fails with `local/graphql-operation-naming` violation. |
| 12.2 | Fix to `query PluginPascalNameBrokenName { ... }` | Lint passes. |
| 12.3 | Scaffold a plugin, set `workspaceDependencies.react: "^18.0.0"` in its `plugin.json` | `checkSharedDependencyCompatibility` returns `compatible: false` (verify by importing the function in a quick scratch test, or by waiting for the load-time enforcement landing later — currently the function exists but is not wired into the loader; tracked in OPEN_FOLLOWUPS §5.3). |
| 12.4 | Add a new export to `@oc-mui/plugin-system` and run `pnpm api-check:ci` | Fails — snapshot drift. After regenerating + adding a changeset, passes. |
| 12.5 | Touch a versioned package without adding a changeset | `pnpm changeset:status --since=origin/release/oss-1.0` fails. |

## Section 13 — CI gates

Push the release branch to GitHub (any name; doesn't have to be `release/oss-1.0` for this check).

| # | Test | Expected |
|---|------|----------|
| 13.1 | Push triggers the `Test` workflow | Four jobs run: lint-types, unit, contract, api-check, e2e. All green. |
| 13.2 | Push triggers the `Changeset` workflow | Green if your branch touches a versioned package and includes a changeset; red otherwise. |
| 13.3 | A PR built via push triggers `Deploy docs` workflow (build only — deploy is `workflow_dispatch` until going public) | Green. The doc-site build succeeds against the changes. |

## Section 14 — Documentation site

| # | Test | Expected |
|---|------|----------|
| 14.1 | `pnpm docs:dev` | VitePress dev server at `http://localhost:5173`. |
| 14.2 | Top nav: Get started / Plugins / Architecture / Operations / GitHub | All links resolve. |
| 14.3 | Sidebar (per section) | All entries resolve. |
| 14.4 | Local search | Returns hits for "createPlugin", "Mui", "JAR". |
| 14.5 | Edit-on-GitHub footer link | Opens the source `.md` file on GitHub at the correct branch. |
| 14.6 | Internal docs link (e.g. `[CONTRACTS.md](../architecture/CONTRACTS.md)`) | Routes correctly to `/architecture/contracts`. |
| 14.7 | Source-file link (e.g. `[packages/plugin-system/](../../packages/plugin-system/)`) | Routes to the GitHub URL, opens in a new tab. |
| 14.8 | `pnpm docs:build` | Builds without errors; `docs/.vitepress/dist/` populated. |
| 14.9 | Force-push `release/oss-1.0` to your personal repo + trigger Deploy docs workflow | Pages site updates within ~3 min at `https://<user>.github.io/management-ui/`. |
| 14.10 | View-source on any built page | `<meta name="robots" content="noindex, nofollow">` is present. (Pre-1.0 guard. Goes away in Phase 6d.) |
| 14.11 | `curl https://<user>.github.io/management-ui/robots.txt` | Returns `Disallow: /`. (Pre-1.0 guard.) |

## Section 15 — Authentication (depends on backend)

| # | Test | Expected |
|---|------|----------|
| 15.1 | Sign in via the Opencast auth flow | Lands on the shell with the user populated; `useGetCurrentUser()` returns the user. |
| 15.2 | Sign out | Returns to login or sign-out landing. |
| 15.3 | Open a protected route while signed out | Redirected to login. |
| 15.4 | Role-based UI elements (admin marketplace, etc.) | Shown only when role permits. |

## When this protocol returns ✅ across the board

You're cleared to flip Phase 6d:

1. Open a PR that:
   - Edits `.changeset/config.json` → `"access": "public"`.
   - Deletes `docs/public/robots.txt`'s `Disallow: /` (replace with empty `Disallow:`).
   - Removes the `noindex` meta entry from `docs/.vitepress/config.mts`.
   - Uncomments the `push: branches: [release/oss-1.0]` block in `.github/workflows/docs.yml`.
2. Merge.
3. The next `pnpm changeset version && pnpm changeset publish` cuts the first public release on npm.
4. Announce.

After publishing, this protocol should run again before any **major** bump of the contract-stable packages (`@oc-mui/plugin-system`, `@oc-mui/router`, `@oc-mui/query`, `@oc-mui/i18n`, `@oc-mui/store`, `@oc-mui/ui-config`).

## See also

- [`CONTRIBUTING.md`](../../CONTRIBUTING.md) — the day-to-day dev loop.
- [`docs/operations/ci.md`](./ci.md) — the CI graph this protocol assumes is green.
- [`docs/operations/release.md`](./release.md) — versioning + the publish flow.
- [`docs/operations/open-followups.md`](./open-followups.md) — every known deferred item; check this list as part of the release prep.
